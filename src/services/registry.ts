/**
 * Service registry — metadata about each service in the stack.
 */

export interface ServiceMeta {
  name: string;
  displayName: string;
  description: string;
  defaultPort: number;
  healthEndpoint?: string;
  docsUrl: string;
  isInternal: boolean; // true = not exposed to host by default
}

export const SERVICE_REGISTRY: Record<string, ServiceMeta> = {
  ollama: {
    name: 'ollama',
    displayName: 'Ollama',
    description: 'Local LLM inference engine',
    defaultPort: 11434,
    healthEndpoint: 'http://localhost:11434/',
    docsUrl: 'https://ollama.com',
    isInternal: false,
  },
  openwebui: {
    name: 'openwebui',
    displayName: 'Open WebUI',
    description: 'Chat interface for Ollama',
    defaultPort: 3000,
    healthEndpoint: 'http://localhost:3000/',
    docsUrl: 'https://github.com/open-webui/open-webui',
    isInternal: false,
  },
  postgres: {
    name: 'postgres',
    displayName: 'PostgreSQL',
    description: 'Relational database',
    defaultPort: 5432,
    docsUrl: 'https://www.postgresql.org',
    isInternal: true,
  },
  qdrant: {
    name: 'qdrant',
    displayName: 'Qdrant',
    description: 'Vector database for RAG',
    defaultPort: 6333,
    healthEndpoint: 'http://localhost:6333/healthz',
    docsUrl: 'https://qdrant.tech',
    isInternal: false,
  },
  api: {
    name: 'api',
    displayName: 'API Gateway',
    description: 'OpenAI-compatible API proxy',
    defaultPort: 8000,
    healthEndpoint: 'http://localhost:8000/health',
    docsUrl: 'https://github.com/rasidi3112/pondok-ai',
    isInternal: false,
  },
  n8n: {
    name: 'n8n',
    displayName: 'n8n',
    description: 'Workflow automation',
    defaultPort: 5678,
    healthEndpoint: 'http://localhost:5678/healthz',
    docsUrl: 'https://n8n.io',
    isInternal: false,
  },
};

/**
 * Get the list of services that have a health endpoint.
 */
export function getHealthCheckableServices(): ServiceMeta[] {
  return Object.values(SERVICE_REGISTRY).filter((s) => s.healthEndpoint);
}
