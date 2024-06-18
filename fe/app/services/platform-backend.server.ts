import { Zodios } from '@zodios/core';
import { pluginToken } from '@zodios/plugins';
import type { AxiosError } from 'axios';
import axios, { isAxiosError } from 'axios';
import { z } from 'zod';

import { env } from '~/env.server';
import { productSchema } from '~/schemas';
import { logger } from '~/services/logger.server';
import type {
  User,
} from '~/types';

import { version } from '../../package.json';

const forbiddenErrorSchema = z.object({
  error: z.literal('Forbidden'),
  message: z.string(),
  statusCode: z.literal(403),
});

const catchAllErrorSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number(),
});

type AxiosErrorWithMessage = AxiosError<{ message?: string }>;

function isAxiosErrorWithMessage(error: AxiosError): error is AxiosErrorWithMessage {
  const err = error as AxiosErrorWithMessage;

  return err.response?.data?.message !== undefined;
}

export class BackendError extends Error {
  static fromAxiosError(error: AxiosError) {
    return new BackendError(isAxiosErrorWithMessage(error) ? error.response?.data?.message : error.message, {
      cause: error,
    });
  }

  get isBackendError() {
    return true;
  }
}

function errorDecoder(error: unknown) {
  if (isAxiosError(error)) {
    return BackendError.fromAxiosError(error);
  }

  if (error instanceof Error) {
    return error;
  }

  return new Error('Unexpected error.', {
    cause: error,
  });
}

function createHttpClient() {
  return axios.create({
    baseURL: env.PLATFORM_BACKEND_URL,
    headers: {
      'User-Agent': `Platform Frontend v${version}`,
    },
  });
}

const httpClient = createHttpClient();


export enum AuthorizationScopes {
  CreateProducts = 'product:create',
  ReadProducts = 'product:read',
}

const userSchema = z.object({
  accessToken: z.string(),
  email: z.string().email(),
  id: z.string(),
  permissions: z.array(z.string()),
});

export const menuValidationSchema = z.array(
  z.object({
    name: z.string(),
    message: z.string(),
    line: z.number(),
  }),
);

export function getPublicClient() {
  const client = new Zodios(
    env.PLATFORM_BACKEND_URL,
    [
      {
        method: 'post',
        path: '/auth/login',
        alias: 'loginWithEmailAndPassword',
        description: 'Logs in to Platform service.',
        response: userSchema,
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
        parameters: [
          {
            name: 'body',
            type: 'Body',
            schema: z.object({
              email: z.string().email(),
              password: z.string(),
            }),
          },
        ],
      },
    ],
    {
      axiosConfig: {
        headers: {
          'User-Agent': `platform-frontend v${version}`,
        },
      },
    },
  );
  client.use('loginWithEmailAndPassword', {
    name: 'loginWithEmailAndPassword-error-handler',
    error: (api, config, error) => {
      const err = errorDecoder(error);
      // @ts-expect-error we know that we have an email here
      logger.warn({ email: config.data.email, err }, 'Error logging in with email and password.');

      throw err;
    },
  });

  return client;
}

export function getAuthenticatedClient(user: User) {
  const client = new Zodios(
    env.PLATFORM_BACKEND_URL,
    [
      {
        method: 'get',
        description: 'Gets product.',
        path: '/product',
        alias: 'getProduct',
        parameters: [
          { type: 'Query', name: 'id', schema: z.number() },
        ],
        response: productSchema,
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
      },
      {
        method: 'get',
        description: 'Gets products.',
        path: '/products',
        alias: 'getProducts',
        response: z.array(productSchema),
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
      },
      {
        method: 'post',
        description: 'Creates a new product.',
        path: '/products',
        alias: 'upsertProduct',
        response: z.object({
          id: z.number(),
        }),
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
        parameters: [
          {
            name: 'body',
            type: 'Body',
            schema: z.object({
              id: z.number().optional(),
              name: z.string(),
              price: z.number(),
            }),
          },
        ],
      },
      {
        method: 'delete',
        description: 'Deletes a product.',
        path: '/products',
        alias: 'deleteProduct',
        response: z.void(),
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
        parameters: [
          {
            name: 'body',
            type: 'Body',
            schema: z.object({
              id: z.number(),
            }),
          },
        ],
      },
      {
        method: 'put',
        description: 'Updates a product.',
        path: '/products',
        alias: 'updateProduct',
        response: z.void(),
        errors: [
          {
            status: 403,
            schema: forbiddenErrorSchema,
          },
          {
            status: 'default',
            schema: catchAllErrorSchema,
          },
        ],
        parameters: [
          {
            name: 'body',
            type: 'Body',
            schema: z.object({
              id: z.number(),
              name: z.string().optional(),
              price: z.number().optional(),
            }),
          },
        ],
      },
    ],
    {
      axiosConfig: {
        headers: {
          'User-Agent': `platform-frontend v${version}`,
        },
      },
    },
  );

  client.use(
    pluginToken({
      getToken: async () => user.accessToken,
    }),
  );

  return client;
}
