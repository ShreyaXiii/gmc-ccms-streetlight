export type UserRole = 'administrator' | 'operator';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  organization: string; // e.g., 'Gandhidham Municipal Corporation'
  avatarUrl?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface StoredUserAccount {
  id: string;
  email: string;
  fullName: string;
  passwordHash: string;
  salt: string;
  role: UserRole;
  organization: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isDemoMode: boolean;
}


