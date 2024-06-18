import fastify from 'fastify';
import { expect, test } from 'vitest';

import { fastifyResponseTime } from '~/services/fastify/fastify-response-time';

test('reply.send automatically add x-response-time header', async () => {
  const app = fastify();
  app.register(fastifyResponseTime);
  app.get('/hello', (request, reply) => {
    reply.send({ message: 'Hello World!' });
  });
  const response = await app.inject({
    method: 'GET',
    url: '/hello',
  });

  expect(response.headers['x-response-time']).toBeDefined();
  expect(Number.isNaN(Number.parseFloat(response.headers['x-response-time'] as string))).toBeFalsy();
});

test('reply.send add x-response-time header representing duration', async () => {
  const app = fastify();
  app.register(fastifyResponseTime);
  app.get('/hello', (request, reply) => {
    setTimeout(() => {
      reply.send({ message: 'Hello World!' });
    }, 1100);
  });
  const response = await app.inject({
    method: 'GET',
    url: '/hello',
  });

  expect(Number.parseFloat(response.headers['x-response-time'] as string)).toBeGreaterThanOrEqual(1000);
});

test('the digit and header option is correctly used', async () => {
  const headerName = 'X-My-Timer';
  const digits = 0;
  const app = fastify();
  app.register(fastifyResponseTime, {
    digits,
    header: headerName,
  });
  app.get('/hello', (request, reply) => {
    reply.send({ message: 'Hello World!' });
  });
  const response = await app.inject({
    method: 'GET',
    url: '/hello',
  });
  const duration = response.headers[headerName.toLowerCase()] as string;

  expect(Number.parseFloat(duration).toFixed(digits)).toBe(duration);
});

test('check the Server-Timing header', async () => {
  const app = fastify();
  app.register(fastifyResponseTime);
  app.get('/hello', (request, reply) => {
    expect(reply.setServerTiming).toBeDefined();

    reply.send({ message: 'Hello World!' });
  });
  app.get('/timing', (request, reply) => {
    expect(reply.setServerTiming('miss')).toBeTruthy();
    expect(reply.setServerTiming('db', 53)).toBeTruthy();
    expect(reply.setServerTiming('app', 47.2)).toBeTruthy();
    expect(reply.setServerTiming('dc', null, 'atl')).toBeTruthy();
    expect(reply.setServerTiming('cache', 23.2, 'Cache Read')).toBeTruthy();
    expect(reply.setServerTiming('db', 150)).toBeFalsy();

    reply.send({ message: 'Timing!' });
  });
  const response = await app.inject({
    method: 'GET',
    url: '/timing',
  });

  expect(response.headers['server-timing']).toBe(
    'miss,db;dur=53,app;dur=47.2,dc;desc=atl,cache;dur=23.2;desc="Cache Read"',
  );
});
