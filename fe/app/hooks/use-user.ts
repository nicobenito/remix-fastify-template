import { useRouteData } from '~/hooks/use-route-data';
import type { User } from '~/types';

export function useUser() {
  const data = useRouteData<{ user: User }>('root');
  if (!data?.user) {
    throw new Error('User not found.');
  }

  return data?.user;
}
