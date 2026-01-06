import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'DEVELOPER' | 'DIRECTOR' | 'MANAGER' | 'GENERAL_SUPERVISOR' | 'SUPERVISOR' | 'OPERATOR' | 'SECRETARY' | 'ADMIN';
  phone?: string;
  profilePhoto?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  updateUser: (user: Partial<User>) => void;
  clearAuth: () => void;
  isAuthenticated: () => boolean;
  setLoading: (loading: boolean) => void;
  refreshUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isLoading: false,

      setAuth: (user, token, refreshToken) => {
        console.log('🔐 setAuth called with:', { user: user.email, role: user.role, hasToken: !!token });
        // Set token in localStorage immediately for API interceptor
        localStorage.setItem('token', token);
        // Update Zustand state (will also persist to localStorage via middleware)
        set({ user, token, refreshToken, isLoading: false });
        console.log('✅ Auth state updated');
      },

      updateUser: (userData) => {
        const currentUser = get().user;
        if (currentUser) {
          set({ user: { ...currentUser, ...userData } });
        }
      },

      clearAuth: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, refreshToken: null, isLoading: false });
      },

      isAuthenticated: () => {
        const state = get();
        const isAuth = !!(state.token && state.user);
        console.log('🔍 isAuthenticated check:', { hasToken: !!state.token, hasUser: !!state.user, result: isAuth });
        return isAuth;
      },

      setLoading: (loading) => set({ isLoading: loading }),

      refreshUserProfile: async () => {
        const state = get();
        if (!state.token) return;
        
        try {
          const response = await api.get('/users/profile');
          if (response.data.user) {
            set({ user: { ...state.user, ...response.data.user } });
          }
        } catch (error) {
          console.error('Failed to refresh user profile:', error);
        }
      },
    }),
    {
      name: 'jevelin-auth',
      onRehydrateStorage: () => (state) => {
        // Sync token to localStorage after rehydration
        if (state?.token) {
          localStorage.setItem('token', state.token);
          // Refresh user profile to get latest data (including profile photo)
          setTimeout(() => {
            state.refreshUserProfile?.();
          }, 100);
        }
      },
    }
  )
);
