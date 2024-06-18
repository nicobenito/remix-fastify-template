import crypto from 'node:crypto';

import {createRequestHandler} from '@remix-run/express';
import {installGlobals} from '@remix-run/node';
import compression from 'compression';
import express from 'express';
import pino from 'pino';
import pinoHttp from 'pino-http';
import http from 'node:http';

installGlobals();

const logger = pino({
  ...(process.env.NODE_ENV === 'development'
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


async function start() {
  const viteDevServer =
    process.env.NODE_ENV === "production"
      ? undefined
      : await import("vite").then((vite) =>
        vite.createServer({
          server: { middlewareMode: true },
        })
      );

  const remixHandler = createRequestHandler({
    build: viteDevServer
      ? () => viteDevServer.ssrLoadModule("virtual:remix/server-build")
      : await import("./build/server/index.js"),
  });

  const app = express();
  app.use(
    pinoHttp({
      autoLogging: false,
      customLogLevel: function (req, res, err) {
        if (res.statusCode >= 400 && res.statusCode < 500) {
          return 'warn';
        }

        if (res.statusCode >= 500 || err) {
          return 'error';
        }

        if (res.statusCode >= 300 && res.statusCode < 400) {
          return 'silent';
        }

        return 'info';
      },
      genReqId: () => crypto.randomUUID(),
      logger,
    }),
  );
  app.use(compression());
  app.disable('x-powered-by');
  if (viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    app.use(
      "/assets",
      express.static("build/client/assets", { immutable: true, maxAge: "1y" })
    );
  }
  app.use(express.static('build/client', { maxAge: '1h' }));
  app.get('/healthz', (req, res) => {
    res.status(200);
    res.json({
      statusCode: 200,
      status: 'ok',
    });
  });
  app.all(
    '*',
    remixHandler,
  );

  const port = process.env.PORT ? Number(process.env.PORT) || 3000 : 3000;
  const host = process.env.HOST ?? '0.0.0.0';

  const server = http.createServer(app);
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;
  server.listen(port, host, () => {
    logger.info(`Server listening at http://${host}:${port}`);
  });
}

try {
  await start();
} catch (error) {
  logger.error({ err: error }, '🚩 Platform Frontend failed to start');

  // eslint-disable-next-line unicorn/no-process-exit
  process.exit(1);
}
