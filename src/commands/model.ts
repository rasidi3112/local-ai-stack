import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { ConfigManager } from '../config/manager.js';
import { DockerClient } from '../docker/client.js';
import { showError, showSuccess } from '../cli/ui.js';
import { logger } from '../utils/logger.js';
import { isValidModelName } from '../utils/validation.js';

interface ModelOptions {
  dir?: string;
  force?: boolean;
}

export function createModelCommand(): Command {
  const cmd = new Command('model')
    .description('Manage AI models');

  cmd
    .command('list')
    .description('List installed models')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: ModelOptions) => {
      await listModels(options);
    });

  cmd
    .command('recommend')
    .description('Recommend models based on detected system hardware (RAM, VRAM, disk)')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async () => {
      await recommendModels();
    });

  cmd
    .command('install <model>')
    .description('Install a model (e.g., llama3.2:3b, mistral:7b, qwen2.5-coder:7b)')
    .option('-f, --force', 'Force installation even if hardware requirements are not met')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (model: string, options: ModelOptions) => {
      await installModel(model, options);
    });

  cmd
    .command('remove <model>')
    .description('Remove an installed model')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (model: string, options: ModelOptions) => {
      await removeModel(model, options);
    });

  cmd
    .command('status')
    .description('Show model details and resource usage')
    .option('-d, --dir <directory>', 'Working directory', process.cwd())
    .action(async (options: ModelOptions) => {
      await modelStatus(options);
    });

  return cmd;
}

function getDockerClient(options: ModelOptions): { docker: DockerClient; config: ReturnType<ConfigManager['loadConfig']> } {
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
    config!.projectName,
  );

  return { docker, config };
}

async function listModels(options: ModelOptions): Promise<void> {
  const { docker } = getDockerClient(options);

  try {
    const result = await docker.execInContainer('ollama', ['ollama', 'list']);
    if (result.exitCode !== 0) {
      showError('Failed to list models.', 'Make sure the stack is running with "pondok-ai up".');
      process.exit(1);
    }

    if (!result.stdout.trim()) {
      logger.info('No models installed. Install one with:');
      logger.raw('  pondok-ai model install llama3.2\n');
      return;
    }

    console.log(chalk.bold('\nInstalled Models:\n'));
    console.log(result.stdout);
  } catch (error) {
    showError(
      'Could not connect to Ollama.',
      'Make sure the stack is running with "pondok-ai up".',
    );
    process.exit(1);
  }
}

async function recommendModels(): Promise<void> {
  const { detectSystem } = await import('../system/detect.js');
  const { getModelRecommendations } = await import('../system/recommendations.js');

  const spinner = ora('Detecting system hardware for model recommendations...').start();
  const system = await detectSystem();
  spinner.stop();

  const report = getModelRecommendations(system);

  console.log(chalk.bold('\nHardware Profile:'));
  console.log(`  RAM:         ${system.totalMemoryGB} GB (${system.freeMemoryGB} GB free)`);
  if (system.diskFreeGB !== null) {
    console.log(`  Free Disk:   ${system.diskFreeGB} GB`);
  }
  console.log(`  GPU:         ${system.gpuAvailable ? system.gpuInfo : 'None (CPU inference)'}`);
  if (system.vramGB !== null) {
    console.log(`  VRAM:        ${system.vramGB} GB`);
  }
  console.log();

  console.log(chalk.bold('Recommended Default Model:'));
  console.log(`  ${chalk.green.bold(report.recommendedDefault.name)} (${report.recommendedDefault.displayName})`);
  console.log(`  ${chalk.gray(report.recommendedDefault.description)}`);
  console.log(`  Disk: ~${report.recommendedDefault.diskSizeGB} GB | RAM: ${report.recommendedDefault.minRamGB}-${report.recommendedDefault.recommendedRamGB} GB`);
  console.log();

  console.log(chalk.bold('Compatible Models (Ready to run comfortably):'));
  for (const item of report.compatibleModels) {
    const icon = item.fitsInVram ? chalk.green('⚡ [GPU]') : chalk.cyan('✓ [RAM]');
    console.log(`  ${icon} ${chalk.bold(item.model.name.padEnd(20))} ${chalk.gray(item.model.displayName.padEnd(22))} ${chalk.gray(`[Disk: ~${item.model.diskSizeGB}GB | RAM: ${item.model.recommendedRamGB}GB]`)}`);
    console.log(`     ${chalk.gray(item.reason)}`);
  }
  console.log();

  if (report.tightModels.length > 0) {
    console.log(chalk.bold('Tight Fit (May cause swapping / slower token generation):'));
    for (const item of report.tightModels) {
      console.log(`  ${chalk.yellow('⚠')} ${chalk.bold(item.model.name.padEnd(20))} ${chalk.gray(item.reason)}`);
    }
    console.log();
  }

  if (report.incompatibleModels.length > 0) {
    console.log(chalk.bold('Incompatible (Exceeds hardware capacity):'));
    for (const item of report.incompatibleModels) {
      console.log(`  ${chalk.red('✗')} ${chalk.bold(item.model.name.padEnd(20))} ${chalk.gray(item.reason)}`);
    }
    console.log();
  }

  console.log(chalk.gray(`Install any compatible model with:\n  pondok-ai model install <name>\n`));
}

