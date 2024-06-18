import { deprecate, parseEnv, port, z } from 'znv';

const oneDayInSeconds = 24 * 60 * 60;

export const env = parseEnv(process.env, {
  HOST: {
    schema: z.string(),
    defaults: {
      _: '0.0.0.0',
    },
  },
  PLATFORM_BACKEND_URL: {
    schema: z.string(),
    defaults: {
      production: 'https://platform-back.company.com',
      development: 'https://platform-back.dev.company.com',
      test: 'https://platform-back.test.company.com',
    },
  },
  LOCALE: {
    schema: z.string(),
    defaults: {
      _: 'en-US',
    },
  },
  NODE_ENV: {
    schema: z.enum(['production', 'development', 'test']),
    defaults: {
      _: 'development' as const,
    },
  },
  PORT: port().default(3000),
  SESSION_INACTIVITY_TIMEOUT: {
    schema: z.number().transform((value) => value * 60 * 1000),
    description: 'Indicates the number of minutes of inactivity until the session expires.',
    defaults: {
      _: 30,
    },
  },
  SESSION_MAX_AGE: {
    schema: z.number(),
    description: 'Indicates the number of seconds until the cookie expires.',
    defaults: {
      _: oneDayInSeconds,
    },
  },
  SESSION_SECRET: {
    schema: z.string(),
  },
});

export const isDevelopment = env.NODE_ENV === 'development';
export const isProduction = env.NODE_ENV === 'production';
export const isTest = env.NODE_ENV === 'test';
