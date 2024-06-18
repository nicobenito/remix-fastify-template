import type { DateTime } from 'luxon';

export type User = {
  readonly accessToken: string;
  readonly email: string;
  readonly id: string;
  readonly permissions: string[];
};

export type Product = {
  id: number;
  name: string;
  price: number;
};

