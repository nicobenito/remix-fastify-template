import { Prisma, Product } from '@prisma/client';
import { z } from 'zod';
import { logger } from '~/logger';

import { prisma } from '~/services/prisma';

type UpsertProductInput = {
  id: number;
  name: string;
  price: number;
};

export function upsertProduct({
  id,
  name,
  price
}: UpsertProductInput) {
  return prisma.product.upsert({
    where: {
      id,
    },
    update: {
      name,
      price,
    },
    create: {
      name,
      price,
    },
  });
}

export function getAllProducts(): Promise<Product[]> {
  return prisma.product.findMany();
}

export async function removeProduct(id: number) {
  try {
    await prisma.product.delete({ where: { id } });
  } catch (error) {
    logger.warn({id}, 'Unable to delete product')
  }
}

export { type Product } from '@prisma/client';
