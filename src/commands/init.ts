import { Command } from 'commander';
import { join } from 'node:path';
import { ConfigManager } from '../config/manager.js';
import { Preset } from '../config/schema.js';
import { PRESET_DESCRIPTIONS } from '../config/defaults.js';
import { detectSystem } from '../system/detect.js';
import { checkRequirements, hasErrors } from '../system/requirements.js';
import { copyGatewayBuildContext } from '../system/resources.js';
import { generateComposeFile } from '../docker/compose.js';
import { showBanner, showRequirements, showConfig, showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';

interface InitOptions {
  preset?: string;
  nonInteractive?: boolean;
  yes?: boolean;
  gpu?: boolean;
  force?: boolean;
  skipChecks?: boolean;
  dir?: string;
}

export function createInitCommand(): Command {
  const cmd = new Command('init')
    .description('Initialize a new pondok-ai stack')
    .option('-p, --preset <preset>', 'Stack preset (minimal, standard, full)')
    .option('--non-interactive', 'Run without prompts, using defaults')
    .option('-y, --yes', 'Run without prompts, using defaults')
    .option('-f, --force', 'Proceed even if system requirements are not met')
    .option('--skip-checks', 'Skip system requirements checks')
    .option('--gpu', 'Enable GPU support for Ollama')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: InitOptions) => {
      await runInit(options);
    });

  return cmd;
}

async function runInit(options: InitOptions): Promise<void> {
  showBanner();

  // Validate preset option early if provided
  if (options.preset && !['minimal', 'standard', 'full'].includes(options.preset)) {
    showError(
      `Invalid preset: ${options.preset}`,
      'Available presets: minimal, standard, full',
    );
    process.exit(1);
  }

  const baseDir = options.dir ?? process.cwd();
  const configManager = new ConfigManager(baseDir);

  // Check if already initialized
  if (configManager.configExists()) {
    const existingConfig = configManager.loadConfig();
    if (existingConfig) {
      showError(
        'Stack already initialized.',
        'Use "pondok-ai config" to view or modify the configuration.\n  Use "pondok-ai reset" to start fresh.',
      );
      process.exit(1);
    }
  }

  // System detection
  logger.info('Checking system...\n');
  const system = await detectSystem();
  const checks = checkRequirements(system);
  showRequirements(checks);

  if (hasErrors(checks)) {
    if (options.force || options.skipChecks) {
      logger.warn('System requirements check failed, but proceeding anyway due to --force.\n');
    } else {
      showError(
        'System requirements not met.',
        'Fix the issues above, run "pondok-ai doctor", or use --force to initialize anyway.',
      );
      process.exit(1);
    }
  }

  // Determine non-interactive mode
  const isNonInteractive = Boolean(options.nonInteractive || options.yes);

  // Determine preset
  let preset: Preset;

  if (options.preset) {
    preset = options.preset as Preset;
  } else if (isNonInteractive) {
    preset = 'standard';
    logger.info(`Using default preset: ${preset}`);
  } else {
    // Interactive mode
    const { default: inquirer } = await import('inquirer');
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'preset',
        message: 'Select your stack:',
        choices: [
          { name: `Minimal  — ${PRESET_DESCRIPTIONS.minimal}`, value: 'minimal' },
          { name: `Standard — ${PRESET_DESCRIPTIONS.standard}`, value: 'standard' },
          { name: `Full     — ${PRESET_DESCRIPTIONS.full}`, value: 'full' },
        ],
        default: 'standard',
      },
    ]);
    preset = answers.preset as Preset;
  }

  // Generate configuration
  const config = configManager.generateConfig(preset);

  // GPU detection
  if (options.gpu) {
    config.services.ollama.gpuEnabled = true;
  } else if (system.gpuAvailable && !isNonInteractive) {
    const { default: inquirer } = await import('inquirer');
    const gpuAnswer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enableGpu',
        message: `GPU detected (${system.gpuInfo}). Enable GPU acceleration for Ollama?`,
        default: true,
      },
    ]);
    config.services.ollama.gpuEnabled = gpuAnswer.enableGpu;
  }

  // Save configuration
  configManager.saveConfig(config);
  logger.success('Configuration generated');

  // Generate .env with secure credentials
  configManager.generateEnv();
  logger.success('Secure credentials generated');

  if (config.services.api.enabled) {
    copyGatewayBuildContext(join(configManager.getStackDir(), 'api'));
    logger.success('API Gateway build context prepared');
  }

  // Generate Docker Compose file
  const env = configManager.loadEnv();
  const composeContent = generateComposeFile(config, env);
  const { writeFile } = await import('../utils/fs.js');
  writeFile(configManager.getComposePath(), composeContent);
  logger.success('Docker Compose file generated');

  // Show result
  showConfig(config);

  showSuccess('Stack initialized successfully!');

  logger.info('Next steps:\n');
  logger.raw('  Start the stack:');
  logger.raw('    pondok-ai up\n');
  logger.raw('  Check status:');
  logger.raw('    pondok-ai status\n');
  logger.raw('  View logs:');
  logger.raw('    pondok-ai logs\n');
}
