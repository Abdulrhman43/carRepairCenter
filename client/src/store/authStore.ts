import { create } from 'zustand';
import api from '../services/api';
import type { AuthResponse } from '../types';

interface AuthState {
  token: string | null;
  user: { email: string; fullName: string; role: string } | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  isAdmin: false,

  login: async (email: string, password: string) => {
    const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify({ email: data.email, fullName: data.fullName, role: data.role }));
    set({
      token: data.token,
      user: { email: data.email, fullName: data.fullName, role: data.role },
      isAuthenticated: true,
      isAdmin: data.role === 'Admin',
    });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false, isAdmin: false });
  },

  hydrate: () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      const user = JSON.parse(userStr);
      set({ token, user, isAuthenticated: true, isAdmin: user.role === 'Admin' });
    }
  },
}));
