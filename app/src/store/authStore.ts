import type { User, CurrentUser } from "../types/user";
import { state, createStore, action, type Store } from "@relax-state/react";

// 从 localStorage 加载数据
const loadFromStorage = () => {
  try {
    const users = JSON.parse(localStorage.getItem("users") || "[]");
    const currentUser = JSON.parse(
      localStorage.getItem("currentUser") || "null",
    );
    return { users, currentUser };
  } catch {
    return { users: [], currentUser: null };
  }
};

const initialData = loadFromStorage();

// 创建状态描述符
const usersState = state<User[]>(initialData.users, "users");
const currentUserState = state<CurrentUser | null>(
  initialData.currentUser,
  "currentUser",
);
const isAuthenticatedState = state<boolean>(
  !!initialData.currentUser,
  "isAuthenticated",
);

// 创建 store 实例
const store = createStore();

// 导出 store 供外部使用
export { store };

// 导出状态描述符供 store 操作使用
export { usersState, currentUserState, isAuthenticatedState };

// ==================== Action API ====================

const registerAction = action<User, void>(
  (s: Store, user: User) => {
    const currentUsers = s.get(usersState);
    const newState = [...currentUsers, user];
    s.set(usersState, newState);
    localStorage.setItem("users", JSON.stringify(newState));
  },
  { name: "register" },
);

const loginAction = action<CurrentUser, void>(
  (s: Store, user: CurrentUser) => {
    s.set(currentUserState, user);
    s.set(isAuthenticatedState, true);
    localStorage.setItem("currentUser", JSON.stringify(user));
  },
  { name: "login" },
);

const logoutAction = action<void, void>(
  (s: Store) => {
    s.set(currentUserState, null);
    s.set(isAuthenticatedState, false);
    localStorage.removeItem("currentUser");
  },
  { name: "logout" },
);

// 导出 actions
export const authActions = {
  register: (user: User) => registerAction(store, user),
  login: (user: CurrentUser) => loginAction(store, user),
  logout: () => logoutAction(store),
  isUsernameTaken: (username: string): boolean => {
    // 同步执行
    const users = store.get(usersState);
    return users.some((u) => u.username === username);
  },
  verifyUser: (username: string, passwordHash: string): User | null => {
    // 同步执行
    const users = store.get(usersState);
    return (
      users.find(
        (u) => u.username === username && u.passwordHash === passwordHash,
      ) || null
    );
  },
};
