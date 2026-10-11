import { Command } from 'commander';
import { rmSync } from 'node:fs';
import chalk from 'chalk';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';

interface ResetOptions {
  dir?: string;
  force?: boolean;
  deleteData?: boolean;
  volumes?: boolean;
}

export function createResetCommand(): Command {
  const cmd = new Command('reset')
    .description('Reset the stack configuration to a clean state (preserves data volumes by default)')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('--delete-data', 'Permanently delete persistent data volumes (models, database)')
    .option('-v, --volumes', 'Alias for --delete-data')
    .option('--force', 'Skip confirmation prompts')
    .action(async (options: ResetOptions) => {
      await runReset(options);
    });

  return cmd;
}

async function runReset(options: ResetOptions): Promise<void> {
  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  if (!configManager.configExists()) {
    showError('Stack not initialized.', 'Nothing to reset.');
    process.exit(1);
  }

  const shouldDeleteData = Boolean(options.deleteData || options.volumes);

  // 1. General reset confirmation
  if (!options.force) {
    const { default: inquirer } = await import('inquirer');
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will stop services and reset your pondok-ai configuration. Are you sure?',
        default: false,
      },
    ]);

    if (!answer.confirm) {
      logger.info('Aborted.');
      return;
    }

    // 2. Separate explicit confirmation for permanent data deletion
    if (shouldDeleteData) {
      const dataConfirm = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirmDataDelete',
          message: chalk.red.bold('WARNING: This will permanently delete all downloaded models and database state. Confirm?'),
          default: false,
        },
      ]);

      if (!dataConfirm.confirmDataDelete) {
        logger.info('Data deletion cancelled. Preserving data volumes.');
        // Proceed with reset, but without deleting volumes
        return runReset({ ...options, deleteData: false, volumes: false, force: true });
      }
    }
  }

  // Stop services
  const config = configManager.loadConfig();
  if (config) {
    const docker = new DockerClient(
      configManager.getComposePath(),
      configManager.getEnvPath(),
      config.projectName,
    );

    try {
      if (shouldDeleteData) {
        logger.info('Stopping services and removing data volumes...');
        await docker.down(true);
      } else {
        logger.info('Stopping services (preserving data volumes)...');
        await docker.down(false);
      }
    } catch {
      logger.warn('Could not stop services (Docker might not be running)');
    }
  }

  // Remove configuration directory
  try {
    rmSync(configManager.getStackDir(), { recursive: true, force: true });

    if (shouldDeleteData) {
      showSuccess('Stack configuration and data volumes completely removed. Run "pondok-ai init" to start fresh.');
    } else {
      showSuccess('Stack configuration reset. Data volumes preserved. Run "pondok-ai init" to reconfigure.');
    }
  } catch (error) {
    showError(
      `Failed to remove configuration: ${error instanceof Error ? error.message : error}`,
    );
    process.exit(1);
  }
}
