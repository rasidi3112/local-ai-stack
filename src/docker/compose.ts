import { dump as yamlDump } from 'js-yaml';
import { DEFAULT_IMAGES, LEGACY_DEFAULT_API_IMAGE } from '../config/defaults.js';
import { GeneratedEnv, StackConfig } from '../config/schema.js';

interface ComposeBuild {
  context: string;
  dockerfile?: string;
}

interface ComposeService {
  image?: string;
  build?: ComposeBuild;
  container_name: string;
  restart: string;
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string>;
  depends_on?: Record<string, { condition: string }> | string[];
  networks?: string[];
  healthcheck?: {
    test: string[];
    interval: string;
    timeout: string;
    retries: number;
    start_period?: string;
  };
  deploy?: {
    resources: {
      reservations: {
        devices: Array<{
          driver: string;
          count: string;
          capabilities: string[];
        }>;
      };
    };
  };
}

interface ComposeFile {
  name: string;
  services: Record<string, ComposeService>;
  volumes: Record<string, { driver: string }>;
  networks: Record<string, { driver: string }>;
}

/**
 * Generate a Docker Compose file from the stack configuration.
 */
export function generateComposeFile(config: StackConfig, _env?: GeneratedEnv): string {
  const compose: ComposeFile = {
    name: config.projectName,
    services: {},
    volumes: {},
    networks: {
      'local-ai-network': { driver: 'bridge' },
    },
  };

  const bind = config.network.bindAddress;

  // Ollama
  if (config.services.ollama.enabled) {
    const ollamaService: ComposeService = {
      image: config.services.ollama.image ?? DEFAULT_IMAGES.ollama,
      container_name: `${config.projectName}-ollama`,
      restart: 'unless-stopped',
      ports: [`${bind}:${config.services.ollama.port}:11434`],
      volumes: ['ollama-data:/root/.ollama'],
      networks: ['local-ai-network'],
      healthcheck: {
        test: ['CMD', 'ollama', 'list'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
        start_period: '10s',
      },
    };

    // GPU support
    if (config.services.ollama.gpuEnabled) {
      ollamaService.deploy = {
        resources: {
          reservations: {
            devices: [
              {
                driver: 'nvidia',
                count: 'all',
                capabilities: ['gpu'],
              },
            ],
          },
        },
      };
    }

    compose.services.ollama = ollamaService;
    compose.volumes['ollama-data'] = { driver: 'local' };
  }

  // Open WebUI
  if (config.services.openwebui.enabled) {
    const openwebuiService: ComposeService = {
      image: config.services.openwebui.image ?? DEFAULT_IMAGES.openwebui,
      container_name: `${config.projectName}-openwebui`,
      restart: 'unless-stopped',
      ports: [`${bind}:${config.services.openwebui.port}:8080`],
      volumes: ['openwebui-data:/app/backend/data'],
      environment: {
        OLLAMA_BASE_URL: 'http://ollama:11434',
      },
      networks: ['local-ai-network'],
      depends_on: {
        ollama: { condition: 'service_healthy' },
      },
    };

    compose.services.openwebui = openwebuiService;
    compose.volumes['openwebui-data'] = { driver: 'local' };
  }

  // PostgreSQL
  if (config.services.postgres.enabled) {
    compose.services.postgres = {
      image: config.services.postgres.image ?? DEFAULT_IMAGES.postgres,
      container_name: `${config.projectName}-postgres`,
      restart: 'unless-stopped',
      // Postgres is internal — not exposed to host by default
      volumes: ['postgres-data:/var/lib/postgresql/data'],
      environment: {
        POSTGRES_DB: config.services.postgres.database,
        POSTGRES_USER: config.services.postgres.username,
        POSTGRES_PASSWORD: '${POSTGRES_PASSWORD}',
      },
      networks: ['local-ai-network'],
      healthcheck: {
        test: ['CMD-SHELL', 'pg_isready -U ${POSTGRES_USER:-localaistack}'],
        interval: '10s',
        timeout: '5s',
        retries: 5,
        start_period: '10s',
      },
    };

    compose.volumes['postgres-data'] = { driver: 'local' };
  }

  // Qdrant
  if (config.services.qdrant.enabled) {
    compose.services.qdrant = {
      image: config.services.qdrant.image ?? DEFAULT_IMAGES.qdrant,
      container_name: `${config.projectName}-qdrant`,
      restart: 'unless-stopped',
      ports: [`${bind}:${config.services.qdrant.port}:6333`],
      volumes: ['qdrant-data:/qdrant/storage'],
      networks: ['local-ai-network'],
      healthcheck: {
        test: ['CMD-SHELL', 'curl -f http://localhost:6333/healthz || exit 1'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
      },
    };

    compose.volumes['qdrant-data'] = { driver: 'local' };
  }

  // API Gateway
  if (config.services.api.enabled) {
    const apiDependsOn: Record<string, { condition: string }> = {};
    if (config.services.ollama.enabled) {
      apiDependsOn.ollama = { condition: 'service_healthy' };
    }
    if (config.services.postgres.enabled) {
      apiDependsOn.postgres = { condition: 'service_healthy' };
    }
    if (config.services.qdrant.enabled) {
      apiDependsOn.qdrant = { condition: 'service_healthy' };
    }

    const apiService: ComposeService = {
      build: { context: './api' },
      container_name: `${config.projectName}-api`,
      restart: 'unless-stopped',
      ports: [`${bind}:${config.services.api.port}:8000`],
      environment: {
        OLLAMA_BASE_URL: 'http://ollama:11434',
        QDRANT_URL: config.services.qdrant.enabled ? 'http://qdrant:6333' : '',
        DATABASE_URL: config.services.postgres.enabled
          ? 'postgresql://${POSTGRES_USER:-localaistack}:${POSTGRES_PASSWORD}@postgres:5432/${POSTGRES_DB:-localaistack}'
          : '',
        API_SECRET_KEY: '${API_SECRET_KEY}',
        CORS_ORIGINS: '${CORS_ORIGINS:-}',
        RATE_LIMIT_MAX_REQUESTS: '${RATE_LIMIT_MAX_REQUESTS:-120}',
        RATE_LIMIT_WINDOW_MS: '${RATE_LIMIT_WINDOW_MS:-60000}',
        NODE_ENV: 'production',
      },
      networks: ['local-ai-network'],
      depends_on: apiDependsOn,
      healthcheck: {
        test: ['CMD-SHELL', 'curl -f http://localhost:8000/health || exit 1'],
        interval: '30s',
        timeout: '10s',
        retries: 3,
      },
    };

    if (config.services.api.image && config.services.api.image !== LEGACY_DEFAULT_API_IMAGE) {
      delete apiService.build;
      apiService.image = config.services.api.image;
    }

    compose.services.api = apiService;
  }

  // n8n
  if (config.services.n8n.enabled) {
    const n8nDependsOn: Record<string, { condition: string }> = {};
    if (config.services.postgres.enabled) {
      n8nDependsOn.postgres = { condition: 'service_healthy' };
    }

    compose.services.n8n = {
      image: config.services.n8n.image ?? DEFAULT_IMAGES.n8n,
      container_name: `${config.projectName}-n8n`,
      restart: 'unless-stopped',
      ports: [`${bind}:${config.services.n8n.port}:5678`],
      volumes: ['n8n-data:/home/node/.n8n'],
      environment: {
        N8N_ENCRYPTION_KEY: '${N8N_ENCRYPTION_KEY}',
        DB_TYPE: config.services.postgres.enabled ? 'postgresdb' : 'sqlite',
        DB_POSTGRESDB_HOST: 'postgres',
        DB_POSTGRESDB_PORT: '5432',
        DB_POSTGRESDB_DATABASE: config.services.postgres.database,
        DB_POSTGRESDB_USER: config.services.postgres.username,
        DB_POSTGRESDB_PASSWORD: '${POSTGRES_PASSWORD}',
        WEBHOOK_URL: `http://localhost:${config.services.n8n.port}/`,
      },
      networks: ['local-ai-network'],
      depends_on: n8nDependsOn,
    };

    compose.volumes['n8n-data'] = { driver: 'local' };
  }

  // Use js-yaml to generate YAML with proper formatting
  const yamlContent = yamlDump(compose, {
    lineWidth: 120,
    noRefs: true,
    quotingType: '"',
    forceQuotes: false,
  });

  return `# Generated by local-ai-stack\n# Do not edit this file directly — use 'local-ai-stack config' instead.\n\n${yamlContent}`;
}
