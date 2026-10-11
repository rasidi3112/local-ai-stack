import { Command } from 'commander';
import { join, resolve } from 'node:path';
import { existsSync, copyFileSync, chmodSync } from 'node:fs';
import ora from 'ora';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager.js';
import { showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';
import { computeFileSha256 } from '../utils/crypto.js';
import { readFile, ensureDir } from '../utils/fs.js';
import { exec } from '../utils/exec.js';
import { isWindows } from '../system/platform.js';
import { BackupManifest } from './backup.js';

interface RestoreOptions {
  dir?: string;
  verifyOnly?: boolean;
  force?: boolean;
}

export function createRestoreCommand(): Command {
  const cmd = new Command('restore')
    .description('Restore stack configuration and persistent data from a SHA-256 integrity-checked backup (not encrypted)')
    .argument('<backup-path>', 'Path to the backup directory')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('--verify-only', 'Validate backup integrity without restoring files')
    .option('-f, --force', 'Skip confirmation prompt before restoring')
    .action(async (backupPath: string, options: RestoreOptions) => {
      try {
        await runRestore(backupPath, options);
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Unknown error during restore',
        );
        process.exit(1);
      }
    });

  return cmd;
}

export async function verifyBackupIntegrity(backupDir: string): Promise<{ valid: boolean; manifest?: BackupManifest; error?: string }> {
  const manifestPath = join(backupDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { valid: false, error: 'manifest.json not found in backup directory' };
  }

  const manifestContent = readFile(manifestPath);
  if (!manifestContent) {
    return { valid: false, error: 'Could not read manifest.json' };
  }

  let manifest: BackupManifest;
  try {
    manifest = JSON.parse(manifestContent) as BackupManifest;
  } catch {
    return { valid: false, error: 'manifest.json contains invalid JSON' };
  }

  // 1. Verify file checksums
  for (const [name, meta] of Object.entries(manifest.files)) {
    const filePath = join(backupDir, name);
    if (!existsSync(filePath)) {
      return { valid: false, error: `Missing file: ${name}` };
    }

    const calculatedSha = computeFileSha256(filePath);
    if (calculatedSha !== meta.sha256) {
      return {
        valid: false,
        error: `Checksum mismatch for ${name} (expected ${meta.sha256}, got ${calculatedSha})`,
      };
    }
  }

  // 2. Verify volume checksums
  for (const vol of manifest.volumes) {
    const volPath = join(backupDir, vol.fileName);
    if (!existsSync(volPath)) {
      return { valid: false, error: `Missing volume archive: ${vol.fileName}` };
    }

    const calculatedSha = computeFileSha256(volPath);
    if (calculatedSha !== vol.sha256) {
      return {
        valid: false,
        error: `Checksum mismatch for volume archive ${vol.fileName} (expected ${vol.sha256}, got ${calculatedSha})`,
      };
    }
  }

  return { valid: true, manifest };
}

export async function runRestore(backupPath: string, options: RestoreOptions): Promise<void> {
  const resolvedBackupDir = resolve(backupPath);

  if (!existsSync(resolvedBackupDir)) {
    throw new Error(`Backup path not found: ${resolvedBackupDir}`);
  }

  const spinner = ora('Validating backup integrity via SHA-256 checksums...').start();
  const integrity = await verifyBackupIntegrity(resolvedBackupDir);

  if (!integrity.valid || !integrity.manifest) {
    spinner.fail('Backup integrity validation failed');
    throw new Error(`Backup integrity validation failed: ${integrity.error ?? 'Corrupted archive'}`);
  }

  spinner.succeed('Backup integrity verified: all checksums match');

  if (options.verifyOnly) {
    console.log(chalk.bold('\nVerified Backup Details:'));
    console.log(`  Project:   ${integrity.manifest.projectName}`);
    console.log(`  Preset:    ${integrity.manifest.preset}`);
    console.log(`  Created:   ${integrity.manifest.createdAt}`);
    console.log(`  Files:     ${Object.keys(integrity.manifest.files).length} verified`);
    console.log(`  Volumes:   ${integrity.manifest.volumes.length} verified\n`);
    showSuccess('Backup archive is valid and ready to be restored.');
    return;
  }

  // Confirmation before restoring
  if (!options.force) {
    const { default: inquirer } = await import('inquirer');
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'Restoring will overwrite current configuration and data volumes. Are you sure?',
        default: false,
      },
    ]);

    if (!answer.confirm) {
      logger.info('Restore cancelled.');
      return;
    }
  }

  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);
  ensureDir(configManager.getStackDir());

  const restoreSpinner = ora('Restoring configuration and data...').start();

  try {
    // 1. Restore configuration files
    for (const name of Object.keys(integrity.manifest.files)) {
      const src = join(resolvedBackupDir, name);
      const dest = join(configManager.getStackDir(), name);
      copyFileSync(src, dest);

      // On Unix, ensure .env is secured
      if (name === '.env' && !isWindows()) {
        try {
          chmodSync(dest, 0o600);
        } catch {
          // ignore permission errors if unsupported filesystem
        }
      }
    }

    // 2. Restore volumes if Docker is available
    let isDockerRunning = false;
    try {
      const dockerCheck = await exec('docker', ['info'], { timeout: 5000 });
      isDockerRunning = dockerCheck.exitCode === 0;
    } catch {
      isDockerRunning = false;
    }

    if (isDockerRunning && integrity.manifest.volumes.length > 0) {
      for (const vol of integrity.manifest.volumes) {
        restoreSpinner.text = `Restoring volume: ${vol.name}...`;

        // Clear volume and extract archive into it
        await exec('docker', [
          'run',
          '--rm',
          '-v', `${vol.name}:/data`,
          '-v', `${resolvedBackupDir}:/backup`,
          'alpine',
          'sh', '-c', `rm -rf /data/* && tar -xzf /backup/${vol.fileName} -C /data`,
        ], { timeout: 120000 });
      }
    }

    restoreSpinner.succeed('Configuration and data restored successfully');
    showSuccess('Stack restored from backup. Run "pondok-ai up" to start services.');
  } catch (error) {
    restoreSpinner.fail('Restore failed');
    throw error;
  }
}
