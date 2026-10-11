const GATEWAY_SECRET_KEYS = ['POSTGRES_PASSWORD', 'API_SECRET_KEY', 'N8N_ENCRYPTION_KEY'] as const;

type GatewaySecretKey = (typeof GATEWAY_SECRET_KEYS)[number];

function isInvalidSecretValue(value: string | undefined): boolean {
  const trimmedValue = value?.trim();
  return !trimmedValue || trimmedValue.toLowerCase().startsWith('replace_with_');
}

/**
 * API_SECRET_KEY is always required by the gateway. The other stack secrets are
 * checked when explicitly supplied, without requiring them to be copied into
 * the gateway container.
 */
export function findInvalidGatewaySecrets(env: NodeJS.ProcessEnv): GatewaySecretKey[] {
  return GATEWAY_SECRET_KEYS.filter(
    (key) =>
      (key === 'API_SECRET_KEY' || Object.hasOwn(env, key)) && isInvalidSecretValue(env[key]),
  );
}

export function validateGatewayEnvironment(env: NodeJS.ProcessEnv): void {
  const invalidSecrets = findInvalidGatewaySecrets(env);

  if (invalidSecrets.length > 0) {
    throw new Error(
      `Invalid required secret value(s): ${invalidSecrets.join(', ')}. Run "pondok-ai init" to generate secure credentials.`,
    );
  }
}
