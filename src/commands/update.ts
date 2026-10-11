import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import ora from 'ora';
import { ConfigManager } from '../config/manager.js';
import { LEGACY_DEFAULT_API_IMAGE, upgradeLegacyDefaultImages } from '../config/defaults.js';
import type { StackConfig } from '../config/schema.js';
import { DockerClient } from '../docker/client.js';
import { generateComposeFile } from '../docker/compose.js';
import { showError, showSuccess } from '../cli/ui.js';
import { copyGatewayBuildContext } from '../system/resources.js';
import { writeFile } from '../utils/fs.js';
import { logger } from '../utils/logger.js';

interface UpdateOptions {
  dir?: string;
  backup?: boolean;
  restart?: boolean;
  upgradeImages?: boolean;
  timeout?: string;
}

export function createUpdateCommand(): Command {
  const cmd = new Command('update')
    .description('Refresh configured pinned Docker images with backup and health validation')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('--no-backup', 'Skip automatic pre-update backup')
    .option('--no-restart', 'Do not recreate containers after pulling')
    .option(
      '--upgrade-images',
      "Upgrade legacy default image tags to this CLI version's pinned tags",
    )
    .option('-t, --timeout <seconds>', 'Timeout in seconds for post-update health checks', '45')
    .action(async (options: UpdateOptions) => {
      await runUpdate(options);
    });

  return cmd;
}

/**
 * Persist an explicit opt-in migration from legacy floating image tags to the
 * versions bundled with this CLI. Custom image values remain untouched.
 */
export function upgradeStackImagePins(configManager: ConfigManager, config: StackConfig): string[] {
  const upgradedServices = upgradeLegacyDefaultImages(config);
  const gatewayContext = join(configManager.getStackDir(), 'api');
  const usesLocalGateway =
    !config.services.api.image || config.services.api.image === LEGACY_DEFAULT_API_IMAGE;

  if (
    config.services.api.enabled &&
    usesLocalGateway &&
    !existsSync(join(gatewayContext, 'Dockerfile'))
  ) {
    copyGatewayBuildContext(gatewayContext);
  }

  configManager.saveConfig(config);
  writeFile(configManager.getComposePath(), generateComposeFile(config, configManager.loadEnv()));

  return upgradedServices;
}

async function runUpdate(options: UpdateOptions): Promise<void> {
  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  const config = configManager.loadConfig();
  if (!config) {
    showError('Stack not initialized.', 'Run "pondok-ai init" first.');
    process.exit(1);
  }

  const docker = new DockerClient(
    configManager.getComposePath(),
    configManager.getEnvPath(),
    config.projectName,
  );

  // 1. Pre-update safety backup
  if (options.backup !== false) {
    try {
      const { runBackup } = await import('./backup.js');
      await runBackup({ dir: baseDir, includeModels: false });
    } catch (err) {
      logger.warn(
        `Could not create pre-update backup: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  if (options.upgradeImages) {
    const upgradedServices = upgradeStackImagePins(configManager, config);

    if (upgradedServices.length > 0) {
      logger.info(`Pinned image versions updated for: ${upgradedServices.join(', ')}.`);
    } else {
      logger.info('No legacy default image tags require an upgrade.');
    }
  }

  // 2. Check if containers are currently running
  const activeContainers = await docker.status();
  const isRunning = activeContainers.some((c) => c.state === 'running');

  const spinner = ora('Pulling configured pinned container images...').start();

  try {
    const exitCode = await docker.pull();
    if (exitCode !== 0) {
      spinner.fail('Failed to pull images');
      showError('Docker pull failed.', 'Please check your internet connection or registry access.');
      process.exit(1);
    }

    spinner.succeed('Configured images refreshed');

    // 3. Recreate and verify if running and restart option is enabled
    if (isRunning && options.restart !== false) {
      const restartSpinner = ora('Recreating containers with configured images...').start();
      const upCode = await docker.up();
      if (upCode !== 0) {
        restartSpinner.fail('Failed to restart updated services');
        showError('Restart failed.', 'Check logs via "pondok-ai logs".');
        process.exit(1);
      }

      restartSpinner.text = 'Verifying service health after update...';
      const { waitForServicesHealthy } = await import('../docker/health.js');
      const timeoutSec = parseInt(options.timeout ?? '45', 10);
      const healthCheck = await waitForServicesHealthy(config, docker, timeoutSec, (msg) => {
        restartSpinner.text = msg;
      });

      if (healthCheck.allHealthy) {
        restartSpinner.succeed('All configured images are running and healthy');
      } else {
        restartSpinner.warn(
          'Configured images started, but some services took longer than expected',
        );
      }
    } else if (!isRunning) {
      showSuccess('Configured images refreshed. Start the stack with "pondok-ai up".');
    } else {
      showSuccess('Configured images refreshed. Restart with "pondok-ai restart" to apply.');
    }
  } catch (error) {
    spinner.fail('Failed to pull images');
    showError(
      error instanceof Error ? error.message : 'Unknown error',
      'Make sure Docker is running.',
    );
    process.exit(1);
  }
}
