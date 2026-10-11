import { Command } from 'commander';
import { join, resolve } from 'node:path';
import { existsSync, mkdirSync, copyFileSync, statSync } from 'node:fs';
import ora from 'ora';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager.js';
import { showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';
import { computeFileSha256 } from '../utils/crypto.js';
import { writeFile } from '../utils/fs.js';
import { exec } from '../utils/exec.js';

export interface BackupManifest {
  version: string;
  createdAt: string;
  projectName: string;
  preset: string;
  files: Record<string, { sizeBytes: number; sha256: string }>;
  volumes: Array<{ name: string; fileName: string; sizeBytes: number; sha256: string }>;
}

interface BackupOptions {
  dir?: string;
  output?: string;
  includeModels?: boolean;
}

export function createBackupCommand(): Command {
  const cmd = new Command('backup')
    .description('Backup stack configuration and persistent data volumes with SHA-256 integrity checks (not encrypted)')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('-o, --output <path>', 'Output backup directory')
    .option('--include-models', 'Include large Ollama model weights in the backup', false)
    .action(async (options: BackupOptions) => {
      try {
        await runBackup(options);
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Unknown error during backup',
        );
        process.exit(1);
      }
    });

  return cmd;
}

export async function runBackup(options: BackupOptions): Promise<string> {
  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  const config = configManager.loadConfig();
  if (!config) {
    throw new Error('Stack not initialized. Run "pondok-ai init" first.');
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDirName = `backup-${config.projectName}-${timestamp}`;
  const targetDir = options.output
    ? resolve(options.output)
    : join(configManager.getStackDir(), 'backups', backupDirName);

  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }

  const spinner = ora('Creating persistent data backup...').start();

  try {
    const manifest: BackupManifest = {
      version: '0.1.0',
      createdAt: new Date().toISOString(),
      projectName: config.projectName,
      preset: config.preset,
      files: {},
      volumes: [],
    };

    // 1. Backup configuration files
    const configSourceFiles = [
      { name: 'config.json', path: configManager.getConfigPath() },
      { name: '.env', path: configManager.getEnvPath() },
      { name: 'docker-compose.yml', path: configManager.getComposePath() },
    ];

    for (const src of configSourceFiles) {
      if (existsSync(src.path)) {
        const destPath = join(targetDir, src.name);
        copyFileSync(src.path, destPath);
        const stats = statSync(destPath);
        const sha256 = computeFileSha256(destPath);

        manifest.files[src.name] = {
          sizeBytes: stats.size,
          sha256,
        };
      }
    }

    // 2. Backup volumes if Docker is available
    const volumesToBackup: string[] = [];
    if (config.services.postgres.enabled) volumesToBackup.push('postgres-data');
    if (config.services.qdrant.enabled) volumesToBackup.push('qdrant-data');
    if (config.services.openwebui.enabled) volumesToBackup.push('openwebui-data');
    if (config.services.n8n.enabled) volumesToBackup.push('n8n-data');
    if (options.includeModels && config.services.ollama.enabled) {
      volumesToBackup.push('ollama-data');
    }

    // Check if Docker is running
    let isDockerRunning = false;
    try {
      const dockerCheck = await exec('docker', ['info'], { timeout: 5000 });
      isDockerRunning = dockerCheck.exitCode === 0;
    } catch {
      isDockerRunning = false;
    }

    if (isDockerRunning && volumesToBackup.length > 0) {
      for (const vol of volumesToBackup) {
        spinner.text = `Exporting volume: ${vol}...`;
        const archiveName = `${vol}.tar.gz`;
        const archivePath = join(targetDir, archiveName);

        // Export volume content via alpine container
        const exportResult = await exec('docker', [
          'run',
          '--rm',
          '-v', `${vol}:/data:ro`,
          '-v', `${targetDir}:/backup`,
          'alpine',
          'tar', '-czf', `/backup/${archiveName}`, '-C', '/data', '.',
        ], { timeout: 120000 });

        if (exportResult.exitCode === 0 && existsSync(archivePath)) {
          const stats = statSync(archivePath);
          const sha256 = computeFileSha256(archivePath);

          manifest.volumes.push({
            name: vol,
            fileName: archiveName,
            sizeBytes: stats.size,
            sha256,
          });
        } else {
          logger.debug(`Could not export volume ${vol}: ${exportResult.stderr}`);
        }
      }
    } else if (!isDockerRunning && volumesToBackup.length > 0) {
      logger.warn('Docker daemon not running: backed up configuration files only.');
    }

    // 3. Write manifest.json
    const manifestPath = join(targetDir, 'manifest.json');
    writeFile(manifestPath, JSON.stringify(manifest, null, 2));

    spinner.succeed(`Backup created at: ${chalk.cyan(targetDir)}`);

    console.log(chalk.bold('\nBackup Integrity Manifest:'));
    for (const [name, meta] of Object.entries(manifest.files)) {
      console.log(`  ✓ ${name.padEnd(20)} [${meta.sizeBytes} bytes] SHA-256: ${chalk.gray(meta.sha256.slice(0, 16))}...`);
    }
    for (const vol of manifest.volumes) {
      console.log(`  ✓ Volume: ${vol.name.padEnd(14)} [${vol.sizeBytes} bytes] SHA-256: ${chalk.gray(vol.sha256.slice(0, 16))}...`);
    }
    console.log();

    showSuccess('Backup completed with SHA-256 integrity checks (not encrypted).');
    return targetDir;
  } catch (error) {
    spinner.fail('Backup failed');
    throw error;
  }
}
