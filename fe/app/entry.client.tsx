import { datadogRum } from '@datadog/browser-rum';
import { CacheProvider } from '@emotion/react';
import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { RemixBrowser } from '@remix-run/react';
import type { ReactNode } from 'react';
import { startTransition, StrictMode, useState } from 'react';
import { hydrateRoot } from 'react-dom/client';

import { ClientStyleProvider } from '~/styles/client-style';
import { createEmotionCache } from '~/styles/create-emotion-cache';
import { theme } from '~/styles/theme';

type RequestIdleCallbackDeadline = {
  readonly didTimeout: boolean;
  timeRemaining: () => number;
};

const requestIdleCallback =
  (typeof self !== 'undefined' && self.requestIdleCallback && self.requestIdleCallback.bind(window)) ||
  function (cb: (deadline: RequestIdleCallbackDeadline) => void): NodeJS.Timeout {
    let start = Date.now();

    return setTimeout(function () {
      cb({
        didTimeout: false,
        timeRemaining: function () {
          return Math.max(0, 50 - (Date.now() - start));
        },
      });
    }, 1);
  };

type ClientCacheProviderProps = {
  children: ReactNode;
};
function ClientCacheProvider({ children }: ClientCacheProviderProps) {
  const [cache, setCache] = useState(createEmotionCache());

  function reset() {
    setCache(createEmotionCache());
  }

  return (
    <ClientStyleProvider value={{ reset }}>
      <CacheProvider value={cache}>{children}</CacheProvider>
    </ClientStyleProvider>
  );
}

declare global {
  interface Window {
    ENV: {
      DD_RUM: {
        applicationId: string;
        clientToken: string;
        env: string;
        site: string;
        service: string;
        sessionReplaySampleRate: number;
        sessionSampleRate: number;
        traceSampleRate: number;
        trackUserInteractions: boolean;
        version: string;
      };
    };
  }
}

function maybeInitializeDatadogRum() {
  if (!window?.ENV?.DD_RUM) {
    return;
  }

  const {
    applicationId,
    clientToken,
    env,
    service,
    sessionReplaySampleRate,
    sessionSampleRate,
    site,
    traceSampleRate,
    trackUserInteractions,
    version,
  } = window.ENV.DD_RUM;
  if (applicationId && clientToken) {
    datadogRum.init({
      allowedTracingUrls: [
        (url) => {
          return new URL(url).hostname.includes('company.com');
        },
      ],
      applicationId,
      clientToken,
      defaultPrivacyLevel: 'mask-user-input',
      enableExperimentalFeatures: ['feature_flags'],
      env,
      sessionReplaySampleRate,
      sessionSampleRate,
      service,
      site,
      traceSampleRate,
      trackUserInteractions,
      version,
    });
    datadogRum.startSessionReplayRecording();
  }
}

maybeInitializeDatadogRum();

requestIdleCallback(() => {
  startTransition(() => {
    hydrateRoot(
      document,
      <StrictMode>
        <ClientCacheProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <RemixBrowser />
          </ThemeProvider>
        </ClientCacheProvider>
      </StrictMode>,
    );
  });
});
