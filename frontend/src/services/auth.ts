import { apiClient } from './api';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: string;
  subscription: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface RegisterParams {
  email: string;
  password: string;
  name: string;
}

export const authService = {
  async login(params: LoginParams): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', params);
    
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    return response;
  },

  async register(params: RegisterParams): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', params);
    
    // Store tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    return response;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
    
    // Clear tokens
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    }
  },

  async getCurrentUser(): Promise<{ user: User }> {
    return apiClient.get('/auth/me');
  },

  async refreshToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    const response = await apiClient.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    });
    
    // Store new tokens
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', response.accessToken);
      localStorage.setItem('refreshToken', response.refreshToken);
    }
    
    return response;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};

export default authService;
