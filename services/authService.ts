
import { User } from '../types';

const STORAGE_USER_KEY = 'meti_user_session';
const STORAGE_TOKEN_KEY = 'meti_jwt_token';

export const getApiUrl = () => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    // @ts-ignore
    return import.meta.env.VITE_API_URL;
  }
  return '';
};

export const authService = {
  login: async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${getApiUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Login failed');
    }

    const data = await response.json();
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    if (data.token) {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    }
    return data.user;
  },

  register: async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${getApiUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error || 'Registration failed');
    }

    const data = await response.json();
    localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(data.user));
    if (data.token) {
        localStorage.setItem(STORAGE_TOKEN_KEY, data.token);
    }
    return data.user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_USER_KEY);
    localStorage.removeItem(STORAGE_TOKEN_KEY);
    window.location.reload();
  },

  getCurrentUser: (): User | null => {
    try {
      const data = localStorage.getItem(STORAGE_USER_KEY);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  getToken: (): string | null => {
    return localStorage.getItem(STORAGE_TOKEN_KEY);
  },

  getAuthHeader: (): Record<string, string> => {
    const token = localStorage.getItem(STORAGE_TOKEN_KEY);
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  updateSubscription: (tier: 'hobby' | 'pro' | 'agency'): User | null => {
    const user = authService.getCurrentUser();
    if (user) {
      const updated = { ...user, subscription: tier };
      localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
      return updated;
    }
    return null;
  },
  
  refreshSession: () => authService.getCurrentUser(),
  updateProfile: async (userId: string, data: any) => {
      // In production, this must call an API endpoint
      // Temporary client-side update for session consistency until full backend profile route exists
      const current = authService.getCurrentUser();
      if (current && current.id === userId) {
          const updated = { ...current, ...data };
          localStorage.setItem(STORAGE_USER_KEY, JSON.stringify(updated));
          return updated;
      }
      return current as User;
  }
};
