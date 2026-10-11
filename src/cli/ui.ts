import chalk from 'chalk';
import boxen from 'boxen';
import { RequirementCheck } from '../system/requirements.js';
import { ServiceStatus } from '../docker/client.js';
import { StackConfig } from '../config/schema.js';
import { SERVICE_REGISTRY } from '../services/registry.js';

/**
 * Display the application banner.
 */
export function showBanner(): void {
  const banner = boxen(
    `${chalk.bold.cyan('PONDOK AI')}\n${chalk.gray('Your private AI environment')}`,
    {
      padding: 1,
      margin: { top: 1, bottom: 1, left: 0, right: 0 },
      borderStyle: 'round',
      borderColor: 'cyan',
      textAlignment: 'center',
    },
  );
  console.log(banner);
}

/**
 * Display requirement check results.
 */
export function showRequirements(checks: RequirementCheck[]): void {
  for (const check of checks) {
    if (check.passed) {
      if (check.severity === 'warning') {
        console.log(chalk.yellow(`⚠ ${check.message}`));
      } else {
        console.log(chalk.green(`✓ ${check.message}`));
      }
    } else {
      console.log(chalk.red(`✗ ${check.message}`));
    }
  }
  console.log();
}

/**
 * Display service status table.
 */
export function showServiceStatus(statuses: ServiceStatus[]): void {
  if (statuses.length === 0) {
    console.log(chalk.yellow('No services are running.'));
    return;
  }

  console.log(chalk.bold('\nService Status:\n'));

  const nameWidth = 20;
  const stateWidth = 12;
  const statusWidth = 30;

  // Header
  console.log(
    chalk.gray(
      `${'SERVICE'.padEnd(nameWidth)} ${'STATE'.padEnd(stateWidth)} ${'STATUS'.padEnd(statusWidth)}`,
    ),
  );
  console.log(chalk.gray('─'.repeat(nameWidth + stateWidth + statusWidth + 2)));

  for (const svc of statuses) {
    const stateColor = svc.state === 'running' ? chalk.green : chalk.red;
    console.log(
      `${svc.name.padEnd(nameWidth)} ${stateColor(svc.state.padEnd(stateWidth))} ${svc.status.padEnd(statusWidth)}`,
    );
  }

  console.log();
}

/**
 * Display the URLs for all enabled services after startup.
 */
export function showServiceUrls(config: StackConfig): void {
  console.log(chalk.bold.green('\n🎉 Your pondok-ai stack is ready!\n'));

  const services = config.services;
  const bind = config.network.bindAddress === '0.0.0.0' ? 'localhost' : config.network.bindAddress;

  const urlEntries: Array<{ name: string; url: string }> = [];

  if (services.openwebui.enabled) {
    urlEntries.push({ name: 'Open WebUI', url: `http://${bind}:${services.openwebui.port}` });
  }
  if (services.api.enabled) {
    urlEntries.push({ name: 'API Gateway', url: `http://${bind}:${services.api.port}` });
  }
  if (services.ollama.enabled) {
    urlEntries.push({ name: 'Ollama', url: `http://${bind}:${services.ollama.port}` });
  }
  if (services.qdrant.enabled) {
    urlEntries.push({ name: 'Qdrant', url: `http://${bind}:${services.qdrant.port}` });
  }
  if (services.n8n.enabled) {
    urlEntries.push({ name: 'n8n', url: `http://${bind}:${services.n8n.port}` });
  }

  for (const entry of urlEntries) {
    console.log(`  ${chalk.bold(entry.name + ':')}  ${chalk.cyan(entry.url)}`);
  }

  console.log();

  if (services.api.enabled) {
    console.log(chalk.gray('  Use with OpenAI SDK:'));
    console.log(chalk.gray(`  OPENAI_BASE_URL=http://${bind}:${services.api.port}/v1\n`));
  }
}

/**
 * Display detailed stack configuration.
 */
export function showConfig(config: StackConfig): void {
  console.log(chalk.bold('\nStack Configuration:\n'));
  console.log(`  ${chalk.gray('Preset:')}     ${chalk.bold(config.preset)}`);
  console.log(`  ${chalk.gray('Project:')}    ${config.projectName}`);
  console.log(`  ${chalk.gray('Bind:')}       ${config.network.bindAddress}`);
  console.log();
  console.log(chalk.bold('  Services:'));

  for (const [key, svc] of Object.entries(config.services)) {
    const meta = SERVICE_REGISTRY[key];
    const statusIcon = svc.enabled ? chalk.green('✓') : chalk.gray('○');
    const name = meta?.displayName ?? key;
    const port = svc.port ?? meta?.defaultPort ?? '—';
    console.log(`    ${statusIcon} ${name.padEnd(14)} ${chalk.gray(`port: ${port}`)}`);
  }

  console.log();
}

/**
 * Display a polished error with suggested fix.
 */
export function showError(message: string, suggestion?: string): void {
  console.error(chalk.red(`\n✗ ${message}`));
  if (suggestion) {
    console.error(chalk.gray(`\n  ${suggestion}\n`));
  }
}

/**
 * Display a success message.
 */
export function showSuccess(message: string): void {
  console.log(chalk.green(`\n✓ ${message}\n`));
}
