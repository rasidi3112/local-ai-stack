import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync, existsSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js');

function runCli(args: string, cwd: string): string {
  try {
    return execSync(`node ${CLI_PATH} ${args}`, {
      cwd,
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env, NO_COLOR: '1' },
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

describe('CLI Init Integration', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pondok-ai-test-'));
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore cleanup errors
    }
  });

  it('should initialize minimal preset in non-interactive mode', () => {
    const output = runCli('init --preset minimal --yes --force', testDir);

    expect(output).toContain('Stack initialized successfully!');

    // Check created files in .pondok-ai
    const configPath = join(testDir, '.pondok-ai', 'config.json');
    const composePath = join(testDir, '.pondok-ai', 'docker-compose.yml');
    const envPath = join(testDir, '.pondok-ai', '.env');

    expect(existsSync(configPath)).toBe(true);
    expect(existsSync(composePath)).toBe(true);
    expect(existsSync(envPath)).toBe(true);

    const config = JSON.parse(readFileSync(configPath, 'utf-8'));
    expect(config.preset).toBe('minimal');
    expect(config.services.ollama.enabled).toBe(true);
    expect(config.services.openwebui.enabled).toBe(true);
    expect(config.services.postgres.enabled).toBe(false);
  });

  it('should initialize standard preset with all companion services', () => {
    const output = runCli('init --preset standard --yes --force', testDir);

    expect(output).toContain('Stack initialized successfully!');

    const configPath = join(testDir, '.pondok-ai', 'config.json');
    const config = JSON.parse(readFileSync(configPath, 'utf-8'));

    expect(config.preset).toBe('standard');
    expect(config.services.ollama.enabled).toBe(true);
    expect(config.services.openwebui.enabled).toBe(true);
    expect(config.services.postgres.enabled).toBe(true);
    expect(config.services.qdrant.enabled).toBe(true);
    expect(config.services.api.enabled).toBe(true);
    expect(config.services.n8n.enabled).toBe(false);

    expect(existsSync(join(testDir, '.pondok-ai', 'api', 'Dockerfile'))).toBe(true);
    expect(existsSync(join(testDir, '.pondok-ai', 'api', 'src', 'index.ts'))).toBe(true);

    // .env should contain secrets
    const envContent = readFileSync(join(testDir, '.pondok-ai', '.env'), 'utf-8');
    expect(envContent).toContain('POSTGRES_PASSWORD=');
    expect(envContent).toContain('API_SECRET_KEY=');
  });

  it('should reject invalid preset', () => {
    const output = runCli('init --preset invalid-preset --yes', testDir);
    expect(output).toContain('Invalid preset');
  });
});
