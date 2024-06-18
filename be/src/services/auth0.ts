import { AuthApiError, AuthenticationClient, ManagementClient, UserInfoClient } from 'auth0';
import { createDecoder } from 'fast-jwt';
import { Forbidden } from 'http-errors';
import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';

import { env } from '~/env';
import { logger } from '~/logger';
import { upsertUser } from '~/services/users';
import { User } from '~/types';

const authZeroErrorSchema = z.instanceof(AuthApiError).pipe(
  z.object({
    body: z.string().transform((value) => JSON.parse(value)),
    message: z.string(),
    statusCode: z.number(),
  }),
);

const jwtDecoder = createDecoder();

type JwtPayload = {
  permissions: User['permissions'];
  sub: User['id'];
};

function decodeJwt(token: string): JwtPayload {
  const jwt = jwtDecoder(token);

  return {
    permissions: jwt?.permissions || [],
    sub: jwt.sub,
  };
}

function createAuthenticationClient() {
  return new AuthenticationClient({
    clientId: env.AUTH0_CLIENT_ID,
    clientSecret: env.AUTH0_CLIENT_SECRET,
    domain: env.AUTH0_DOMAIN,
  });
}

function createUserInfoClient() {
  return new UserInfoClient({
    domain: env.AUTH0_DOMAIN,
  });
}

const loginRequest = z.object({
  email: z.string().email(),
  password: z.string({ required_error: 'password is required.' }),
});

type LoginRequest = z.infer<typeof loginRequest>;

const authZeroProfileSchema = z.object({
  email: z.string().email(),
  sub: z.string(),
});

export async function loginWithEmailAndPassword({ email, password }: LoginRequest): Promise<User> {
  const authenticationClient = createAuthenticationClient();
  const userInfoClient = createUserInfoClient();
  let accessToken: string;
  try {
    const signInToken = await authenticationClient.oauth?.passwordGrant({
      username: email,
      password,
      audience: env.AUTH0_AUDIENCE,
      scope: 'openid email',
    });
    accessToken = signInToken.data.access_token;
  } catch (error) {
    const authZeroError = authZeroErrorSchema.safeParse(error);
    if (authZeroError.success && authZeroError.data.statusCode === StatusCodes.FORBIDDEN) {
      throw new Forbidden('Invalid credentials.');
    }

    logger.error({ email, err: error }, 'Unexpected Auth0 error while logging in.');

    throw error;
  }

  const userInfo = await userInfoClient.getUserInfo(accessToken);
  const profile = authZeroProfileSchema.parse(userInfo.data);

  const user = {
    accessToken,
    id: profile.sub,
    email: profile.email,
    permissions: decodeJwt(accessToken).permissions,
    roles: [],
  };

  await upsertUser({
    authZeroId: user.id,
    email: user.email,
  });

  return user;
}
