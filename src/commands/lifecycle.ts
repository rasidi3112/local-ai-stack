import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showError, showSuccess } from '../cli/ui.js';

interface LifecycleOptions {
  dir?: string;
  service?: string;
}

function createLifecycleCommand(
  name: string,
  description: string,
  action: (docker: DockerClient, service?: string) => Promise<number>,
  successMessage: string,
): Command {
  const cmd = new Command(name)
    .description(description)
    .argument('[service]', 'Specific service to target')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (service: string | undefined, options: LifecycleOptions) => {
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

      try {
        const exitCode = await action(docker, service);
        if (exitCode !== 0) {
          showError(`Failed to ${name} services.`);
          process.exit(1);
        }
        showSuccess(successMessage);
      } catch (error) {
        showError(
          error instanceof Error ? error.message : 'Unknown error',
          'Make sure Docker is running.',
        );
        process.exit(1);
      }
    });

  return cmd;
}

export function createStartCommand(): Command {
  return createLifecycleCommand(
    'start',
    'Start stopped containers',
    (docker, service) => docker.start(service),
    'Services started.',
  );
}

export function createStopCommand(): Command {
  return createLifecycleCommand(
    'stop',
    'Stop running containers',
    (docker, service) => docker.stop(service),
    'Services stopped.',
  );
}

export function createRestartCommand(): Command {
  return createLifecycleCommand(
    'restart',
    'Restart containers',
    (docker, service) => docker.restart(service),
    'Services restarted.',
  );
}
