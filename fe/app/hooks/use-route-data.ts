import { useMatches } from '@remix-run/react';

export function useRouteData<T>(routeId: string): T | undefined {
  const matches = useMatches();
  const data = matches.find((match) => match.id === routeId)?.data;

  if (data !== undefined) {
    return data as T;
  }
}
