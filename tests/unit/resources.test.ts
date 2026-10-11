import { afterEach, describe, expect, it } from 'vitest';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { copyGatewayBuildContext } from '../../src/system/resources.js';

describe('gateway build resources', () => {
  const testDirectories: string[] = [];

  afterEach(() => {
    for (const directory of testDirectories.splice(0)) {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('copies the gateway build context when executed from the source checkout', () => {
    const directory = mkdtempSync(join(tmpdir(), 'pondok-ai-resources-'));
    testDirectories.push(directory);

    const destination = join(directory, 'api');
    copyGatewayBuildContext(destination);

    expect(existsSync(join(destination, 'Dockerfile'))).toBe(true);
    expect(existsSync(join(destination, 'src', 'index.ts'))).toBe(true);
    expect(existsSync(join(destination, 'node_modules'))).toBe(false);
  });
});
