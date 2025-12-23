import { apiClient } from './api';

// Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
  subscription: string;
  createdAt: string;
}

export interface UpdateProfileParams {
  name?: string;
  email?: string;
  avatar?: string;
}

export interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  key: string;
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
}

export interface CreateApiKeyParams {
  name: string;
  expiresIn?: number; // days
}

export interface NotificationPreferences {
  email: {
    securityAlerts: boolean;
    productUpdates: boolean;
    deploymentStatus: boolean;
    weeklyDigest: boolean;
  };
  push: {
    securityAlerts: boolean;
    deploymentStatus: boolean;
    mentions: boolean;
  };
  inApp: {
    securityAlerts: boolean;
    deploymentStatus: boolean;
    mentions: boolean;
    projectInvites: boolean;
  };
}

export interface ThemeSettings {
  theme: 'light' | 'dark' | 'system';
  colorScheme: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
  compactMode: boolean;
  animations: boolean;
}

// Settings service
export const settingsService = {
  // Profile
  async getProfile(): Promise<{ user: UserProfile }> {
    return apiClient.get('/users/profile');
  },

  async updateProfile(params: UpdateProfileParams): Promise<{ user: UserProfile }> {
    return apiClient.patch('/users/profile', params);
  },

  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/users/avatar', formData);
  },

  // API Keys
  async getApiKeys(): Promise<{ keys: ApiKey[] }> {
    return apiClient.get('/users/api-keys');
  },

  async createApiKey(params: CreateApiKeyParams): Promise<{ key: ApiKey; rawKey: string }> {
    return apiClient.post('/users/api-keys', params);
  },

  async deleteApiKey(keyId: string): Promise<void> {
    return apiClient.delete(`/users/api-keys/${keyId}`);
  },

  async revokeApiKey(keyId: string): Promise<void> {
    return apiClient.post(`/users/api-keys/${keyId}/revoke`);
  },

  // Notifications
  async getNotificationPreferences(): Promise<{ preferences: NotificationPreferences }> {
    return apiClient.get('/users/notifications');
  },

  async updateNotificationPreferences(
    preferences: Partial<NotificationPreferences>
  ): Promise<{ preferences: NotificationPreferences }> {
    return apiClient.patch('/users/notifications', preferences);
  },

  // Theme
  async getThemeSettings(): Promise<{ settings: ThemeSettings }> {
    return apiClient.get('/users/theme');
  },

  async updateThemeSettings(settings: Partial<ThemeSettings>): Promise<{ settings: ThemeSettings }> {
    return apiClient.patch('/users/theme', settings);
  },

  // Security
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiClient.post('/users/change-password', {
      currentPassword,
      newPassword,
    });
  },

  async enableTwoFactor(): Promise<{ qrCode: string; secret: string }> {
    return apiClient.post('/users/2fa/enable');
  },

  async disableTwoFactor(code: string): Promise<void> {
    return apiClient.post('/users/2fa/disable', { code });
  },

  async getActiveSessions(): Promise<{ sessions: Array<{
    id: string;
    device: string;
    location: string;
    lastActive: string;
    current: boolean;
  }> }> {
    return apiClient.get('/users/sessions');
  },

  async revokeSession(sessionId: string): Promise<void> {
    return apiClient.delete(`/users/sessions/${sessionId}`);
  },

  async revokeAllSessions(): Promise<void> {
    return apiClient.post('/users/sessions/revoke-all');
  },
};

export default settingsService;
