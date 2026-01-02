import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User } from '../types';
import { getUserByUsername } from '../database/database';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'auth_user';

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const user = await getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return { success: false, error: 'Invalid username or password' };
      }

      // Store user in secure storage
      await SecureStore.setItemAsync(AUTH_STORAGE_KEY, JSON.stringify(user));
      
      set({ user, isAuthenticated: true });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Login failed',
      };
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(AUTH_STORAGE_KEY);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  checkAuth: async () => {
    try {
      const storedUser = await SecureStore.getItemAsync(AUTH_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser);
        set({ user, isAuthenticated: true });
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      set({ isLoading: false });
    }
  },
}));