async function installModel(model: string, options: ModelOptions): Promise<void> {
  if (!isValidModelName(model)) {
    showError(`Invalid model name: ${model}`, 'Example: pondok-ai model install llama3.2:3b');
    process.exit(1);
  }

  // Smart hardware check and safety warnings
  const { detectSystem } = await import('../system/detect.js');
  const { validateModelFit } = await import('../system/recommendations.js');
  const system = await detectSystem();
  const fit = validateModelFit(model, system);

  if (fit.tier === 'incompatible') {
    logger.warn(`Hardware Safety Warning: System resources may be insufficient for "${model}".`);
    logger.warn(`Reason: ${fit.warning}`);
    if (fit.spec) {
      logger.raw(`  Model requirements: Disk: ~${fit.spec.diskSizeGB}GB | RAM: ${fit.spec.minRamGB}GB\n`);
      logger.raw(`  System available:   Disk: ~${system.diskFreeGB ?? 'unknown'}GB | RAM: ${system.freeMemoryGB}GB free\n`);
    }

    if (!options.force) {
      const { default: inquirer } = await import('inquirer');
      const answer = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: `Attempting to install "${model}" may cause Out-Of-Memory errors. Proceed anyway?`,
          default: false,
        },
      ]);

      if (!answer.proceed) {
        logger.info('Installation cancelled. Use "pondok-ai model recommend" to find compatible models.');
        return;
      }
    } else {
      logger.info('Proceeding anyway due to --force flag.\n');
    }
  } else if (fit.tier === 'tight') {
    logger.warn(`Resource Notice: "${model}" will run with high memory utilization.`);
    logger.warn(`${fit.warning}\n`);
  }

  getDockerClient(options);

  const spinner = ora(`Pulling model: ${model}...`).start();

  try {
    // Use execStream for real-time progress output
    spinner.stop();
    logger.info(`Pulling ${chalk.bold(model)}...\n`);

    const { execStream: streamExec } = await import('../utils/exec.js');
    const exitCode = await streamExec('docker', [
      'compose', '-f', new ConfigManager(options.dir ?? process.cwd()).getComposePath(),
      'exec', '-T', 'ollama', 'ollama', 'pull', model,
    ]);

    if (exitCode !== 0) {
      showError(`Failed to pull model: ${model}`);
      process.exit(1);
    }

    showSuccess(`Model "${model}" installed successfully.`);
  } catch (error) {
    showError(
      'Could not connect to Ollama.',
      'Make sure the stack is running with "pondok-ai up".',
    );
    process.exit(1);
  }
}

async function removeModel(model: string, options: ModelOptions): Promise<void> {
  if (!isValidModelName(model)) {
    showError(`Invalid model name: ${model}`);
    process.exit(1);
  }

  const { docker } = getDockerClient(options);

  try {
    const result = await docker.execInContainer('ollama', ['ollama', 'rm', model]);
    if (result.exitCode !== 0) {
      showError(`Failed to remove model: ${model}`, result.stdout || 'Model may not exist.');
      process.exit(1);
    }

    showSuccess(`Model "${model}" removed.`);
  } catch (error) {
    showError(
      'Could not connect to Ollama.',
      'Make sure the stack is running with "pondok-ai up".',
    );
    process.exit(1);
  }
}

async function modelStatus(options: ModelOptions): Promise<void> {
  const { docker } = getDockerClient(options);

  try {
    const result = await docker.execInContainer('ollama', ['ollama', 'ps']);
    if (result.exitCode !== 0) {
      showError('Failed to get model status.');
      process.exit(1);
    }

    console.log(chalk.bold('\nRunning Models:\n'));
    if (result.stdout.trim()) {
      console.log(result.stdout);
    } else {
      logger.info('No models currently loaded in memory.');
    }
  } catch (error) {
    showError(
      'Could not connect to Ollama.',
      'Make sure the stack is running with "pondok-ai up".',
    );
    process.exit(1);
  }
}
