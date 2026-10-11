import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

function getGatewaySourceDirectory(): string {
  const runtimeDirectory = dirname(fileURLToPath(import.meta.url));
  const candidates = [
    // Packaged CLI: dist/index.js -> api/
    join(runtimeDirectory, '../api'),
    // Source checkout: src/system/resources.ts -> api/
    join(runtimeDirectory, '../../api'),
  ];

  return candidates.find((candidate) => existsSync(candidate)) ?? candidates[0];
}

/**
 * Copy the gateway files needed by Docker Compose into a new stack directory.
 */
export function copyGatewayBuildContext(destination: string): void {
  const source = getGatewaySourceDirectory();

  if (!existsSync(source)) {
    throw new Error(
      'Gateway build files are unavailable. Reinstall pondok-ai and run init again.',
    );
  }

  if (existsSync(destination)) {
    throw new Error(`Gateway build directory already exists: ${destination}`);
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, {
    recursive: true,
    filter: (path) => !['node_modules', 'dist'].includes(basename(path)),
  });
}
