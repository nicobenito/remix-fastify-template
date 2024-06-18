import { Ability, AbilityBuilder } from '@casl/ability';
import { createContextualCan } from '@casl/react';
import type { ReactNode } from 'react';
import { createContext, useContext, useMemo } from 'react';

import type { User } from '~/types';

export const AbilityContext = createContext(new Ability());

type AuthProviderProps = {
  children?: ReactNode | undefined;
  user: User | null;
};

export function AuthProvider({ children, user = null }: AuthProviderProps) {
  const value = useMemo(() => {
    const { can, rules } = new AbilityBuilder(Ability);

    if (user) {
      for (const permission of user.permissions) {
        const [subject, action] = permission.split(':');

        can(action, subject);
      }
    }

    return new Ability(rules);
  }, [user]);

  return <AbilityContext.Provider value={value}>{children}</AbilityContext.Provider>;
}

export const Can = createContextualCan(AbilityContext.Consumer);

export function useUserAbilities() {
  return useContext(AbilityContext);
}
