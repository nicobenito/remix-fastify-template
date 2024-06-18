import { createCookieSessionStorage } from '@remix-run/node';

import { env, isProduction } from '~/env.server';

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'platform-session',
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secrets: [env.SESSION_SECRET],
    secure: isProduction,
    maxAge: env.SESSION_MAX_AGE,
  },
});

export const { getSession, commitSession, destroySession } = sessionStorage;
