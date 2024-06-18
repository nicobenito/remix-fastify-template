import fastifyAuth from '@fastify/auth';
import type { User } from '@prisma/client';
import type { FastifyInstance, FastifyReply, FastifyRequest, HookHandlerDoneFunction } from 'fastify';
import type { FastifyAuth0VerifyOptions } from 'fastify-auth0-verify';
import { fastifyAuth0Verify } from 'fastify-auth0-verify';
import fastifyPlugin from 'fastify-plugin';
import { Unauthorized } from 'http-errors';

import { env } from '~/env';
import { logger } from '~/logger';
import { findOneUserByAuthZeroId } from '~/services/users';

type Scope = string;

type CheckScopesOptions = {
  onUnauthorized?: (error: unknown, request: FastifyRequest, reply: FastifyReply) => Promise<void> | void;
};

function checkScopes(scopes: Scope[], options: CheckScopesOptions = {}) {
  return async function (this: FastifyInstance, request: FastifyRequest, reply: FastifyReply) {
    try {
      await this.authenticate(request, reply);

      // @ts-ignore
      const userPermissions = request.user?.permissions ?? [];
      if (!scopes.every((permission) => userPermissions.includes(permission))) {
        logger.warn({ req: request, scopes, userPermissions }, 'User is not authorized.');

        throw new Unauthorized('You dont have the right permissions.');
      }
    } catch (error) {
      if (options.onUnauthorized) {
        return options.onUnauthorized(error, request, reply);
      }

      throw error;
    }
  };
}

async function maybeAugmentRequestWithPlatformUser(request: FastifyRequest) {
  // request.user is available only after JWT verification
  // @ts-ignore
  if (!request.user?.sub) {
    return;
  }

  try {
    // @ts-ignore
    request.platformUser = await findOneUserByAuthZeroId(request.user.sub);
  } catch (error) {
    // @ts-ignore
    logger.error({ err: error, authZeroId: request.user.sub }, 'Could not fetch Platform user.');
  }
}

function plugin(fastify: FastifyInstance, options: FastifyAuth0VerifyOptions, done: HookHandlerDoneFunction) {
  fastify.register(fastifyAuth0Verify, options);
  fastify.register(fastifyAuth);
  fastify.decorate('checkScopes', checkScopes);
  fastify.addHook('preHandler', maybeAugmentRequestWithPlatformUser);
  done();
}

export const fastifyAuthenticator = fastifyPlugin(plugin, { name: 'fastify-authenticator', fastify: '4.x' });

declare module 'fastify' {
  interface FastifyInstance {
    checkScopes: typeof checkScopes;
  }

  interface FastifyRequest {
    platformUser: User | null;
  }
}
