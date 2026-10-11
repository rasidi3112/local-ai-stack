import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';

interface DownOptions {
  dir?: string;
  volumes?: boolean;
  force?: boolean;
}

export function createDownCommand(): Command {
  const cmd = new Command('down')
    .description('Stop and remove the pondok-ai stack')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('-v, --volumes', 'Also remove data volumes (destructive!)')
    .option('--force', 'Skip confirmation prompt')
    .action(async (options: DownOptions) => {
      await runDown(options);
    });

  return cmd;
}

async function runDown(options: DownOptions): Promise<void> {
  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  const config = configManager.loadConfig();
  if (!config) {
    showError(
      'Stack not initialized.',
      'Nothing to stop.',
    );
    process.exit(1);
  }

  // Confirmation for volume removal
  if (options.volumes && !options.force) {
    const { default: inquirer } = await import('inquirer');
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: 'This will delete all data volumes (database, models, etc.). Are you sure?',
        default: false,
      },
    ]);

    if (!answer.confirm) {
      logger.info('Aborted.');
      return;
    }
  }

  const docker = new DockerClient(
    configManager.getComposePath(),
    configManager.getEnvPath(),
    config.projectName,
  );

  try {
    const exitCode = await docker.down(options.volumes);
    if (exitCode !== 0) {
      showError('Failed to stop services.', 'Check Docker status and try again.');
      process.exit(1);
    }

    showSuccess(options.volumes ? 'Stack stopped and volumes removed.' : 'Stack stopped.');
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'Unknown error',
      'Make sure Docker is running.',
    );
    process.exit(1);
  }
}
