import { platform } from 'node:os';

/**
 * Get the default directory for pondok-ai configuration.
 */
export function getDefaultStackDir(): string {
  return '.pondok-ai';
}

/**
 * Get the Docker socket path for the current platform.
 */
export function getDockerSocketPath(): string {
  const p = platform();
  if (p === 'win32') {
    return '//var/run/docker.sock';
  }
  return '/var/run/docker.sock';
}

/**
 * Determine if the current platform is Windows.
 */
export function isWindows(): boolean {
  return platform() === 'win32';
}

/**
 * Determine if the current platform is macOS.
 */
export function isMacOS(): boolean {
  return platform() === 'darwin';
}

/**
 * Determine if the current platform is Linux.
 */
export function isLinux(): boolean {
  return platform() === 'linux';
}
