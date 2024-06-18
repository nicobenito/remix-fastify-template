// Adapted code to TypeScript from https://github.com/lolo32/fastify-response-time/blob/e10faa9a358eb4194a4d9aedc960a816f55cf1a5/index.js
import type { FastifyReply } from 'fastify';
import fastifyPlugin from 'fastify-plugin';

const symbolRequestTime = Symbol('RequestTimer');
const symbolServerTiming = Symbol('ServerTiming');

type Duration = null | number | string;

function generateTick(name: string, duration?: Duration, description?: string): string {
  const value = [name];

  if (typeof duration === 'string') {
    duration = Number.parseFloat(duration);
  }

  if (duration !== undefined && duration !== null && !Number.isNaN(duration)) {
    value.push(`;dur=${duration}`);
  }

  if (typeof description === 'string') {
    value.push(`;desc=${description.includes(' ') ? `"${description}"` : description}`);
  }

  return value.join('');
}

function setServerTiming(this: FastifyReply, name: string, duration?: Duration, description?: string) {
  const serverTiming = this[symbolServerTiming];
  if (serverTiming[name]) {
    return false;
  }

  serverTiming[name] = generateTick(name, duration, description);

  return true;
}

export const fastifyResponseTime = fastifyPlugin(
  (instance, options, next) => {
    if (options.digits === undefined || Number.isNaN(options.digits) || 0 > options.digits) {
      options.digits = 10;
    }
    options.header = options.header || 'x-response-time';

    instance.addHook('onRequest', function onRequestHook(request, reply, next) {
      request[symbolRequestTime] = process.hrtime();
      reply[symbolServerTiming] = {};

      next();
    });

    instance.addHook('onSend', function onSendHook(request, reply, payload, next) {
      const serverTiming = reply[symbolServerTiming];
      const headers = [];
      if (serverTiming) {
        for (const name of Object.keys(serverTiming)) {
          // @ts-ignore
          headers.push(serverTiming[name]);
        }
      }

      if (headers.length > 0) {
        reply.header('Server-Timing', headers.join(','));
      }

      const hrDuration = process.hrtime(request[symbolRequestTime]);
      const duration = (hrDuration[0] * 1e3 + hrDuration[1] / 1e6).toFixed(options.digits);
      reply.header(options.header, duration);

      next();
    });

    instance.decorateReply('setServerTiming', setServerTiming);

    next();
  },
  { name: 'fastify-response-time', fastify: '4.x' },
);

declare module 'fastify' {
  interface FastifyReply {
    setServerTiming: typeof setServerTiming;
  }
}
