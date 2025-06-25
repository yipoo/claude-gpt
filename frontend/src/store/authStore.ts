import { create } from 'zustand';
import { apiClient, User, AuthResponse } from '../api/client';
import { UserStorageService } from '../utils/storage';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  initializeAuth: () => Promise<void>;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  updateUserProfile: (profileData: { displayName?: string; bio?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const authResponse: AuthResponse = await apiClient.login(email, password);
      
      set({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      console.log('Login successful:', authResponse.user.email);
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '登录失败';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  register: async (email: string, password: string, fullName: string) => {
    try {
      set({ isLoading: true, error: null });
      
      const authResponse: AuthResponse = await apiClient.register(email, password, fullName);
      
      set({
        user: authResponse.user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      console.log('Registration successful:', authResponse.user.email);
    } catch (error: any) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '注册失败';
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
        user: null,
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      set({ isLoading: true });
      
      await apiClient.logout();
      
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
      
      console.log('Logout successful');
    } catch (error: any) {
      console.error('Logout error:', error);
      // 即使登出请求失败，也要清除本地状态
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  refreshUser: async () => {
    try {
      if (!apiClient.isAuthenticated()) {
        set({
          user: null,
          isAuthenticated: false,
          error: null,
        });
        return;
      }

      set({ isLoading: true });
      
      const user = await apiClient.getCurrentUser();
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      
      console.log('Refresh user successful:', user.email);
    } catch (error: any) {
      console.error('Refresh user error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    }
  },

  initializeAuth: async () => {
    try {
      set({ isLoading: true });
      
      // 检查本地是否有存储的用户信息和token
      const storedUser = UserStorageService.getUserInfo();
      const hasToken = apiClient.isAuthenticated();
      
      if (storedUser && hasToken) {
        // 设置本地用户信息
        set({
          user: storedUser,
          isAuthenticated: true,
          isLoading: false,
        });
        
        // 尝试获取最新的用户信息来验证token
        try {
          await get().refreshUser();
        } catch (error) {
          console.warn('Token validation failed during initialization:', error);
          await get().logout();
        }
      } else {
        // 没有有效的认证信息
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setLoading: (loading: boolean) => {
    set({ isLoading: loading });
  },

  updateUserProfile: async (profileData: { displayName?: string; bio?: string }) => {
    try {
      set({ isLoading: true, error: null });
      
      const currentUser = get().user;
      if (!currentUser) {
        throw new Error('No user logged in');
      }

      // 模拟API调用 - 实际项目中应该调用真实的API
      // const updatedUser = await apiClient.updateUserProfile(profileData);
      
      // 临时模拟更新
      const updatedUser: User = {
        ...currentUser,
        displayName: profileData.displayName || currentUser.displayName,
        bio: profileData.bio || currentUser.bio,
      };
      
      set({
        user: updatedUser,
        isLoading: false,
        error: null,
      });
      
      console.log('Profile updated successfully:', updatedUser);
    } catch (error: any) {
      console.error('Update profile error:', error);
      const errorMessage = error.response?.data?.error?.message || error.message || '更新失败';
      set({
        error: errorMessage,
        isLoading: false,
      });
      throw error;
    }
  },
}));