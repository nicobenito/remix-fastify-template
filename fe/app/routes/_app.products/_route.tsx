import CheckIcon from '@mui/icons-material/Check';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CardActions from '@mui/material/CardActions';
import FormControl from '@mui/material/FormControl';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { json } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { isErrorFromAlias } from '@zodios/core';
import { match } from 'ts-pattern';
import { z } from 'znv';

import { requireUser } from '~/services/auth.server';
import { getAuthenticatedClient } from '~/services/platform-backend.server';
import { logger } from '~/services/logger.server';
import { getServerTiming } from '~/services/timing.server';
import type { Product } from '~/types';
import { Card, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { formDataToObject } from '~/utils/formParser';
import { useState } from 'react';
import React from 'react';

export { headers } from '~/services/defaults.server';

export const meta: MetaFunction = () => {
  return [
    {
      title: 'Products · Platform',
    },
  ];
};

const formSchema = z.object({
  intent: z.enum(['confirm', 'delete', 'update']),
  productName: z.string().optional(),
  productPrice: z.string().optional(),
  productId: z.string().optional(),
});

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
      products,
      user,
    },
    {
      headers: getServerTimingHeader(),
    },
  );
}

export type ActionProductData = {
  intent: string;
  error: {
    type: string;
    message: string;
    validations: Record<string, any>;
  };
  status: 'idle' | 'error';
  submission: any;
  data?: any;
};

export async function action({ request }: ActionFunctionArgs) {
  const { time } = getServerTiming();
  const [user, formData] = await Promise.all([
    time('getUser', async () => requireUser(request)),
    time('readFormData', async () => await request.formData()),
  ]);

  const submission = await time('parseFormData', () => formSchema.safeParseAsync(formDataToObject(formData)));
  let error = {
    type: 'none',
    message: '',
    validations: {},
  };

  if (!submission.success) {
    return json({
      error,
      intent: 'unknown',
      isValid: false,
      status: 'idle',
      submission: submission.error.format(),
    } as ActionProductData);
  }

  const { intent, productName, productPrice, productId } = submission.data;
  const client = getAuthenticatedClient(user);
  let response = {};
  try {
    await match(intent)
      .with('confirm', async () => {
        if (!productName || !productPrice) {
          throw new Error('Product name and price are required for confirmation.');
        }
        response = await client.upsertProduct({ name: productName, price: parseFloat(productPrice) });
      })
      .with('delete', async () => {
        if (!productId) {
          throw new Error('Product ID is required for deletion.');
        }
        await client.deleteProduct({ id: parseInt(productId) });
      })
      .with('update', async () => {
        if (!productId || !productPrice || !productName) {
          throw new Error('Product data is required for update.');
        }
        await client.upsertProduct({ id: parseInt(productId), name: productName, price: parseFloat(productPrice) });
      })
      .otherwise(() => null);
  } catch (error_) {
    if (error_ instanceof Response) {
      throw error_;
    }

    if (
      intent === 'confirm' &&
      isErrorFromAlias(client.api, 'upsertProduct', error_) &&
      error_.response.status === 403
    ) {
      error.validations = error_.response.data;
    } else {
      error.type = 'unknown';
      error.message = error_ instanceof Error ? error_.message : 'Unknown error.';
    }
  }

  return json({
    intent,
    error,
    status: error.message !== '' || Object.keys(error.validations).length ? 'error' : 'idle',
    submission: submission.data,
    data: response,
  } as ActionProductData);
}

