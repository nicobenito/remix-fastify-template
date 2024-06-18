import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

export type User = {
  readonly accessToken: string;
  readonly email: string;
  readonly id: string;
  readonly permissions: string[];
  readonly roles: { description: string; id: string; name: string }[];
};

export const unauthorizedSchema = z.object({
  statusCode: z.literal(StatusCodes.UNAUTHORIZED),
  error: z.literal('Unauthorized'),
  message: z.string(),
});

export const forbiddenSchema = z.object({
  statusCode: z.literal(StatusCodes.FORBIDDEN),
  error: z.literal('Forbidden'),
  message: z.string(),
});
