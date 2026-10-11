import { describe, expect, it } from 'vitest';
import {
  findInvalidGatewaySecrets,
  validateGatewayEnvironment,
} from '../../api/src/environment.js';

const validGatewayEnv: NodeJS.ProcessEnv = {
  API_SECRET_KEY: 'api-secret-key',
};

describe('gateway environment validation', () => {
  it('requires a populated API secret key', () => {
    expect(() =>
      validateGatewayEnvironment({ API_SECRET_KEY: 'replace_with_secure_random_api_key' }),
    ).toThrow(/API_SECRET_KEY.*pondok-ai init/);
  });

  it.each([
    ['POSTGRES_PASSWORD', ''],
    ['N8N_ENCRYPTION_KEY', 'replace_with_32_character_encryption_key'],
  ] as const)('rejects an invalid supplied %s value', (key, value) => {
    const env = { ...validGatewayEnv, [key]: value };

    expect(findInvalidGatewaySecrets(env)).toEqual([key]);
    expect(() => validateGatewayEnvironment(env)).toThrow(/pondok-ai init/);
  });

  it('does not require unrelated stack secrets in the gateway process', () => {
    expect(() => validateGatewayEnvironment(validGatewayEnv)).not.toThrow();
  });
});