export default function Products() {
  const createFetcher = useFetcher<typeof action>();
  const deleteFetcher = useFetcher<typeof action>();
  const updateFetcher = useFetcher<typeof action>();
  const isDone = createFetcher.state === 'idle' && createFetcher.data != null;
  const { products } = useLoaderData<typeof loader>();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<any>(null);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleEditClick = (product: any) => {
    setCurrentProduct(product);
    setIsModalOpen(true);
  };

  const handleRemove = (product: Product) => {
    deleteFetcher.submit(
      {
        intent: 'delete',
        productId: product.id,
      },
      { method: 'post' }
    );
  }

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentProduct(null);
  };

  const handleSave = () => {
    updateFetcher.submit(
      {
        intent: 'update',
        productId: currentProduct.id,
        productName: currentProduct.name,
        productPrice: currentProduct.price.toString(),
      },
      { method: 'post' }
    );
    setIsModalOpen(false);
  };

  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Paper sx={{ p: 2, my: 1 }} className='border-double border-4 border-black'>
        <Typography variant="h4" sx={{ my: 1 }}>
          Add new product
        </Typography>
        <Box sx={{ my: 1 }}>
          <createFetcher.Form method="post">
            <CardContent>
              <Grid container spacing={2}>
                <Grid item lg={6} md={12} xs={12}>
                  <FormControl fullWidth size="small">
                    <TextField
                      name="productName"
                      key="productName"
                      fullWidth
                      label="Name"
                      margin="normal"
                      variant="outlined"
                      type="text"
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      defaultValue={''}
                      inputProps={{ step: 'any' }}
                    />
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <TextField
                      name="productPrice"
                      key="productPrice"
                      fullWidth
                      label="Price"
                      margin="normal"
                      variant="outlined"
                      type="text"
                      size="small"
                      InputLabelProps={{
                        shrink: true,
                      }}
                      defaultValue={''}
                    />
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
            <CardActions sx={{ justifyContent: 'flex-end' }}>
              <Button
                color="success"
                name="intent"
                size="small"
                startIcon={<CheckIcon />}
                type="submit"
                value="confirm"
                variant="contained">
                Confirm
              </Button>
            </CardActions>
          </createFetcher.Form>
          {match({ intent: createFetcher.data?.intent, isDone })
            .with({ intent: 'confirm', isDone: true }, () => (
              <Box sx={{ my: 2 }}>
                <Typography variant="h4" sx={{ my: 1 }}>
                  Error when creating
                </Typography>
              </Box>
            ))
            .otherwise(() => null)}
        </Box>
      </Paper>
      <Paper sx={{ p: 2, my: 1 }} className='border-double border-4 border-black'>
        <Typography variant="h4" sx={{ my: 1 }}>
          Current Products
        </Typography>
        <TextField
          label="Search Products"
          variant="outlined"
          fullWidth
          value={searchTerm}
          onChange={handleSearchChange}
          margin="normal"
        />
        <div className='grid grid-cols-5 gap-2 place-content-evenly'>
          {filteredProducts.length && filteredProducts.map((p) => {
            return (
              <Card variant="outlined" key={p.id} className='hover:shadow-lg transition-shadow duration-300'>
                <CardContent>
                  <Typography sx={{ fontSize: 14 }} color="text.secondary" gutterBottom>
                    In Stock
                  </Typography>
                  <Typography variant="h5" component="div">
                    {p.name}
                  </Typography>
                  <Typography sx={{ mb: 1.5 }} color="text.secondary">
                    ${p.price}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => handleEditClick(p)}>Edit</Button>
                  <Button size="small"onClick={() => handleRemove(p)}>Remove</Button>
                </CardActions>
              </Card>
            )
          })
          }
        </div>
        <Dialog open={isModalOpen} onClose={handleCloseModal}>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogContent>
            <TextField
              margin="dense"
              label="Product Name"
              type="text"
              fullWidth
              value={currentProduct?.name || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, name: e.target.value })}
            />
            <TextField
              margin="dense"
              label="Product Price"
              type="number"
              fullWidth
              value={currentProduct?.price || ''}
              onChange={(e) => setCurrentProduct({ ...currentProduct, price: parseFloat(e.target.value) })}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal} color="primary">
              Cancel
            </Button>
            <Button onClick={handleSave} color="primary">
              Save
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </>
  );
}
