import { timingSafeEqual } from 'node:crypto';
import cors from '@fastify/cors';
import Fastify, { type FastifyError, FastifyInstance } from 'fastify';
import { createOpenAiError } from './errors.js';
import { chatCompletionsRoute } from './routes/chat.js';
import { embeddingsRoute } from './routes/embeddings.js';
import { healthRoute } from './routes/health.js';
import { modelsRoute } from './routes/models.js';
import { statusRoute } from './routes/status.js';
import { FixedWindowRateLimiter, getRateLimitConfig, rateLimitKey } from './rate-limit.js';
import { DEFAULT_OLLAMA_REQUEST_TIMEOUT_MS } from './upstream.js';

const ALLOWED_HOSTS = new Set(['localhost', '127.0.0.1', 'api']);

export interface GatewayOptions {
  apiSecretKey?: string;
  corsOrigins?: string;
  logger?: boolean;
  ollamaBaseUrl?: string;
  ollamaRequestTimeoutMs?: number;
  qdrantUrl?: string;
  rateLimitMaxRequests?: number;
  rateLimitWindowMs?: number;
}

function parseCorsOrigins(value: string): string[] {
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function isAllowedHost(hostHeader: string | undefined): boolean {
  const match = hostHeader?.match(/^(localhost|127\.0\.0\.1|api)(?::(\d{1,5}))?$/i);

  if (!match) {
    return false;
  }

  const port = match[2];
  return ALLOWED_HOSTS.has(match[1].toLowerCase()) && (port === undefined || Number(port) <= 65535);
}

function hasValidBearerToken(authorization: string | undefined, expectedSecret: string): boolean {
  const token = authorization?.match(/^Bearer (.+)$/)?.[1];

  if (!token || !expectedSecret) {
    return false;
  }

  const tokenBuffer = Buffer.from(token);
  const expectedBuffer = Buffer.from(expectedSecret);

  return (
    tokenBuffer.length === expectedBuffer.length && timingSafeEqual(tokenBuffer, expectedBuffer)
  );
}

function getTimeoutMs(value: number | undefined): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0
    ? value
    : DEFAULT_OLLAMA_REQUEST_TIMEOUT_MS;
}

export async function buildApp(options: GatewayOptions = {}): Promise<FastifyInstance> {
  const corsOrigins = parseCorsOrigins(options.corsOrigins ?? process.env.CORS_ORIGINS ?? '');
  const rateLimitConfig = getRateLimitConfig(process.env, {
    ...(options.rateLimitMaxRequests !== undefined && {
      maxRequests: options.rateLimitMaxRequests,
    }),
    ...(options.rateLimitWindowMs !== undefined && { windowMs: options.rateLimitWindowMs }),
  });
  const rateLimiter = new FixedWindowRateLimiter(rateLimitConfig);
  const app = Fastify({
    logger:
      options.logger === false
        ? false
        : {
            level: process.env.LOG_LEVEL ?? 'info',
          },
    requestTimeout: DEFAULT_OLLAMA_REQUEST_TIMEOUT_MS,
    bodyLimit: 10 * 1024 * 1024, // 10MB
  });

  app.decorate('config', {
    ollamaBaseUrl: options.ollamaBaseUrl ?? process.env.OLLAMA_BASE_URL ?? 'http://ollama:11434',
    ollamaRequestTimeoutMs: getTimeoutMs(options.ollamaRequestTimeoutMs),
    qdrantUrl: options.qdrantUrl ?? process.env.QDRANT_URL ?? '',
    apiSecretKey: options.apiSecretKey ?? process.env.API_SECRET_KEY ?? '',
  });

  app.addHook('onRequest', async (request, reply) => {
    if (!isAllowedHost(request.headers.host)) {
      return reply
        .status(400)
        .send(
          createOpenAiError('Host header is not allowed', 'invalid_request_error', 'invalid_host'),
        );
    }

    if (!request.url.startsWith('/v1/')) {
      return;
    }

    // Browser preflight requests cannot carry the eventual Authorization header.
    if (request.method === 'OPTIONS') {
      return;
    }

    if (!hasValidBearerToken(request.headers.authorization, app.config.apiSecretKey)) {
      return reply
        .status(401)
        .send(
          createOpenAiError(
            'Invalid or missing API key',
            'authentication_error',
            'invalid_api_key',
          ),
        );
    }

    const decision = rateLimiter.consume(rateLimitKey(request.ip, request.headers.authorization));
    if (!decision.allowed) {
      reply.header('Retry-After', String(decision.retryAfterSeconds));
      return reply
        .status(429)
        .send(
          createOpenAiError(
            'Rate limit exceeded. Try again later.',
            'rate_limit_error',
            'rate_limit_exceeded',
          ),
        );
    }
  });

  await app.register(cors, {
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  });

  app.setErrorHandler<FastifyError>((error, _request, reply) => {
    app.log.error(error);

    const statusCode = error.statusCode ?? 500;

    reply
      .status(statusCode)
      .send(
        createOpenAiError(
          error.message,
          statusCode >= 500 ? 'internal_server_error' : 'invalid_request_error',
          error.code ?? 'internal_error',
        ),
      );
  });

  await app.register(healthRoute);
  await app.register(statusRoute);
  await app.register(modelsRoute);
  await app.register(chatCompletionsRoute);
  await app.register(embeddingsRoute);

  app.setNotFoundHandler((_request, reply) => {
    return reply
      .status(404)
      .send(
        createOpenAiError(
          'The requested endpoint does not exist',
          'invalid_request_error',
          'not_found',
        ),
      );
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    config: {
      ollamaBaseUrl: string;
      ollamaRequestTimeoutMs: number;
      qdrantUrl: string;
      apiSecretKey: string;
    };
  }
}
