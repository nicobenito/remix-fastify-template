import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createSigner } from 'fast-jwt';

/*
How to regenerate the keys for RS256:

```terminal
ssh-keygen -t rsa -b 4096 -m PEM -f private.key
openssl req -x509 -new -key private.key -out public.key -subj "/CN=unused"
```
*/

export function generateJwt(authZeroId: string, permissions: string[]) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT generation is not allowed in production. Use Auth0 JWT token instead.');
  }

  const signSync = createSigner({
    // eslint-disable-next-line unicorn/prefer-module
    key: readFileSync(`${path.join(__dirname, '..', '..', 'etc', 'ssl')}/private.key`, 'utf8'),
    noTimestamp: true,
    kid: 'KEY',
  });

  return signSync({
    sub: authZeroId,
    permissions,
  });
}
