import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showError } from '../cli/ui.js';

interface LogsOptions {
  dir?: string;
  follow?: boolean;
  tail?: string;
}

export function createLogsCommand(): Command {
  const cmd = new Command('logs')
    .description('Show service logs')
    .argument('[service]', 'Specific service to show logs for')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .option('-f, --follow', 'Follow log output')
    .option('-n, --tail <lines>', 'Number of lines to show', '100')
    .action(async (service: string | undefined, options: LogsOptions) => {
      await runLogs(service, options);
    });

  return cmd;
}

async function runLogs(service: string | undefined, options: LogsOptions): Promise<void> {
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
    const tail = parseInt(options.tail ?? '100', 10);
    await docker.logs(service, options.follow, tail);
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'Failed to show logs',
      'Make sure Docker is running and services are started.',
    );
    process.exit(1);
  }
}
