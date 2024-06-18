import { Card, CardContent, CardHeader, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import type { LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';
import { CardTitle } from '~/components/ui/card';
import { TableHeader } from '~/components/ui/table';

import { requireUser } from '~/services/auth.server';
import { logger } from '~/services/logger.server';
import { getAuthenticatedClient } from '~/services/platform-backend.server';
import { getServerTiming } from '~/services/timing.server';
import { Product } from '~/types';

export { headers } from '~/services/defaults.server';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Dashboard · Company Platform',
    },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const { getServerTimingHeader, time } = getServerTiming();
  const user = await time('getUser', async () => requireUser(request));
  const client = getAuthenticatedClient(user);

  let products: Product[];
  try {
    products = await time('getProducts', () =>
      client.getProducts(),
    );
  } catch {
    logger.warn('products data not found');
    products = [];
  }

  return json(
    {
      user,
      products,
    },
    {
      headers: getServerTimingHeader(),
    },
  );
}

export default function Dashboard() {
  const { products, user } = useLoaderData<typeof loader>();
  return (
    <Paper sx={{ p: 2, my: 1 }} className='border-double border-4 border-black'>
        <Typography variant="h4" sx={{ my: 1 }}>
          Welcome!
        </Typography>
        <CardContent className='grid grid-cols-2 gap-2 place-content-center'>
          <Card variant="outlined" className='hover:shadow-lg transition-shadow duration-300'>
            <CardContent>
              <Typography variant='h5' component='div' gutterBottom>
                Products data
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                Total products listed: {products.length}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                Last item added: {products.length ? products[products.length - 1].name : 'None'}
              </Typography>
            </CardContent>
          </Card>
          <Card variant="outlined" className='hover:shadow-lg transition-shadow duration-300'>
            <CardContent>
              <Typography variant='h5' component='div' gutterBottom>
                User
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                Email: {user.email}
              </Typography>
              <Typography sx={{ fontSize: 14 }} color="text.secondary">
                Current permissions: {user.permissions.join(', ')}
              </Typography>
            </CardContent>
          </Card>
        </CardContent>
    </Paper>
  );
}
