import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { loginWithEmailAndPassword } from '~/services/auth0';

const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string({ required_error: 'password is required.' }),
});

type LoginRequest = z.infer<typeof loginRequestSchema>;

const loginResponseSchema = z.object({
  accessToken: z.string(),
  id: z.string(),
  email: z.string(),
  permissions: z.array(z.string()),
  roles: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
    }),
  ),
});

type LoginResponse = z.infer<typeof loginResponseSchema>;

export async function authorizationController(fastify: FastifyInstance) {
  fastify.post<{ Body: LoginRequest; Reply: LoginResponse }>(
    '/auth/login',
    {
      schema: {
        body: loginRequestSchema,
        response: {
          [StatusCodes.OK]: loginResponseSchema,
        },
      },
    },
    async function (request, reply) {
      const user = await loginWithEmailAndPassword(request.body);

      reply.status(StatusCodes.OK);
      reply.send(user);
    },
  );
}
