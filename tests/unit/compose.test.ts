import { describe, it, expect } from 'vitest';
import { generateComposeFile } from '../../src/docker/compose.js';
import {
  DEFAULT_IMAGES,
  getDefaultConfig,
  upgradeLegacyDefaultImages,
} from '../../src/config/defaults.js';
import { GeneratedEnv } from '../../src/config/schema.js';
import { load as yamlLoad } from 'js-yaml';

const mockEnv: GeneratedEnv = {
  POSTGRES_PASSWORD: 'test-password-123',
  API_SECRET_KEY: 'test-api-key-456',
  N8N_ENCRYPTION_KEY: 'test-n8n-key-789',
};

describe('Docker Compose Generator', () => {
  describe('Image version pins', () => {
    it('should use explicit version tags for every remote default image', () => {
      expect(DEFAULT_IMAGES).toEqual({
        ollama: 'ollama/ollama:0.40.2',
        openwebui: 'ghcr.io/open-webui/open-webui:v0.11.4',
        postgres: 'postgres:16.15-alpine3.24',
        qdrant: 'qdrant/qdrant:v1.19.2',
        n8n: 'n8nio/n8n:2.42.6',
      });
    });

    it('should upgrade legacy defaults without replacing custom images', () => {
      const config = getDefaultConfig('full');
      config.services.ollama.image = 'ollama/ollama:latest';
      config.services.openwebui.image = 'ghcr.io/open-webui/open-webui:main';
      config.services.postgres.image = 'postgres:16-alpine';
      config.services.qdrant.image = 'qdrant/qdrant:latest';
      config.services.n8n.image = 'custom.registry/n8n:custom';

      expect(upgradeLegacyDefaultImages(config)).toEqual([
        'ollama',
        'openwebui',
        'postgres',
        'qdrant',
      ]);
      expect(config.services.ollama.image).toBe(DEFAULT_IMAGES.ollama);
      expect(config.services.openwebui.image).toBe(DEFAULT_IMAGES.openwebui);
      expect(config.services.postgres.image).toBe(DEFAULT_IMAGES.postgres);
      expect(config.services.qdrant.image).toBe(DEFAULT_IMAGES.qdrant);
      expect(config.services.n8n.image).toBe('custom.registry/n8n:custom');
    });
  });

  describe('Minimal preset', () => {
    it('should generate valid YAML', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      expect(() => yamlLoad(yaml)).not.toThrow();
    });

    it('should include only Ollama and Open WebUI services', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, unknown>;
      expect(Object.keys(services)).toEqual(['ollama', 'openwebui']);
    });

    it('should bind to localhost by default', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      expect(yaml).toContain('127.0.0.1:');
    });

    it('should not include GPU config by default', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      expect(yaml).not.toContain('nvidia');
      expect(yaml).not.toContain('deploy');
    });
  });

  describe('Standard preset', () => {
    it('should include all standard services', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, unknown>;
      expect(Object.keys(services)).toContain('ollama');
      expect(Object.keys(services)).toContain('openwebui');
      expect(Object.keys(services)).toContain('postgres');
      expect(Object.keys(services)).toContain('qdrant');
      expect(Object.keys(services)).toContain('api');
      expect(Object.keys(services)).not.toContain('n8n');
    });

    it('should not expose postgres to host', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { ports?: string[] }>;
      expect(services.postgres.ports).toBeUndefined();
    });

    it('should set up service dependencies', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { depends_on?: Record<string, unknown> }>;
      expect(services.openwebui.depends_on).toHaveProperty('ollama');
      expect(services.api.depends_on).toHaveProperty('ollama');
      expect(services.api.depends_on).toHaveProperty('postgres');
    });

    it('should build the bundled API gateway locally', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<
        string,
        { build?: { context: string }; image?: string }
      >;

      expect(services.api.build).toEqual({ context: './api' });
      expect(services.api.image).toBeUndefined();
    });

    it('should pass configurable API Gateway rate-limit settings', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { environment?: Record<string, string> }>;

      expect(services.api.environment).toMatchObject({
        RATE_LIMIT_MAX_REQUESTS: '${RATE_LIMIT_MAX_REQUESTS:-120}',
        RATE_LIMIT_WINDOW_MS: '${RATE_LIMIT_WINDOW_MS:-60000}',
      });
    });

    it('should use the local gateway build for the legacy default image', () => {
      const config = getDefaultConfig('standard');
      config.services.api.image = 'local-ai-stack-api:latest';
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { build?: { context: string } }>;

      expect(services.api.build).toEqual({ context: './api' });
    });

    it('should include health checks for all health-checkable services', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { healthcheck?: unknown }>;
      expect(services.ollama.healthcheck).toBeDefined();
      expect(services.postgres.healthcheck).toBeDefined();
      expect(services.qdrant.healthcheck).toBeDefined();
      expect(services.api.healthcheck).toBeDefined();
    });

    it('should use ollama list and not use curl for ollama health check', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { healthcheck?: { test: string[] } }>;

      expect(services.ollama.healthcheck?.test).toEqual(['CMD', 'ollama', 'list']);
      const testCommand = services.ollama.healthcheck?.test.join(' ') ?? '';
      expect(testCommand).not.toContain('curl');
      expect(testCommand).not.toContain('wget');
    });

    it('should use bash tcp probe and not use curl or wget for qdrant health check', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { healthcheck?: { test: string[] } }>;

      expect(services.qdrant.healthcheck?.test).toEqual(['CMD', 'bash', '-c', ':> /dev/tcp/127.0.0.1/6333']);
      const testCommand = services.qdrant.healthcheck?.test.join(' ') ?? '';
      expect(testCommand).not.toContain('curl');
      expect(testCommand).not.toContain('wget');
    });

    it('should use node fetch probe and not use curl for api health check', () => {
      const config = getDefaultConfig('standard');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, { healthcheck?: { test: string[] } }>;

      expect(services.api.healthcheck?.test).toEqual([
        'CMD',
        'node',
        '-e',
        "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))",
      ]);
      const testCommand = services.api.healthcheck?.test.join(' ') ?? '';
      expect(testCommand).not.toContain('curl');
    });
  });

  describe('Full preset', () => {
    it('should include n8n', () => {
      const config = getDefaultConfig('full');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const services = parsed.services as Record<string, unknown>;
      expect(Object.keys(services)).toContain('n8n');
    });
  });

  describe('GPU support', () => {
    it('should add NVIDIA GPU reservation when enabled', () => {
      const config = getDefaultConfig('minimal');
      config.services.ollama.gpuEnabled = true;
      const yaml = generateComposeFile(config, mockEnv);
      expect(yaml).toContain('nvidia');
      expect(yaml).toContain('gpu');
    });
  });

  describe('Volumes', () => {
    it('should define volumes for all data-persistent services', () => {
      const config = getDefaultConfig('full');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const volumes = parsed.volumes as Record<string, unknown>;
      expect(volumes).toHaveProperty('ollama-data');
      expect(volumes).toHaveProperty('openwebui-data');
      expect(volumes).toHaveProperty('postgres-data');
      expect(volumes).toHaveProperty('qdrant-data');
      expect(volumes).toHaveProperty('n8n-data');
    });
  });

  describe('Network', () => {
    it('should define a bridge network', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      const parsed = yamlLoad(yaml) as Record<string, unknown>;
      const networks = parsed.networks as Record<string, { driver: string }>;
      expect(networks['local-ai-network']).toEqual({ driver: 'bridge' });
    });
  });

  describe('Header comment', () => {
    it('should include a generated-by comment', () => {
      const config = getDefaultConfig('minimal');
      const yaml = generateComposeFile(config, mockEnv);
      expect(yaml).toContain('Generated by local-ai-stack');
    });
  });
});
