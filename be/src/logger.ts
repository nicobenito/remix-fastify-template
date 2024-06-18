import { pino } from 'pino';
import pretty from 'pino-pretty';

const isProduction = process.env.NODE_ENV === 'production';

const streams = [
  isProduction
    ? { level: 'info' as const, stream: process.stdout }
    : (() => {
        return {
          level: 'debug' as const,
          stream: pretty({
            colorize: true,
            translateTime: true,
          }),
        };
      })(),
].filter(Boolean);

export const logger = pino(
  {
    formatters: {
      bindings() {
        return {};
      },
      level(level) {
        return { level };
      },
    },
    level: 'debug',
    serializers: {
      err: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
    timestamp: pino.stdTimeFunctions.isoTime,
  },
  pino.multistream(streams),
);
