import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve, join } from 'node:path';
import { mkdtempSync, rmSync } from 'node:fs';
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

describe('CLI Config Command', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pondok-ai-test-cfg-'));
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should show error when config is run before init', () => {
    const output = runCli('config', testDir);
    expect(output).toContain('Stack not initialized');
  });

  it('should display active configuration after init', () => {
    runCli('init --preset minimal --yes --force', testDir);
    const output = runCli('config', testDir);

    expect(output).toContain('Stack Configuration');
    expect(output).toContain('minimal');
    expect(output).toContain('Ollama');
    expect(output).toContain('Open WebUI');
  });
});
