import { describe, expect, test, vi } from 'vitest';

import { AuthorizationScopes } from '~/constants';
import { createApp } from '~/server';
import { generateJwt } from '~/services/jwt';

vi.mock('~/logger');

describe('checkScopes', () => {
  test('it allows to configure a custom onUnauthorized callback', async () => {
    const onUnauthorized = vi.fn();
    const app = await createApp({
      logger: false,
    });
    app.get(
      '/test',
      {
        preValidation: app.auth([
          app.checkScopes([AuthorizationScopes.ReadBatch], {
            onUnauthorized,
          }),
        ]),
      },
      async (request, reply) => {
        reply.send({
          message: 'ok',
        });
      },
    );
    const jwt = generateJwt('auth0|123', [AuthorizationScopes.ReadBatchAdjustment]);
    const response = await app.inject({
      method: 'GET',
      url: '/test',
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
    });

    expect(response.json()).toStrictEqual({
      message: 'ok',
    });
    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });
});
