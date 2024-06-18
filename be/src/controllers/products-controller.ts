import type { FastifyInstance } from 'fastify';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { Product, getAllProducts, removeProduct, upsertProduct } from '~/services/products'

const createProductRequestSchema = z.object({
  id: z.number().optional(),
  name: z.string({ required_error: 'name is required.' }),
  price: z.number({ required_error: 'price is required.' }),
});
const deleteProductRequestSchema = z.object({
  id: z.number({ required_error: 'id is required.' }),
});

type CreateProductRequest = z.infer<typeof createProductRequestSchema>;
type DeleteProductRequest = z.infer<typeof deleteProductRequestSchema>;

export async function productsController(fastify: FastifyInstance) {
  fastify.post<{ Body: CreateProductRequest; Reply: any }>(
    '/products',
    {
      schema: {
        body: createProductRequestSchema,
        response: {
          [StatusCodes.OK]: z.any(),
        },
      },
    },
    async function (request, reply) {
      await upsertProduct({ ...request.body, id: request.body.id ?? 0 });

      reply.status(StatusCodes.OK);
    },
  );
  fastify.get<{ Reply: Product[] }>(
    '/products',
    {
      // preValidation: fastify.auth([fastify.checkScopes([AuthorizationScopes.Scope])]),
      schema: {
        response: {
          [StatusCodes.OK]: z.any(),
        },
      },
    },
    async function (request, reply) {
      const products = await getAllProducts();
      reply.send(products);
      reply.status(StatusCodes.OK);
    },
  );
  fastify.delete<{ Body: DeleteProductRequest; Reply: any }>(
    '/products',
    {
      schema: {
        body: deleteProductRequestSchema,
        response: {
          [StatusCodes.OK]: z.void(),
        },
      },
    },
    async function (request, reply) {
      await removeProduct(request.body.id);

      reply.status(StatusCodes.OK);
    },
  );
}
