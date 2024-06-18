import { isProduction } from '~/env.server';

export function getDomainUrl(request: Request) {
  const host = request.headers.get('X-Forwarded-Host') ?? request.headers.get('host');
  if (!host) {
    throw new Error('Could not determine domain URL.');
  }

  const protocol = host.includes('localhost') ? 'http' : 'https';

  return `${protocol}://${host}`;
}

/**
 * Returns the URL for the given request with the protocol fixed to HTTPs if we are in production.
 */
export function getUrl(request: Request) {
  const url = new URL(request.url);
  url.protocol = isProduction ? 'https' : url.protocol;

  return url;
}
