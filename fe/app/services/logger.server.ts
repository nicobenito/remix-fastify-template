import pino from 'pino';

import { isDevelopment } from '~/env.server';

export const logger = pino({
  ...(isDevelopment
    ? {
        level: 'debug',
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
          },
        },
      }
    : {
        level: 'info',
      }),
  formatters: {
    bindings() {
      return {};
    },
    level(level) {
      return { level };
    },
  },
  serializers: {
    err: pino.stdSerializers.err,
    req: pino.stdSerializers.req,
    res: pino.stdSerializers.res,
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
