/// <reference types="vite/client" />

declare module '@relax-state/react' {
  import { ReactNode } from 'react';

  // 状态描述符类型
  export interface StateDescriptor<T> {
    (initialValue: T, name: string): {
      get: () => T;
      name: string;
    };
    type: 'state';
  }

  // Store 类型
  export interface Store {
    get: <T>(stateDesc: ReturnType<StateDescriptor<T>>) => T;
    set: <T>(stateDesc: ReturnType<StateDescriptor<T>>, value: T) => void;
  }

  // 创建状态描述符
  export function state<T>(initialValue: T, name: string): {
    get: () => T;
    name: string;
  };

  // 创建 store 实例
  export function createStore(): Store;

  // Provider 组件
  export function RelaxProvider(props: { store: Store; children: ReactNode }): JSX.Element;

  // Hooks
  export function useRelaxValue<T>(stateDesc: { get: () => T }): T;
  export function useRelaxState<T>(stateDesc: { get: () => T }): [T, (value: T) => void];
}
