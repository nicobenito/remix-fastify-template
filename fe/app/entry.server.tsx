import { PassThrough } from 'node:stream';

import { CacheProvider } from '@emotion/react';
import { renderStylesToNodeStream } from '@emotion/server';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import type { ActionFunctionArgs, EntryContext, LoaderFunctionArgs } from '@remix-run/node';
import { createReadableStreamFromReadable } from '@remix-run/node';
import { isRouteErrorResponse, RemixServer } from '@remix-run/react';
import { isbot } from 'isbot';
import { renderToPipeableStream } from 'react-dom/server';
import { match, P } from 'ts-pattern';

import { logger } from '~/services/logger.server';
import { createEmotionCache } from '~/styles/create-emotion-cache';
import { theme } from '~/styles/theme';

export function handleError(
  error: unknown,
  { context, params, request }: LoaderFunctionArgs | ActionFunctionArgs,
): void {
  match({ error, request })
    .with({ error: P.intersection(P.when(isRouteErrorResponse), { status: 400 }) }, () => {
      logger.warn({ context, err: error, params, req: request }, 'Bad request.');
    })
    .with({ error: P.intersection(P.when(isRouteErrorResponse), { status: 404 }) }, () => {
      if (request.url.includes('/build')) {
        logger.debug({ context, err: error, params, req: request }, 'Asset not found.');
      } else {
        logger.warn({ context, err: error, params, req: request }, 'Page not found.');
      }
    })
    .with({ error: P.instanceOf(Error), request: { signal: { aborted: true } } }, () => {
      // ignore aborted requests
      logger.debug({ context, err: error, params, req: request }, 'Request aborted.');
    })
    .otherwise(() => {
      const unknownError = new Error('Unknown Server Error', { cause: error });
      logger.error(
        { context, err: unknownError, params, req: request },
        'An unexpected error occurred while handling the request.',
      );
    });
}

const abortDelay = 5000;
// eslint-disable-next-line import/no-default-export
export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) {
  const callbackName = isbot(request.headers.get('user-agent')) ? 'onAllReady' : 'onShellReady';

  // eslint-disable-next-line no-async-promise-executor
  return new Promise(async (resolve, reject) => {
    let didError = false;

    const cache = createEmotionCache();

    const MuiRemixServer = () => (
      <CacheProvider value={cache}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <RemixServer abortDelay={abortDelay} context={remixContext} url={request.url} />
        </ThemeProvider>
      </CacheProvider>
    );

    const { pipe, abort } = renderToPipeableStream(<MuiRemixServer />, {
      [callbackName]() {
        let body = new PassThrough();
        body.pipe(renderStylesToNodeStream());
        let stream = createReadableStreamFromReadable(body);

        responseHeaders.set('Content-Type', 'text/html');

        resolve(
          new Response(stream, {
            status: didError ? 500 : responseStatusCode,
            headers: responseHeaders,
          }),
        );
        pipe(body).pipe(renderStylesToNodeStream());
      },
      onShellError(err) {
        reject(err);
      },
      onError(error) {
        didError = true;

        logger.error(error);
      },
    });
    setTimeout(abort, abortDelay);
  });
}
