import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  DEFAULT_IMAGES,
  LEGACY_DEFAULT_IMAGES,
  getDefaultConfig,
} from '../../src/config/defaults.js';
import { ConfigManager } from '../../src/config/manager.js';
import { upgradeStackImagePins } from '../../src/commands/update.js';

describe('pinned image upgrades', () => {
  const testDirectories: string[] = [];

  afterEach(() => {
    for (const directory of testDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('migrates legacy defaults, preserves custom images, and restores the local gateway context', () => {
    const directory = mkdtempSync(join(tmpdir(), 'pondok-ai-update-'));
    testDirectories.push(directory);

    const configManager = new ConfigManager(directory);
    const config = getDefaultConfig('standard');
    config.services.ollama.image = LEGACY_DEFAULT_IMAGES.ollama;
    config.services.openwebui.image = LEGACY_DEFAULT_IMAGES.openwebui;
    config.services.postgres.image = LEGACY_DEFAULT_IMAGES.postgres;
    config.services.qdrant.image = LEGACY_DEFAULT_IMAGES.qdrant;
    config.services.n8n.image = 'registry.example/n8n:custom';
    configManager.saveConfig(config);
    writeFileSync(
      configManager.getEnvPath(),
      'POSTGRES_PASSWORD=test-password\nAPI_SECRET_KEY=test-key\nN8N_ENCRYPTION_KEY=test-key\n',
    );

    expect(upgradeStackImagePins(configManager, config)).toEqual([
      'ollama',
      'openwebui',
      'postgres',
      'qdrant',
    ]);

    const savedConfig = configManager.loadConfig();
    expect(savedConfig?.services.ollama.image).toBe(DEFAULT_IMAGES.ollama);
    expect(savedConfig?.services.openwebui.image).toBe(DEFAULT_IMAGES.openwebui);
    expect(savedConfig?.services.postgres.image).toBe(DEFAULT_IMAGES.postgres);
    expect(savedConfig?.services.qdrant.image).toBe(DEFAULT_IMAGES.qdrant);
    expect(savedConfig?.services.n8n.image).toBe('registry.example/n8n:custom');
    expect(existsSync(join(configManager.getStackDir(), 'api', 'Dockerfile'))).toBe(true);

    const compose = readFileSync(configManager.getComposePath(), 'utf-8');
    expect(compose).toContain(DEFAULT_IMAGES.ollama);
    expect(compose).toContain('context: ./api');
  });
});
