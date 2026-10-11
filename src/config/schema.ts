/**
 * Configuration schema types for pondok-ai.
 */

export type Preset = 'minimal' | 'standard' | 'full';

export interface ServiceConfig {
  enabled: boolean;
  port?: number;
  image?: string;
  environment?: Record<string, string>;
}

export interface StackConfig {
  version: number;
  preset: Preset;
  projectName: string;
  services: {
    ollama: ServiceConfig & {
      gpuEnabled: boolean;
    };
    openwebui: ServiceConfig;
    postgres: ServiceConfig & {
      database: string;
      username: string;
    };
    qdrant: ServiceConfig;
    api: ServiceConfig;
    n8n: ServiceConfig;
  };
  network: {
    bindAddress: string;
  };
}

export interface GeneratedEnv {
  POSTGRES_PASSWORD: string;
  API_SECRET_KEY: string;
  N8N_ENCRYPTION_KEY: string;
  [key: string]: string;
}

/**
 * Validate a configuration object. Returns an array of errors.
 */
export function validateConfig(config: unknown): string[] {
  const errors: string[] = [];

  if (typeof config !== 'object' || config === null) {
    errors.push('Configuration must be a JSON object');
    return errors;
  }

  const cfg = config as Record<string, unknown>;

  if (cfg.version !== 1) {
    errors.push('Configuration version must be 1');
  }

  if (!['minimal', 'standard', 'full'].includes(cfg.preset as string)) {
    errors.push(`Invalid preset: ${cfg.preset}. Must be minimal, standard, or full.`);
  }

  if (typeof cfg.projectName !== 'string' || !cfg.projectName) {
    errors.push('projectName must be a non-empty string');
  }

  if (typeof cfg.services !== 'object' || cfg.services === null) {
    errors.push('services must be an object');
  }

  return errors;
}
