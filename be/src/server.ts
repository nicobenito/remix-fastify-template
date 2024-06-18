import fastifyMultiPart from '@fastify/multipart';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import closeWithGrace from 'close-with-grace';
import type { FastifyServerOptions } from 'fastify';
import Fastify from 'fastify';
import healthcheckPlugin from 'fastify-healthcheck';
import type { ResponseValidationError, ZodTypeProvider } from 'fastify-type-provider-zod';
import { jsonSchemaTransform, validatorCompiler } from 'fastify-type-provider-zod';
import { StatusCodes } from 'http-status-codes';
import hyperid from 'hyperid';
import { match, P } from 'ts-pattern';
import { ZodError } from 'zod';

import { rootController } from '~/controllers/root-controller';
import { env } from '~/env';
import { isPlatformServiceErrorAggregate } from '~/errors';
import { logger } from '~/logger';
import { fastifyAuthenticator } from '~/services/fastify/fastify-authenticator';
import { fastifyResponseTime } from '~/services/fastify/fastify-response-time';
import { serializerCompiler } from '~/services/fastify-zod';

import { version } from '../package.json';

const uuid = hyperid({ urlSafe: true });

function isResponseValidationError(error: unknown): error is ResponseValidationError {
  // @ts-expect-error we are trying to narrow the type
  return typeof error === 'object' && error?.name === 'ResponseValidationError';
}
export async function createApp(options: FastifyServerOptions = {}) {
  const app = Fastify({
    disableRequestLogging: env.FASTIFY_DISABLE_REQUEST_LOGGING,
    logger,
    genReqId: () => uuid(),
    ...options,
  }).withTypeProvider<ZodTypeProvider>();
  app.setSerializerCompiler(serializerCompiler);
  app.setValidatorCompiler(validatorCompiler);
  const originalErrorHandler = app.errorHandler;
  app.setErrorHandler(function (error, request, reply) {
    const validation = match<Error, Record<string, unknown>[]>(error)
      .with(P.instanceOf(ZodError), (err) => {
        return JSON.parse(err.message) as Record<string, unknown>[];
      })
      .with(P.when(isPlatformServiceErrorAggregate), (err) => {
        return err.errors;
      })
      .with(P.when(isResponseValidationError), (err) => {
        return err.details.issues;
      })
      .otherwise(() => {
        return [];
      });
    if (validation.length > 0) {
      logger.warn({ validation }, 'Validation error.');
      reply.status(StatusCodes.BAD_REQUEST).send({
        error: 'Bad Request',
        message: error instanceof ZodError ? 'Validation error' : error.message,
        statusCode: StatusCodes.BAD_REQUEST,
        validation,
      });

      return;
    }

    originalErrorHandler(error, request, reply);
  });

  await app.register(fastifyMultiPart);
  await app.register(fastifyResponseTime);
  await app.register(healthcheckPlugin, {
    exposeUptime: true,
    healthcheckUrl: '/healthz',
    logLevel: 'error',
  });
  await app.register(fastifySwagger, {
    openapi: {
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
      info: {
        title: 'Platform API',
        description: 'API for platform service',
        version,
      },
    },
    transform: jsonSchemaTransform,
  });
  await app.register(fastifySwaggerUi, {
    logo: {
      content: Buffer.from(
        'PHN2ZyB3aWR0aD0iMTMxIiBoZWlnaHQ9IjI4IiB2aWV3Qm94PSIwIDAgMTMxIDI4IiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPgo8ZyBjbGlwLXBhdGg9InVybCgjY2xpcDBfMTEzMzBfMTA1OTYpIj4KPHBhdGggZD0iTTc3Ljg1NCAyMi44MDE5Qzc3LjU4ODkgMjIuMzcwNiA3Ny4yMzA3IDIxLjkzMDcgNzYuNzc5MiAyMS40NzkxTDY3LjAxMzMgMTEuNzA5N0M2Ni44MzI3IDExLjUyOSA2Ni44MzI3IDExLjIzNzYgNjcuMDEzMyAxMS4wNTdMNzMuODMxNyA0LjIzNjE5Qzc0LjA0MTQgNC4wMjY0MSA3NC4yMTAzIDMuODcxOTggNzQuMzMyNyAzLjc3ODc1Qzc0LjQ1NSAzLjY4NTUxIDc0LjU2NTcgMy42MzMwNyA3NC42NTg5IDMuNjI0MzNDNzQuNzUyMSAzLjYxNTU4IDc0Ljg0NTMgMy42NTYzOCA3NC45Mjk3IDMuNzQwODdMNzUuMDI1OCAzLjgzNzAyQzc1LjEzMzYgMy45NDQ4MyA3NS4xODYgNC4wNDY4IDc1LjE4NiA0LjE0Mjk1Qzc1LjE4NiA0LjIzOTEgNzUuMTM5NCA0LjM0NjkxIDc1LjA1MjEgNC40NzIxOUM3NC45NjQ3IDQuNTk0NTcgNzQuODEzMiA0Ljc2NjQ3IDc0LjU5NDggNC45ODQ5OUw2OS4zMzE3IDEwLjI0OTlDNjguODEwNCAxMC43NzE1IDY4LjgxMDQgMTEuNjIyMiA2OS4zMzE3IDEyLjE0MzhMNjkuNDgzMiAxMi4yOTUzQzcwLjAwNDUgMTIuODE2OCA3MC44NTUgMTIuODE2OCA3MS4zNzY0IDEyLjI5NTNMNzYuNzI5NyA2Ljk0MDA0Qzc3LjE4MTIgNi40ODg0MyA3Ny41NDIzIDYuMDQ1NTUgNzcuODA3NCA1LjYxMTQyQzc4LjA3NTMgNS4xNzcyOSA3OC4xNjg1IDQuNjQ0MSA3OC4wODcgNC4wMDg5M0M3OC4wMDg0IDMuMzczNzUgNzcuNjAwNiAyLjY4OTA1IDc2Ljg2MzcgMS45NTE5TDc2Ljc1NTkgMS44NDQxQzc2LjA0MjMgMS4xMzAyNiA3NS4zNjk1IDAuNzM5ODMgNzQuNzQwNCAwLjY3ODY0NEM3NC4xMTEzIDAuNjE3NDU4IDczLjU3ODMgMC43MTk0MzUgNzMuMTQxNCAwLjk5MDQwM0M3Mi43MDQ1IDEuMjYxMzcgNzIuMjcwNSAxLjYxMzkyIDcxLjgzNjYgMi4wNDgwNUw2NC45MTkxIDguOTY3OTNDNjQuNzM4NSA5LjE0ODU3IDY0LjQ0NzMgOS4xNDg1NyA2NC4yNjY3IDguOTY3OTNMNTUuNzAzNyAwLjM5MzEwOEM1NS4xODIzIC0wLjEyODQzMiA1NC4zMzQ3IC0wLjEyODQzMiA1My44MTA1IDAuMzkzMTA4TDUzLjYzNTcgMC41Njc5MjZDNTMuMTE0NCAxLjA4OTQ3IDUzLjExNDQgMS45NDAyNSA1My42MzU3IDIuNDYxNzlMNzQuNTc3MyAyMy40MTA4Qzc0LjgwMTYgMjMuNjM1MSA3NC45NTg5IDIzLjgxIDc1LjA1MjEgMjMuOTQxMUM3NS4xNDUzIDI0LjA3MjIgNzUuMTg5IDI0LjE5MTcgNzUuMTgzMSAyNC4yOTk1Qzc1LjE3NzMgMjQuNDA3MyA3NS4xMTYxIDI0LjUyMDkgNzQuOTk5NiAyNC42Mzc0TDc0Ljk2NzYgMjQuNjY5NUM3NC44NTExIDI0Ljc4NiA3NC43NDA0IDI0Ljg0NzIgNzQuNjI5NyAyNC44NTNDNzQuNTIyIDI0Ljg1ODkgNzQuNDAyNiAyNC44MTUyIDc0LjI3MTUgMjQuNzIxOUM3NC4xNDA0IDI0LjYyODcgNzMuOTY1NyAyNC40NzE0IDczLjc0MTQgMjQuMjQ3TDYzLjc4MzIgMTQuMjg1M0w2My4xODYxIDEzLjY4OEw1Mi44MDI3IDMuMjkyMTdDNTIuMjgxNCAyLjc3MDYzIDUxLjQzMDkgMi43NzA2MyA1MC45MDk1IDMuMjkyMTdMNTAuNzM0OCAzLjQ2Njk5QzUwLjIxMzQgMy45ODg1MyA1MC4yMTM0IDQuODM5MzEgNTAuNzM0OCA1LjM2MDg1TDU5LjMwMzYgMTMuOTMyOEM1OS40ODQyIDE0LjExMzQgNTkuNDg0MiAxNC40MDQ4IDU5LjMwMzYgMTQuNTg1NEw1Mi4zNzc1IDIxLjUxNEM1MS45NDkzIDIxLjk0MjMgNTEuNTk5OCAyMi4zNzM1IDUxLjMyODkgMjIuODEwNkM1MS4wNTgxIDIzLjI0NzYgNTAuOTU2MSAyMy43ODA4IDUxLjAxNzMgMjQuNDEwMkM1MS4wODE0IDI1LjAzOTUgNTEuNDY4NyAyNS43MTI2IDUyLjE4MjMgMjYuNDI2NEw1Mi4yOTAxIDI2LjUzNDJDNTMuMDI3IDI3LjI3MTQgNTMuNzExNCAyNy42NzkzIDU0LjM0NjQgMjcuNzU3OUM1NC45ODEzIDI3LjgzNjYgNTUuNTE0MyAyNy43NDYzIDU1Ljk0MjUgMjcuNDgxMUM1Ni4zNzM2IDI3LjIxNiA1Ni44MTM0IDI2Ljg1NzYgNTcuMjY0OCAyNi40MDZMNjIuNjk5NyAyMC45NjkyQzYzLjIyMTEgMjAuNDQ3NiA2My4yMjExIDE5LjU5NjkgNjIuNjk5NyAxOS4wNzUzTDYyLjU0ODMgMTguOTIzOEM2Mi4wMjY5IDE4LjQwMjMgNjEuMTc2NCAxOC40MDIzIDYwLjY1NTEgMTguOTIzOEw1NS4zMDE3IDI0LjI3OTFDNTUuMDg5MSAyNC40OTE4IDU0LjkyMzEgMjQuNjQwNCA1NC44MDA4IDI0LjcyNzhDNTQuNjc4NCAyNC44MTUyIDU0LjU3MDcgMjQuODU4OSA1NC40Nzc1IDI0Ljg1NkM1NC4zODQzIDI0Ljg1NiA1NC4yODgxIDI0LjgwMzUgNTQuMTg5MSAyNC43MDE1TDU0LjA4MTMgMjQuNTkzN0M1My45OTQgMjQuNTA2MyA1My45NTYxIDI0LjQxNiA1My45NjQ4IDI0LjMyMjhDNTMuOTczNiAyNC4yMjk1IDU0LjAyMzEgMjQuMTIxNyA1NC4xMTM0IDIzLjk5OTRDNTQuMjAzNyAyMy44Nzk5IDU0LjM1NTEgMjMuNzEzOCA1NC41Njc3IDIzLjUwMTFMNjEuMzk0OSAxNi42NzE2QzYxLjU3NTUgMTYuNDkwOSA2MS44NjY3IDE2LjQ5MDkgNjIuMDQ3MyAxNi42NzE2TDcxLjgxMzMgMjYuNDQxQzcyLjI2NDcgMjYuODkyNiA3Mi43MDc0IDI3LjI1MSA3My4xMzU2IDI3LjUxNjFDNzMuNTY2NiAyNy43ODEyIDc0LjA5NjcgMjcuODcxNiA3NC43MzE3IDI3Ljc5MjlDNzUuMzY2NiAyNy43MTQyIDc2LjA1MTEgMjcuMzA2MyA3Ni43ODggMjYuNTY5Mkw3Ni45MDc0IDI2LjQ0OTdDNzcuNjQ0MyAyNS43MTI2IDc4LjA1MiAyNS4wMjc5IDc4LjEzMDcgMjQuMzkyN0M3OC4yMDkzIDIzLjc1NzUgNzguMTE5IDIzLjIyNDMgNzcuODU0IDIyLjc5NlYyMi44MDE5WiIgZmlsbD0iI0Y1QzAyNyIvPgo8cGF0aCBkPSJNNDYuNDA2NCAwLjA3OTEwMTZINDIuNjk1N0wzOC44NDgyIDEyLjkyODJWMC4wNzkxMDE2SDM1LjQ0NjNWMjguMDAwNEgzOC44NDgyVjE1LjA3MjdMNDIuNjk1NyAyNy45MjQ3SDQ2LjQwNjRMNDEuOTM1NiAxNC4wMDA0TDQ2LjQwNjQgMC4wNzkxMDE2WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTE3LjAxNTIgMEgxNS44MjY5QzEzLjU5NTggMCAxMS43ODQyIDEuODEyMjggMTEuNzg0MiA0LjA0NDEyVjIzLjk1NTlDMTEuNzg0MiAyNi4xOTA2IDEzLjU5NTggMjggMTUuODI2OSAyOEgxNy4wMTUyQzE5LjI0OTIgMjggMjEuMDU3OSAyNi4xODc3IDIxLjA1NzkgMjMuOTU1OVY0LjA0NDEyQzIxLjA1NzkgMS44MTIyOCAxOS4yNDYzIDAgMTcuMDE1MiAwWk0xNy42NTYgMjQuMDQ5MUMxNy42NTYgMjQuNzMwOSAxNy4xMDI2IDI1LjI4NDUgMTYuNDIxIDI1LjI4NDVDMTUuNzM5NSAyNS4yODQ1IDE1LjE4NjEgMjQuNzMwOSAxNS4xODYxIDI0LjA0OTFWMy45NTA4OEMxNS4xODYxIDMuMjY5MDkgMTUuNzM5NSAyLjcxNTUgMTYuNDIxIDIuNzE1NUMxNy4xMDI2IDIuNzE1NSAxNy42NTYgMy4yNjkwOSAxNy42NTYgMy45NTA4OFYyNC4wNDkxWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTI4Ljc5OTQgMEgyNy42MTRDMjUuMzc3MSAwIDIzLjU2ODQgMS44MTIyOCAyMy41Njg0IDQuMDQ0MTJWMjMuOTU1OUMyMy41Njg0IDI2LjE5MDYgMjUuMzggMjggMjcuNjExIDI4SDI4Ljc5NjVDMzEuMDMwNCAyOCAzMi44MzkyIDI2LjE4NzcgMzIuODM5MiAyMy45NTU5VjQuMDQ0MTJDMzIuODQyMSAxLjgxMjI4IDMxLjAzMDQgMCAyOC43OTk0IDBaTTI5LjQ0MDIgMjQuMDQ5MUMyOS40NDAyIDI0LjczMDkgMjguODg2OCAyNS4yODQ1IDI4LjIwNTIgMjUuMjg0NUMyNy41MjM3IDI1LjI4NDUgMjYuOTcwMyAyNC43MzA5IDI2Ljk3MDMgMjQuMDQ5MVYzLjk1MDg4QzI2Ljk3MDMgMy4yNjkwOSAyNy41MjM3IDIuNzE1NSAyOC4yMDUyIDIuNzE1NUMyOC44ODY4IDIuNzE1NSAyOS40NDAyIDMuMjY5MDkgMjkuNDQwMiAzLjk1MDg4VjI0LjA0OTFaIiBmaWxsPSJ3aGl0ZSIvPgo8cGF0aCBkPSJNNS4yMzEwMyAwSDQuMDQyNjlDMS44MTE2NCAwIDAgMS44MTIyOCAwIDQuMDQ0MTJWMjMuOTU1OUMwIDI2LjE5MDYgMS44MTE2NCAyOCA0LjA0MjY5IDI4SDUuMjMxMDNDNy40NjQ5OSAyOCA5LjI3MzcyIDI2LjE4NzcgOS4yNzM3MiAyMy45NTU5VjE3LjcyMzZINS44NzE4VjI0LjA0OTFDNS44NzE4IDI0LjczMDkgNS4zMTg0MSAyNS4yODQ1IDQuNjM2ODYgMjUuMjg0NUMzLjk1NTMxIDI1LjI4NDUgMy40MDE5MiAyNC43MzA5IDMuNDAxOTIgMjQuMDQ5MVYzLjk1MDg4QzMuNDAxOTIgMy4yNjkwOSAzLjk1NTMxIDIuNzE1NSA0LjYzNjg2IDIuNzE1NUM1LjMxODQxIDIuNzE1NSA1Ljg3MTggMy4yNjkwOSA1Ljg3MTggMy45NTA4OFYxMC4yNzY0SDkuMjczNzJWNC4wNDQxMkM5LjI3MzcyIDEuODEyMjggNy40NjIwOCAwIDUuMjMxMDMgMFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMDAuODIyIDE3LjEzOEw5Ny43MjA2IDBIOTUuMjk3M0g5NC43MDAyVjI3LjkyNDJIOTcuNzIwNlYxMi4zNzQyTDk5LjgzNTEgMjcuOTI0MkgxMDAuODIySDEwMi4yNThIMTAzLjg0M1YwSDEwMC44MjJWMTcuMTM4WiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTEwOS40NjggMEgxMDYuNDQ3VjI3LjkyNDJIMTA5LjQ2OFYwWiIgZmlsbD0id2hpdGUiLz4KPHBhdGggZD0iTTExMy44NjggMEgxMTEuOTA4VjIuODIwNEgxMTMuODY4VjI3LjkyNDJIMTE2Ljg4OVYyLjgyMDRIMTE4Ljg0NlYwSDExNi44ODlIMTEzLjg2OFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMjcuOTggMEwxMjUuOTU5IDguODM3MDVMMTIzLjk0IDBIMTIwLjkxN0wxMjQuNDUgMTQuODQ3OVYyNy45MjQySDEyNy40N1YxNC44NDc5TDEzMSAwSDEyNy45OFoiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik04OC42NzQzIDIzLjk3MzRDODguNjc0MyAyNC42NTUyIDg4LjEzMjYgMjUuMjA4NyA4Ny40Njg1IDI1LjIwODdDODYuODA0NSAyNS4yMDg3IDg2LjI2MjcgMjQuNjU1MiA4Ni4yNjI3IDIzLjk3MzRWMEg4Mi45MzY1VjIzLjg3NzJDODIuOTM2NSAyNi4xMTIgODQuNzA3NCAyNy45MjEzIDg2Ljg4ODkgMjcuOTIxM0g4OC4wNDgxQzkwLjIzMjYgMjcuOTIxMyA5Mi4wMDA1IDI2LjEwOTEgOTIuMDAwNSAyMy44NzcyVjBIODguNjc0M1YyMy45NzM0WiIgZmlsbD0id2hpdGUiLz4KPC9nPgo8ZGVmcz4KPGNsaXBQYXRoIGlkPSJjbGlwMF8xMTMzMF8xMDU5NiI+CjxyZWN0IHdpZHRoPSIxMzEiIGhlaWdodD0iMjgiIGZpbGw9IndoaXRlIi8+CjwvY2xpcFBhdGg+CjwvZGVmcz4KPC9zdmc+Cg==',
        'base64',
      ),
      type: 'image/svg+xml',
    },
    routePrefix: '/docs',
    uiConfig: {
      deepLinking: false,
      docExpansion: 'full',
    },
  });
  await app.register(fastifyAuthenticator, {
    audience: env.AUTH0_AUDIENCE,
    domain: env.AUTH0_DOMAIN,
  });
  app.register(rootController);

  return app;
}

export type PlatformBackendFastifyApplication = Awaited<ReturnType<typeof createApp>>;

export async function run() {
  const app = await createApp({
    trustProxy: true,
  });

  closeWithGrace({ delay: 10_000, logger }, async function ({ err, signal }: { err?: Error; signal?: string }) {
    if (err) {
      app.log.error(err);
    }

    app.log.info(`[${signal}] Gracefully closing the server instance.`);

    await app.close();
  });

  app.listen({ port: env.PORT, host: env.HOST }, (err) => {
    if (err) {
      app.log.error(err);

      // eslint-disable-next-line unicorn/no-process-exit
      process.exit(1);
    }
  });
}
