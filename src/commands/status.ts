import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showServiceStatus, showError } from '../cli/ui.js';

interface StatusOptions {
  dir?: string;
}

export function createStatusCommand(): Command {
  const cmd = new Command('status')
    .description('Show the status of all services')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: StatusOptions) => {
      await runStatus(options);
    });

  return cmd;
}

async function runStatus(options: StatusOptions): Promise<void> {
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
    const statuses = await docker.status();
    showServiceStatus(statuses);
  } catch (error) {
    showError(
      error instanceof Error ? error.message : 'Failed to get service status',
      'Make sure Docker is running.',
    );
    process.exit(1);
  }
}
