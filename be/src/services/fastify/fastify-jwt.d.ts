import '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { sub: string; permissions: string[] };
    user: { sub: string; permissions: string[] };
  }
}
