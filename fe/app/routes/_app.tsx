import { Outlet, useRouteLoaderData } from '@remix-run/react';

import { useSessionTimeout } from '~/hooks/use-session-timeout';
import { WithTopBarAndSidebarLayout } from '~/layouts/with-top-bar-and-sidebar-layout';
import type { loader } from '~/root';

function useRootLoaderData() {
  const data = useRouteLoaderData<typeof loader>('root');
  if (!data) {
    throw new Error('Missing root loader data.');
  }

  return data;
}

export default function AppLayout() {
  const { ENV } = useRootLoaderData();
  useSessionTimeout(ENV.SESSION_INACTIVITY_TIMEOUT!);

  return (
    <WithTopBarAndSidebarLayout>
      <Outlet />
    </WithTopBarAndSidebarLayout>
  );
}
