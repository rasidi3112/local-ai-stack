import { Command } from 'commander';
import { createInitCommand } from '../commands/init.js';
import { createUpCommand } from '../commands/up.js';
import { createDownCommand } from '../commands/down.js';
import { createStartCommand, createStopCommand, createRestartCommand } from '../commands/lifecycle.js';
import { createStatusCommand } from '../commands/status.js';
import { createLogsCommand } from '../commands/logs.js';
import { createDoctorCommand } from '../commands/doctor.js';
import { createUpdateCommand } from '../commands/update.js';
import { createResetCommand } from '../commands/reset.js';
import { createConfigCommand } from '../commands/config.js';
import { createModelCommand } from '../commands/model.js';
import { createBackupCommand } from '../commands/backup.js';
import { createRestoreCommand } from '../commands/restore.js';
import { showBanner, showError } from './ui.js';

// Read version from package.json at build time via tsup define
declare const __VERSION__: string;
const VERSION = typeof __VERSION__ !== 'undefined' ? __VERSION__ : '0.1.0';

export function createProgram(): Command {
  const program = new Command();

  program
    .name('pondok-ai')
    .description('Run your own private AI stack locally with one command.')
    .version(VERSION, '-v, --version')
    .configureHelp({
      sortSubcommands: true,
    });

  // Register all commands
  program.addCommand(createInitCommand());
  program.addCommand(createUpCommand());
  program.addCommand(createDownCommand());
  program.addCommand(createStartCommand());
  program.addCommand(createStopCommand());
  program.addCommand(createRestartCommand());
  program.addCommand(createStatusCommand());
  program.addCommand(createLogsCommand());
  program.addCommand(createDoctorCommand());
  program.addCommand(createUpdateCommand());
  program.addCommand(createResetCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createModelCommand());
  program.addCommand(createBackupCommand());
  program.addCommand(createRestoreCommand());

  // Default action — show banner and help when no command is provided
  program.action(() => {
    showBanner();
    program.outputHelp();
  });

  // Global error handling
  program.exitOverride();
  program.configureOutput({
    writeErr: (str: string) => {
      // Filter out Commander's default error messages for cleaner output
      if (str.includes('error:')) {
        const message = str.replace(/^error:\s*/, '').trim();
        showError(message, 'Run "pondok-ai --help" for usage information.');
      }
    },
  });

  return program;
}
