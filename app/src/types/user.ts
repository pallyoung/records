export interface User {
  userId: string;
  username: string;
  passwordHash: string;
  createdAt: string;
}

export interface CurrentUser {
  userId: string;
  username: string;
}
