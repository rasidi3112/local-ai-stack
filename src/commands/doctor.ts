import { Command } from 'commander';
import chalk from 'chalk';
import { detectSystem, SystemInfo } from '../system/detect.js';
import { checkRequirements } from '../system/requirements.js';
import { showBanner, showRequirements } from '../cli/ui.js';
import { logger } from '../utils/logger.js';

export function createDoctorCommand(): Command {
  const cmd = new Command('doctor')
    .description('Diagnose your environment for running pondok-ai')
    .action(async () => {
      await runDoctor();
    });

  return cmd;
}

async function runDoctor(): Promise<void> {
  showBanner();

  logger.info('Running diagnostics...\n');

  const system = await detectSystem();

  // Show system info
  console.log(chalk.bold('System Information:\n'));
  console.log(`  ${chalk.gray('OS:')}            ${system.os} (${system.arch})`);
  console.log(`  ${chalk.gray('CPU:')}           ${system.cpuModel}`);
  console.log(`  ${chalk.gray('CPU Cores:')}     ${system.cpuCount}`);
  console.log(`  ${chalk.gray('Total RAM:')}     ${system.totalMemoryGB} GB`);
  console.log(`  ${chalk.gray('Free RAM:')}      ${system.freeMemoryGB} GB`);
  if (system.diskFreeGB !== null) {
    console.log(`  ${chalk.gray('Free Disk:')}     ${system.diskFreeGB} GB`);
  }
  console.log(`  ${chalk.gray('GPU:')}           ${system.gpuAvailable ? system.gpuInfo : 'Not detected'}`);
  console.log();

  // Docker info
  console.log(chalk.bold('Docker:\n'));
  console.log(`  ${chalk.gray('Installed:')}     ${system.dockerInstalled ? chalk.green('Yes') : chalk.red('No')}`);
  console.log(`  ${chalk.gray('Running:')}       ${system.dockerRunning ? chalk.green('Yes') : chalk.red('No')}`);
  if (system.dockerVersion) {
    console.log(`  ${chalk.gray('Version:')}       ${system.dockerVersion}`);
  }
  if (system.dockerComposeVersion) {
    console.log(`  ${chalk.gray('Compose:')}       v${system.dockerComposeVersion}`);
  }
  console.log();

  // Requirements check
  console.log(chalk.bold('Requirements Check:\n'));
  const checks = checkRequirements(system);
  showRequirements(checks);

  // Recommendations
  console.log(chalk.bold('Recommendations:\n'));
  await showRecommendations(system);
}

async function showRecommendations(system: SystemInfo): Promise<void> {
  if (!system.dockerInstalled) {
    console.log(chalk.yellow('  → Install Docker Desktop: https://docker.com/get-started'));
    return;
  }

  if (!system.dockerRunning) {
    console.log(chalk.yellow('  → Start Docker Desktop and run this command again'));
    return;
  }

  if (system.totalMemoryGB < 8) {
    console.log(chalk.yellow('  → Use the "minimal" preset for best performance'));
  } else if (system.totalMemoryGB < 16) {
    console.log(chalk.green('  → "standard" preset recommended'));
  } else {
    console.log(chalk.green('  → "full" preset recommended'));
  }

  const { getModelRecommendations } = await import('../system/recommendations.js');
  const report = getModelRecommendations(system);

  console.log();
  console.log(chalk.bold('Model Recommendations:'));
  console.log(`  → Recommended default: ${chalk.green.bold(report.recommendedDefault.name)} (${report.recommendedDefault.displayName})`);
  console.log(`  → ${report.compatibleModels.length} models verified compatible with your hardware.`);
  console.log(chalk.gray('  → Run "pondok-ai model recommend" to inspect the full compatibility matrix.\n'));
}
