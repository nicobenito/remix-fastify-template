import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import '~/styles/nprogress.css';
import '~/styles/tailwind.css';


import { withEmotionCache } from '@emotion/react';
import { unstable_useEnhancedEffect as useEnhancedEffect } from '@mui/material/utils';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterLuxon as DateAdapter } from '@mui/x-date-pickers/AdapterLuxon';
import type { LinksFunction, LoaderFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/node';
import {
  isRouteErrorResponse,
  Link,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useRouteError,
} from '@remix-run/react';
import { ArrowLeft as ArrowLeftIcon } from 'lucide-react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import NProgress from 'nprogress';
import { useEffect } from 'react';
import { getToast } from 'remix-toast';
import { useGlobalPendingState } from 'remix-utils/use-global-navigation-state';

import * as ShadcnButton from '~/components/ui/button';
import { AuthProvider } from '~/context/auth-context';
import { authenticator } from '~/services/auth.server';
import { useClientStyle } from '~/styles/client-style';
import { theme } from '~/styles/theme';


export { headers } from '~/services/defaults.server';

const Document = withEmotionCache(({ children, title }: DocumentProps, emotionCache) => {
  const clientStyle = useClientStyle();

  useEnhancedEffect(() => {
    emotionCache.sheet.container = document.head;
    const tags = emotionCache.sheet.tags;
    emotionCache.sheet.flush();
    for (const tag of tags) {
      // eslint-disable-next-line no-underscore-dangle
      (emotionCache.sheet as any)._insertTag(tag);
    }
    clientStyle.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <html lang="en">
      <head>
        <meta charSet="utf8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="theme-color" content={theme.palette.primary.main} />
        {title ? <title>{title}</title> : null}
        <Meta />
        <Links />
        <meta name="emotion-insertion-point" content="emotion-insertion-point" />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
});

export const links: LinksFunction = () => {
  return [
    {
      rel: 'icon',
      href: '/favicon.ico',
      type: 'image/x-icon',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await authenticator.isAuthenticated(request);
  const { toast, headers } = await getToast(request);

  return json(
    {
      ENV: {
      },
      toast,
      user,
    },
    {
      headers,
    },
  );
}

function useNProgressTransition() {
  const isIdle = useGlobalPendingState() === 'idle';

  useEffect(() => {
    if (isIdle) {
      NProgress.done();
    } else {
      NProgress.start();
    }
  }, [isIdle]);
}

function FlashMessage() {
  const { toast } = useLoaderData<typeof loader>();
  const { enqueueSnackbar } = useSnackbar();

  useEffect(() => {
    if (!toast) {
      return;
    }

    enqueueSnackbar(toast.message, {
      anchorOrigin: { horizontal: 'center', vertical: 'bottom' },
      SnackbarProps: {
        // @ts-expect-error
        'data-testid': 'flash-message',
      },
      variant: toast.type,
    });
  }, [enqueueSnackbar, toast]);

  return null;
}

function App() {
  const { ENV, user } = useLoaderData<typeof loader>();
  useNProgressTransition();

  return (
    <Document>
        <LocalizationProvider dateAdapter={DateAdapter} adapterLocale="en-US">
          <AuthProvider user={user}>
            <SnackbarProvider>
              <script
                dangerouslySetInnerHTML={{
                  __html: `window.ENV = ${JSON.stringify(ENV)};`,
                }}
              />
              <FlashMessage />
              <Outlet />
            </SnackbarProvider>
          </AuthProvider>
        </LocalizationProvider>
    </Document>
  );
}

// eslint-disable-next-line import/no-default-export
export default App;

function FourOhOne() {
  return (
    <main className="h-full w-full">
      <div className="container flex flex-col justify-center items-center min-h-screen px-6 py-12 mx-auto">
        <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">Unauthorized</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          {`Oops! Looks like you tried to visit a page that you do not have access to.`}
        </p>
        <div className="flex items-center mt-6 gap-x-3">
          <ShadcnButton.Button asChild>
            <Link to="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go home
            </Link>
          </ShadcnButton.Button>
        </div>
      </div>
    </main>
  );
}

function FourOhThree() {
  return (
    <main className="h-full w-full">
      <div className="container flex flex-col justify-center items-center min-h-screen px-6 py-12 mx-auto">
        <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">Forbidden</h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          Oops! Looks like you tried to visit a page that you do not have access to.
        </p>
        <div className="flex items-center mt-6 gap-x-3">
          <ShadcnButton.Button asChild>
            <Link to="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go home
            </Link>
          </ShadcnButton.Button>
        </div>
      </div>
    </main>
  );
}

function FourOhFour() {
  return (
    <main className="h-full w-full">
      <div className="container flex flex-col justify-center items-center min-h-screen px-6 py-12 mx-auto">
        <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
          The page you are looking for isn’t here
        </h1>
        <p className="mt-4 text-gray-500 dark:text-gray-400">
          The link you followed may be broken, or the page may have been removed.
        </p>
        <div className="flex items-center mt-6 gap-x-3">
          <ShadcnButton.Button asChild>
            <Link to="/">
              <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go home
            </Link>
          </ShadcnButton.Button>
        </div>
      </div>
    </main>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error) && [401, 403, 404].includes(error.status)) {
    let page: JSX.Element;
    let title: string;
    if (error.status === 401) {
      page = <FourOhOne />;
      title = 'Unauthorized';
    } else if (error.status === 403) {
      page = <FourOhThree />;
      title = 'Forbidden';
    } else {
      page = <FourOhFour />;
      title = 'Not Found';
    }

    return <Document title={`${title} · Company Platform`}>{page}</Document>;
  }

  return (
    <Document title="Error · Company Platform">
      <main className="h-full w-full">
        <div className="container flex flex-col justify-center items-center min-h-screen px-6 py-12 mx-auto">
          <h1 className="mt-3 text-2xl font-semibold text-gray-800 dark:text-white md:text-3xl">
            Oops, looks like an <span className="text-red-600">unexpected error</span> occurred
          </h1>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            If you continue to see this error, please contact us.
          </p>
          <div className="flex items-center mt-6 gap-x-3">
            <ShadcnButton.Button asChild>
              <Link to="/">
                <ArrowLeftIcon className="mr-2 h-4 w-4" /> Go home
              </Link>
            </ShadcnButton.Button>
          </div>
        </div>
      </main>
    </Document>
  );
}
