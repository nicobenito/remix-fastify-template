import { z } from 'zod';

import { prisma } from '~/services/prisma';

export function findOneUserByAuthZeroId(authZeroId: string) {
  return prisma.user.findFirst({
    where: {
      authZeroId,
    },
  });
}

const userUpsertInput = z.object({
  authZeroId: z.string().nonempty('authZeroId is required.'),
  email: z.string().nonempty('email is required.'),
});

type UserUpdateInput = z.infer<typeof userUpsertInput>;

export async function upsertUser({ authZeroId, email }: UserUpdateInput) {
  return prisma.user.upsert({
    where: {
      authZeroId_email: {
        authZeroId,
        email,
      },
    },
    create: {
      authZeroId,
      email,
    },
    update: {},
  });
}
