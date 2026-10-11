import { Command } from 'commander';
import ora from 'ora';
import { ConfigManager } from '../config/manager.js';
import { findInvalidRequiredSecrets } from '../config/secrets.js';
import { DockerClient } from '../docker/client.js';
import { showBanner, showServiceUrls, showError } from '../cli/ui.js';

interface UpOptions {
  dir?: string;
  healthcheck?: boolean;
  timeout?: string;
}

export function createUpCommand(): Command {
  const cmd = new Command('up')
    .description('Start the pondok-ai stack')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('--no-healthcheck', 'Skip waiting for service health checks')
    .option('-t, --timeout <seconds>', 'Timeout in seconds for health checks', '45')
    .action(async (options: UpOptions) => {
      await runUp(options);
    });

  return cmd;
}

async function runUp(options: UpOptions): Promise<void> {
  showBanner();

  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  const config = configManager.loadConfig();
  if (!config) {
    showError(
      'Stack not initialized.',
      'Run "pondok-ai init" first to create a configuration.',
    );
    process.exit(1);
  }

  const invalidSecrets = findInvalidRequiredSecrets(configManager.loadEnv());
  if (invalidSecrets.length > 0) {
    showError(
      `Invalid required secret value(s): ${invalidSecrets.join(', ')}`,
      'Run "pondok-ai init" to generate secure credentials before starting the stack.',
    );
    process.exit(1);
  }

  const docker = new DockerClient(
    configManager.getComposePath(),
    configManager.getEnvPath(),
    config.projectName,
  );

  const spinner = ora('Validating Docker Compose configuration...').start();

  try {
    // 1. Validate Docker Compose config before attempting startup
    const validation = await docker.validateCompose();
    if (!validation.valid) {
      spinner.fail('Docker Compose validation failed');
      showError(
        'Invalid Docker Compose configuration.',
        validation.error ?? 'Please check your configuration or re-run "pondok-ai init --force".',
      );
      process.exit(1);
    }

    // 2. Start services
    spinner.text = 'Starting services with Docker Compose...';
    const exitCode = await docker.up();
    if (exitCode !== 0) {
      spinner.fail('Failed to start services');
      showError(
        'Docker Compose failed.',
        'Run "pondok-ai logs" to see what went wrong.\n  Run "pondok-ai doctor" to check your environment.',
      );
      process.exit(1);
    }

    // 3. Service health check verification
    if (options.healthcheck !== false) {
      const timeoutSec = parseInt(options.timeout ?? '45', 10);
      spinner.text = 'Waiting for services to become healthy...';

      const { waitForServicesHealthy } = await import('../docker/health.js');
      const healthResult = await waitForServicesHealthy(
        config,
        docker,
        timeoutSec,
        (msg) => {
          spinner.text = msg;
        },
      );

      if (healthResult.allHealthy) {
        spinner.succeed('All services started and healthy');
      } else {
        spinner.warn('Stack started, but some services took longer than expected to become ready');
      }
    } else {
      spinner.succeed('All services started (health check skipped)');
    }

    showServiceUrls(config);
  } catch (error) {
    spinner.fail('Failed to start services');
    showError(
      error instanceof Error ? error.message : 'Unknown error',
      'Make sure Docker is running and try again.',
    );
    process.exit(1);
  }
}
