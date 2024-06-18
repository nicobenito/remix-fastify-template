import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { authorizationController } from '~/controllers/authorization-controller';
import { productsController } from '~/controllers/products-controller';
import { versionController } from '~/controllers/version-controller';
import { env } from '~/env';
import { version } from '~/services/version';

const startedAt = new Date().toJSON();

const nodeSchema = z.object({
  env: z.string(),
  version: z.string(),
});

const versionSchema = z.object({
  major: z.number(),
  minor: z.number(),
  patch: z.number(),
  version: z.string(),
});

const rootResponseSchema = z.object({
  node: nodeSchema,
  startedAt: z.string().datetime(),
  uptime: z.number(),
  version: versionSchema,
});
type GetRootResponse = z.infer<typeof rootResponseSchema>;

export async function rootController(fastify: FastifyInstance) {
  fastify.register(authorizationController);
  fastify.register(productsController);
  fastify.register(versionController);

  fastify.get<{ Reply: GetRootResponse }>(
    '/',
    {
      schema: {
        response: {
          [StatusCodes.OK]: rootResponseSchema,
        },
      },
    },
    async function (request, reply) {
      reply.status(StatusCodes.OK);
      reply.send({
        node: {
          env: env.NODE_ENV,
          version: process.version,
        },
        startedAt,
        uptime: process.uptime(),
        version,
      });
    },
  );
}
