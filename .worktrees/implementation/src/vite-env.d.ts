/// <reference types="vite/client" />

declare module '@relax-state/react' {
  import { ComponentType, ReactNode } from 'react';

  export interface Store<T> {
    getState(): T;
    setState(partial: Partial<T> | ((state: T) => Partial<T>)): void;
    useState(): T;
  }

  export function createStore<T>(name: string, initialState: T): Store<T>;

  export interface RelaxProviderProps {
    children: ReactNode;
  }

  export const RelaxProvider: ComponentType<RelaxProviderProps>;

  export function useRelaxState<T>(store: Store<T>): T;
  export function useRelaxValue<T>(store: Store<T>): T;
}
