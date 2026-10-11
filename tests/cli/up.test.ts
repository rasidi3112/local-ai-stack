import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { getDefaultConfig } from '../../src/config/defaults.js';

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js');

function createStack(testDir: string, invalidKey: string, invalidValue: string): void {
  const stackDir = join(testDir, '.pondok-ai');
  mkdirSync(stackDir, { recursive: true });
  writeFileSync(join(stackDir, 'config.json'), `${JSON.stringify(getDefaultConfig('minimal'))}\n`);

  const env = {
    POSTGRES_PASSWORD: 'postgres-password',
    API_SECRET_KEY: 'api-secret-key',
    N8N_ENCRYPTION_KEY: 'n8n-encryption-key',
    [invalidKey]: invalidValue,
  };
  writeFileSync(
    join(stackDir, '.env'),
    Object.entries(env)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n') + '\n',
  );
}

function runCli(testDir: string): { output: string; status: number | null } {
  const result = spawnSync(
    process.execPath,
    [CLI_PATH, 'up', '--dir', testDir, '--no-healthcheck'],
    {
      cwd: testDir,
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env, NO_COLOR: '1' },
    },
  );

  return {
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`,
    status: result.status,
  };
}

describe('CLI up credential guard', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pondok-ai-up-test-'));
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it.each([
    ['POSTGRES_PASSWORD', ''],
    ['API_SECRET_KEY', 'replace_with_secure_random_api_key'],
    ['N8N_ENCRYPTION_KEY', 'replace_with_32_character_encryption_key'],
  ])('rejects invalid %s before invoking Docker Compose', (key, value) => {
    createStack(testDir, key, value);

    const result = runCli(testDir);

    expect(result.status).toBe(1);
    expect(result.output).toContain(`Invalid required secret value(s): ${key}`);
    expect(result.output).toContain('pondok-ai init');
    expect(result.output).not.toContain('Validating Docker Compose configuration');
  });
});
