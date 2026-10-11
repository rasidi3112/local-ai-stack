import { createProgram } from './cli/program.js';
import { showError } from './cli/ui.js';

async function main(): Promise<void> {
  const program = createProgram();

  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    // Commander throws on --help and --version (exitOverride)
    if (error instanceof Error && 'exitCode' in error) {
      const exitCode = (error as Error & { exitCode: number }).exitCode;
      process.exit(exitCode);
    }

    showError(
      error instanceof Error ? error.message : 'An unexpected error occurred.',
      'Please report this issue at https://github.com/rasidi3112/pondok-ai/issues',
    );
    process.exit(1);
  }
}

main();
