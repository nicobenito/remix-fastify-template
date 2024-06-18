import { server } from '@mocks/server';
import { afterAll, afterEach, beforeAll } from 'vitest';

beforeAll(async () => {
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});
