import type { LoaderFunctionArgs } from '@remix-run/node';
import { Authenticator, Authorizer } from 'remix-auth';
import { FormStrategy } from 'remix-auth-form';
import { z } from 'zod';

import { sessionStorage } from '~/services/session.server';
import type { User } from '~/types';

import { getPublicClient } from './platform-backend.server';

const formSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const client = getPublicClient();

export const authenticator = new Authenticator<User>(sessionStorage);
authenticator.use(
  new FormStrategy(async ({ form }) => {
    const { email, password } = formSchema.parse({
      email: form.get('email'),
      password: form.get('password'),
    });

    return client.loginWithEmailAndPassword({ email, password });
  }),
  'email-password',
);

export async function requireUser(request: Request) {
  const url = new URL(request.url);

  return await authenticator.isAuthenticated(request, {
    failureRedirect: `/login?returnTo=${encodeURIComponent(`${url.pathname}${url.search}`)}`,
  });
}

export async function requireUserWithFeatures(
  { request, params, context }: LoaderFunctionArgs,
) {
  const authorizer = new Authorizer<User>(authenticator, []);

  return authorizer.authorize({ request, params, context });
}
