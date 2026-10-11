import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { resolve } from 'node:path';

const CLI_PATH = resolve(import.meta.dirname, '../../dist/index.js');

function runCli(args: string): string {
  try {
    return execSync(`node ${CLI_PATH} ${args}`, {
      encoding: 'utf-8',
      timeout: 10000,
      env: { ...process.env, NO_COLOR: '1' },
    });
  } catch (error) {
    const err = error as { stdout?: string; stderr?: string };
    return (err.stdout ?? '') + (err.stderr ?? '');
  }
}

describe('CLI Help', () => {
  it('should display help when --help is passed', () => {
    const output = runCli('--help');
    expect(output).toContain('pondok-ai');
    expect(output).toContain('Run your own private AI stack locally');
  });

  it('should list all commands in help', () => {
    const output = runCli('--help');
    expect(output).toContain('init');
    expect(output).toContain('up');
    expect(output).toContain('down');
    expect(output).toContain('start');
    expect(output).toContain('stop');
    expect(output).toContain('restart');
    expect(output).toContain('status');
    expect(output).toContain('logs');
    expect(output).toContain('doctor');
    expect(output).toContain('update');
    expect(output).toContain('reset');
    expect(output).toContain('config');
    expect(output).toContain('model');
    expect(output).toContain('backup');
    expect(output).toContain('restore');
  });

  it('should display help for init command', () => {
    const output = runCli('init --help');
    expect(output).toContain('--preset');
    expect(output).toContain('--non-interactive');
    expect(output).toContain('--gpu');
    expect(output).toContain('--force');
  });

  it('should display help for model command including recommend', () => {
    const output = runCli('model --help');
    expect(output).toContain('list');
    expect(output).toContain('install');
    expect(output).toContain('remove');
    expect(output).toContain('status');
    expect(output).toContain('recommend');
  });

  it('should display help for backup and restore commands', () => {
    const backupHelp = runCli('backup --help');
    expect(backupHelp).toContain('--output');
    expect(backupHelp).toContain('--include-models');

    const restoreHelp = runCli('restore --help');
    expect(restoreHelp).toContain('--verify-only');
    expect(restoreHelp).toContain('--force');
  });

  it('should display help for config command', () => {
    const output = runCli('config --help');
    expect(output).toContain('show');
    expect(output).toContain('path');
    expect(output).toContain('edit');
  });

  it('should expose the explicit pinned-image upgrade option', () => {
    const output = runCli('update --help');

    expect(output).toContain('--upgrade-images');
    expect(output).toContain('pinned tags');
  });
});

describe('CLI Version', () => {
  it('should display version when --version is passed', () => {
    const output = runCli('--version');
    expect(output.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });
});
