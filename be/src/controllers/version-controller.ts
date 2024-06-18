import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { version } from '~/services/version';

const getVersionResponseSchema = z.object({
  major: z.number(),
  minor: z.number(),
  patch: z.number(),
  version: z.string(),
});
type GetVersionResponse = z.infer<typeof getVersionResponseSchema>;

export async function versionController(fastify: FastifyInstance) {
  fastify.get<{ Reply: GetVersionResponse }>(
    '/version',
    {
      schema: {
        response: {
          [StatusCodes.OK]: getVersionResponseSchema,
        },
      },
    },
    async function (request, reply) {
      reply.status(StatusCodes.OK);
      reply.send(version);
    },
  );
}
