import type { ActionFunction, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { Form, useLoaderData, useNavigation, useSearchParams } from '@remix-run/react';
import { AlertCircle } from 'lucide-react';
import { match } from 'ts-pattern';

import { Icons } from '~/components/icons';
import { Company } from '~/components/logos';
import { Alert as TwAlert, AlertTitle } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { authenticator } from '~/services/auth.server';
import { commitSession, getSession } from '~/services/session.server';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Sign in · Company Platform',
    },
  ];
};

const defaultSuccessRedirect = '/dashboard';

export const action: ActionFunction = async ({ request }) => {
  const formData = await request.formData();
  const successRedirect = (formData.get('returnTo') as string) ?? defaultSuccessRedirect;

  return authenticator.authenticate('email-password', request, {
    successRedirect,
    failureRedirect: `/login?returnTo=${encodeURIComponent(`${successRedirect}`)}`,
    context: { formData },
  });
};

export async function loader({ request }: LoaderFunctionArgs) {
  await authenticator.isAuthenticated(request, {
    successRedirect: '/dashboard',
  });

  const session = await getSession(request.headers.get('cookie'));
  const error = session.get(authenticator.sessionErrorKey) as { message: string } | undefined;
  session.unset(authenticator.sessionErrorKey);

  return json(
    { error },
    {
      headers: {
        'Set-Cookie': await commitSession(session),
      },
    },
  );
}

export default function LoginPage() {
  const { error } = useLoaderData<typeof loader>();
  const [searchParams] = useSearchParams();
  const navigation = useNavigation();

  const isLoadingOrSubmitting = ['loading', 'submitting'].includes(navigation.state);

  return (
    <div className="flex min-h-full flex-col justify-center px-6 py-12 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-sm">
        <div className="flex items-center justify-center mx-auto h-10 w-auto">
          <img src="/login.png" alt="Login" className="w-1/3" />
        </div>
        <h2 className="mt-10 text-center text-2xl font-bold leading-9 tracking-tight text-gray-300">
          Sign in to your account
        </h2>
        {error ? (
          <TwAlert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{error.message}</AlertTitle>
          </TwAlert>
        ) : null}
      </div>
      <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
        <Form className="space-y-6" method="post">
          <input type="hidden" name="returnTo" value={searchParams.get('returnTo') ?? defaultSuccessRedirect} />
          <div>
            <Label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-300">
              Email address
            </Label>
            <div className="mt-2">
              <Input
                disabled={isLoadingOrSubmitting}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-300">Password</Label>
            </div>
            <div className="mt-2">
              <Input
                disabled={isLoadingOrSubmitting}
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
              />
            </div>
          </div>
          <div>
            <Button className="w-full" disabled={isLoadingOrSubmitting} type="submit">
              {isLoadingOrSubmitting && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              {match(navigation.state)
                .with('submitting', () => 'Signing in')
                .with('loading', () => 'Redirecting')
                .otherwise(() => 'Sign in')}
            </Button>
          </div>
        </Form>
      </div>
    </div>
  );
}
