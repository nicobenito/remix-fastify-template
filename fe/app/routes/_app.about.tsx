import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import * as React from 'react';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table';
import { requireUser } from '~/services/auth.server';
import { getServerTiming } from '~/services/timing.server';

import { version as platformFrontendVersion } from '../../package.json';

export { headers } from '~/services/defaults.server';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'About · Company Platform',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getServerTimingHeader, time } = getServerTiming();
  await time('getUser', async () => requireUser(request));
  const { version: platformBackendVersion } = await time('getPlatformBackendVersion', () => { return {version:  1.10}});

  return json(
    {
      services: [
        { name: 'Platform Backend', version: platformBackendVersion },
        { name: 'Platform Frontend', version: platformFrontendVersion },
      ],
    },
    {
      headers: getServerTimingHeader(),
    },
  );
}

export default function AboutPage() {
  const data = useLoaderData<typeof loader>();

  return (
    <main>
      <Card>
        <CardHeader>
          <CardTitle>Services</CardTitle>
        </CardHeader>
        <CardContent>
          <Table aria-label="services version table" data-testid="services-table">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Service</TableHead>
                <TableHead className="text-right">Version</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.services.map(({ name, version }) => (
                <TableRow key={name}>
                  <TableCell data-testid="service:name" className="font-medium">
                    {name}
                  </TableCell>
                  <TableCell data-testid="service:version" className="text-right">
                    {version}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
