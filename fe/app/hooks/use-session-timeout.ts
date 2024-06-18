import { useLocation, useSubmit } from '@remix-run/react';
import { useIdleTimer } from 'react-idle-timer';


export function useSessionTimeout(timeout: number) {
  const submit = useSubmit();
  const location = useLocation();

  function onIdle() {
    submit(
      {
        returnTo: encodeURIComponent(`${location.pathname}${location.search}`),
      },
      {
        method: 'post',
        action: `/logout`,
      },
    );
  }

  useIdleTimer({
    crossTab: true,
    leaderElection: true,
    onIdle,
    syncTimers: 200,
    timeout,
  });

  return null;
}
