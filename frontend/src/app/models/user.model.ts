export interface User {
  id: number;
  username: string;
  email?: string;
  online: boolean;
  lastActiveAt?: string;
}

export interface AuthResponse {
  token: string;
  id: number;
  username: string;
  email?: string;
  online: boolean;
  message?: string;
}
