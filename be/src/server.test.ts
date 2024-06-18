import { StatusCodes } from 'http-status-codes';
import { describe, expect, test, vi } from 'vitest';
import { z } from 'zod';

import { logger } from '~/logger';
import { createApp } from '~/server';

vi.mock('~/logger');

const mockLogger = vi.mocked(logger);

describe('healthcheck', () => {
  test('it responds with "ok" status', async () => {
    const app = await createApp({
      logger: false,
    });
    const response = await app.inject({
      method: 'GET',
      url: '/healthz',
    });

    expect(response.statusCode).toBe(StatusCodes.OK);
    expect(response.json()).toMatchObject({
      statusCode: StatusCodes.OK,
      status: 'ok',
      uptime: expect.any(Number),
    });
  });
});

describe('errors', () => {
  test('it responds with "bad request" when request fails to pass validation', async () => {
    const app = await createApp({
      logger: false,
    });
    app.get(
      '/error',
      {
        schema: {
          querystring: z.object({
            name: z.string().min(1),
          }),
        },
      },
      (request, reply) => {
        reply.send(request.query);
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/error',
    });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.json()).toStrictEqual({
      error: 'Bad Request',
      message: 'Validation error',
      statusCode: StatusCodes.BAD_REQUEST,
      validation: [
        {
          code: 'invalid_type',
          expected: 'string',
          message: 'Required',
          path: ['name'],
          received: 'undefined',
        },
      ],
    });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      {
        validation: [
          {
            code: 'invalid_type',
            expected: 'string',
            message: 'Required',
            path: ['name'],
            received: 'undefined',
          },
        ],
      },
      'Validation error.',
    );
  });

  test('it responds with "bad request" when response doesn\'t match the schema', async () => {
    const app = await createApp({
      logger: false,
    });
    app.get(
      '/error',
      {
        schema: {
          querystring: z.object({
            name: z.string().min(1),
          }),
          response: {
            [StatusCodes.OK]: z.object({
              id: z.number(),
              name: z.string().min(2),
            }),
          },
        },
      },
      (request, reply) => {
        reply.send({
          id: 1,
          name: request.query.name,
        });
      },
    );
    const response = await app.inject({
      method: 'GET',
      url: '/error',
      query: {
        name: 'J',
      },
    });

    expect(response.statusCode).toBe(StatusCodes.BAD_REQUEST);
    expect(response.json()).toStrictEqual({
      error: 'Bad Request',
      message: "Response doesn't match the schema",
      statusCode: StatusCodes.BAD_REQUEST,
      validation: [
        {
          code: 'too_small',
          exact: false,
          inclusive: true,
          message: 'String must contain at least 2 character(s)',
          minimum: 2,
          path: ['name'],
          type: 'string',
        },
      ],
    });
    expect(mockLogger.warn).toHaveBeenCalledWith(
      {
        validation: [
          {
            code: 'too_small',
            exact: false,
            inclusive: true,
            message: 'String must contain at least 2 character(s)',
            minimum: 2,
            path: ['name'],
            type: 'string',
          },
        ],
      },
      'Validation error.',
    );
  });

  test('it responds with "internal server error" when errors is not handled', async () => {
    const app = await createApp({
      logger: false,
    });
    app.get('/error', () => {
      throw new Error('Testing Internal Server Error');
    });
    const response = await app.inject({
      method: 'GET',
      url: '/error',
    });

    expect(response.statusCode).toBe(StatusCodes.INTERNAL_SERVER_ERROR);
    expect(response.json()).toStrictEqual({
      error: 'Internal Server Error',
      message: 'Testing Internal Server Error',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
    });
  });
});
