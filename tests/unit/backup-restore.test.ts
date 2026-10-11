import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { ConfigManager } from '../../src/config/manager.js';
import { runBackup, BackupManifest } from '../../src/commands/backup.js';
import { verifyBackupIntegrity, runRestore } from '../../src/commands/restore.js';

describe('Persistent Data Backup & Restore with Integrity Validation', () => {
  let testDir: string;
  let backupDir: string;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'pondok-ai-backup-test-'));
    backupDir = mkdtempSync(join(tmpdir(), 'pondok-ai-backup-dest-'));

    // Initialize config in testDir
    const configManager = new ConfigManager(testDir);
    const config = configManager.generateConfig('standard');
    configManager.saveConfig(config);
    configManager.generateEnv();
  });

  afterEach(() => {
    try {
      rmSync(testDir, { recursive: true, force: true });
      rmSync(backupDir, { recursive: true, force: true });
    } catch {
      // ignore
    }
  });

  it('should create a backup with configuration and manifest.json containing SHA-256 hashes', async () => {
    const createdPath = await runBackup({
      dir: testDir,
      output: backupDir,
      includeModels: false,
    });

    expect(existsSync(createdPath)).toBe(true);

    const manifestPath = join(createdPath, 'manifest.json');
    expect(existsSync(manifestPath)).toBe(true);

    const manifest: BackupManifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.preset).toBe('standard');
    expect(manifest.files).toHaveProperty('config.json');
    expect(manifest.files).toHaveProperty('.env');

    expect(manifest.files['config.json'].sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(manifest.files['.env'].sha256).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should pass integrity validation on an untampered backup', async () => {
    await runBackup({
      dir: testDir,
      output: backupDir,
      includeModels: false,
    });

    const result = await verifyBackupIntegrity(backupDir);
    expect(result.valid).toBe(true);
    expect(result.manifest).toBeDefined();
    expect(result.error).toBeUndefined();
  });

  it('should detect corruption when a backed-up file is modified or tampered with', async () => {
    await runBackup({
      dir: testDir,
      output: backupDir,
      includeModels: false,
    });

    // Tamper with config.json
    const configPath = join(backupDir, 'config.json');
    writeFileSync(configPath, 'TAMPERED_CONTENT_TEST');

    const result = await verifyBackupIntegrity(backupDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Checksum mismatch for config.json');
  });

  it('should detect missing files declared in manifest', async () => {
    await runBackup({
      dir: testDir,
      output: backupDir,
      includeModels: false,
    });

    // Delete .env
    rmSync(join(backupDir, '.env'));

    const result = await verifyBackupIntegrity(backupDir);
    expect(result.valid).toBe(false);
    expect(result.error).toContain('Missing file: .env');
  });

  it('should restore configuration files cleanly from a valid backup', async () => {
    await runBackup({
      dir: testDir,
      output: backupDir,
      includeModels: false,
    });

    // Create a new restore target directory
    const restoreTargetDir = mkdtempSync(join(tmpdir(), 'pondok-ai-restore-target-'));

    await runRestore(backupDir, {
      dir: restoreTargetDir,
      verifyOnly: false,
      force: true,
    });

    const configManager = new ConfigManager(restoreTargetDir);
    expect(configManager.configExists()).toBe(true);

    const loadedConfig = configManager.loadConfig();
    expect(loadedConfig?.preset).toBe('standard');

    rmSync(restoreTargetDir, { recursive: true, force: true });
  });
});
