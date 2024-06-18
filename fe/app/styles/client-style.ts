import { createContext, useContext } from 'react';

export type ClientStyleContextData = {
  reset: () => void;
};

export const ClientStyleContext = createContext<ClientStyleContextData>({
  reset: () => {},
});

export const ClientStyleProvider = ClientStyleContext.Provider;

export function useClientStyle() {
  return useContext(ClientStyleContext);
}
