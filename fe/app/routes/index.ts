import type { LoaderFunction } from '@remix-run/node';

import { authenticator } from '~/services/auth.server';

export const loader: LoaderFunction = async ({ request }) => {
  return await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
    failureRedirect: '/login',
  });
};
