import { parseEnv, port, z } from 'znv';

export const env = parseEnv(process.env, {
  AUTH0_AUDIENCE: {
    schema: z.string(),
    defaults: {
      development: 'http://localhost:3000',
    },
  },
  AUTH0_CLIENT_ID: z.string(),
  AUTH0_CLIENT_SECRET: z.string(),
  AUTH0_DOMAIN: {
    schema: z.string(),
    defaults: {
      development: 'chefos-dev.us.auth0.com',
      _: 'chefos.us.auth0.com',
    },
  },
  DATABASE_URL: z.string(),
  DEFAULT_DATETIME_ZONE: {
    schema: z.string(),
    description: 'Set the default datetime zone.',
    defaults: {
      _: 'UTC',
    },
  },
  FASTIFY_DISABLE_REQUEST_LOGGING: {
    schema: z.boolean().optional(),
    description: 'Disable request logging.',
    defaults: {
      _: false,
    },
  },
  HOST: {
    schema: z.string(),
    defaults: {
      _: '0.0.0.0',
    },
  },
  NODE_ENV: {
    schema: z.enum(['production', 'development', 'test']),
    defaults: {
      _: 'development' as const,
    },
  },
  PRISMA_TRACE_LOGGER_ENABLED: {
    schema: z.boolean(),
    defaults: {
      _: false,
    },
  },
  PRISMA_TRACE_LOGGER_LEVEL: {
    schema: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']),
    defaults: {
      _: 'debug' as const,
    },
  },
  PRISMA_TRACE_OTLP_ENABLED: {
    schema: z.boolean(),
    description:
      'Enables Prisma OpenTelemetry tracing. See https://www.prisma.io/docs/concepts/components/prisma-client/opentelemetry-tracing',
    defaults: {
      _: false,
    },
  },
  PORT: port().default(3000),
  TZ: {
    schema: z.string(),
    description: 'Set the default datetime zone.',
    defaults: {
      _: 'UTC',
    },
  },
});

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
