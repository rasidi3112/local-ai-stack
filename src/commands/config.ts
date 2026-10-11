import { Command } from 'commander';
import { ConfigManager } from '../config/manager.js';
import { showConfig, showError } from '../cli/ui.js';
import { logger } from '../utils/logger.js';

interface ConfigOptions {
  dir?: string;
}

export function createConfigCommand(): Command {
  const cmd = new Command('config')
    .description('View or manage stack configuration');

  cmd
    .command('show')
    .description('Display current configuration')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: ConfigOptions) => {
      const baseDir = options.dir ?? process.cwd();
      const configManager = new ConfigManager(baseDir);

      const config = configManager.loadConfig();
      if (!config) {
        showError('Stack not initialized.', 'Run "pondok-ai init" first.');
        process.exit(1);
      }

      showConfig(config);
    });

  cmd
    .command('path')
    .description('Show the path to the configuration directory')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action((options: ConfigOptions) => {
      const baseDir = options.dir ?? process.cwd();
      const configManager = new ConfigManager(baseDir);
      logger.info(configManager.getStackDir());
    });

  cmd
    .command('edit')
    .description('Edit configuration interactively')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: ConfigOptions) => {
      const baseDir = options.dir ?? process.cwd();
      const configManager = new ConfigManager(baseDir);

      const config = configManager.loadConfig();
      if (!config) {
        showError('Stack not initialized.', 'Run "pondok-ai init" first.');
        process.exit(1);
      }

      const { default: inquirer } = await import('inquirer');

      // Allow toggling services
      const serviceKeys = Object.keys(config.services) as Array<keyof typeof config.services>;

      const answers = await inquirer.prompt([
        {
          type: 'checkbox',
          name: 'enabledServices',
          message: 'Select services to enable:',
          choices: serviceKeys.map((key) => ({
            name: key,
            value: key,
            checked: config.services[key].enabled,
          })),
        },
        {
          type: 'list',
          name: 'bindAddress',
          message: 'Bind address:',
          choices: [
            { name: '127.0.0.1 (localhost only — recommended)', value: '127.0.0.1' },
            { name: '0.0.0.0 (all interfaces — use with caution)', value: '0.0.0.0' },
          ],
          default: config.network.bindAddress,
        },
      ]);

      // Update config
      for (const key of serviceKeys) {
        config.services[key].enabled = answers.enabledServices.includes(key);
      }
      config.network.bindAddress = answers.bindAddress;

      configManager.saveConfig(config);
      logger.success('Configuration updated');

      // Regenerate compose
      const { generateComposeFile } = await import('../docker/compose.js');
      const { writeFile } = await import('../utils/fs.js');
      const env = configManager.loadEnv();
      const composeContent = generateComposeFile(config, env);
      writeFile(configManager.getComposePath(), composeContent);
      logger.success('Docker Compose file regenerated');

      logger.info('\nRestart the stack to apply changes:');
      logger.raw('  pondok-ai restart\n');
    });

  // Default action (no subcommand) — show config
  cmd.action(async (options: ConfigOptions) => {
    const baseDir = options.dir ?? process.cwd();
    const configManager = new ConfigManager(baseDir);

    const config = configManager.loadConfig();
    if (!config) {
      showError('Stack not initialized.', 'Run "pondok-ai init" first.');
      process.exit(1);
    }

    showConfig(config);
  });

  return cmd;
}
