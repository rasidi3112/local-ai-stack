import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { getDefaultConfig, PRESET_SERVICES } from '../../src/config/defaults.js';
import { generateComposeFile } from '../../src/docker/compose.js';
import { ConfigManager } from '../../src/config/manager.js';
import { isWindows } from '../../src/system/platform.js';
import { load as yamlLoad } from 'js-yaml';

describe('Privacy-First Security & Data Safety', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pondok-ai-security-test-'));
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  describe('Localhost Binding & Network Isolation', () => {
    it('should default bind address strictly to 127.0.0.1 in all presets', () => {
      const presets = ['minimal', 'standard', 'full'] as const;

      for (const preset of presets) {
        const config = getDefaultConfig(preset);
        expect(config.network.bindAddress).toBe('127.0.0.1');

        const composeYaml = generateComposeFile(config);
        const parsed = yamlLoad(composeYaml) as Record<string, any>;

        // Verify exposed service ports are prefixed with 127.0.0.1
        for (const [svcName, svcDef] of Object.entries<any>(parsed.services)) {
          if (svcDef.ports) {
            for (const portMapping of svcDef.ports) {
              expect(portMapping).toMatch(/^127\.0\.0\.1:/);
            }
          }
        }
      }
    });

    it('should not expose internal database services (Postgres) by default', () => {
      const config = getDefaultConfig('standard');
      const composeYaml = generateComposeFile(config);
      const parsed = yamlLoad(composeYaml) as Record<string, any>;

      // Postgres should exist but have no host port mapping
      expect(parsed.services.postgres).toBeDefined();
      expect(parsed.services.postgres.ports).toBeUndefined();
    });
  });

  describe('Credential Protection & File Permissions', () => {
    it('should restrict .env permissions to 0600 on Unix systems', () => {
      const configManager = new ConfigManager(testDir);
      configManager.generateEnv();

      const envPath = configManager.getEnvPath();
      expect(existsSync(envPath)).toBe(true);

      if (!isWindows()) {
        const stats = statSync(envPath);
        const mode = stats.mode & 0o777;
        // 0600 = user read/write only
        expect(mode).toBe(0o600);
      }
    });

    it('should generate high-entropy random keys for API and database', () => {
      const configManager = new ConfigManager(testDir);
      const env = configManager.generateEnv();

      expect(env.POSTGRES_PASSWORD).toHaveLength(24);
      expect(env.API_SECRET_KEY).toHaveLength(32);
      expect(env.N8N_ENCRYPTION_KEY).toHaveLength(32);

      // Verify second generation creates different unique keys
      const env2 = configManager.generateEnv(true);
      expect(env2.POSTGRES_PASSWORD).not.toBe(env.POSTGRES_PASSWORD);
      expect(env2.API_SECRET_KEY).not.toBe(env.API_SECRET_KEY);
    });
  });
});
