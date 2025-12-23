import { api } from '../lib/api';

export interface Notification {
  id: string;
  senderId?: string;
  receiverId: string;
  type: string;
  subject?: string;
  message: string;
  isRead: boolean;
  sentAt?: string;
  createdAt: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  viewCount?: number;
  maxViews?: number;
  users_notifications_senderIdTousers?: {
    firstName: string;
    lastName: string;
    profilePhoto?: string;
  };
}

export interface CredentialViewResult {
  canView: boolean;
  viewCount: number;
  maxViews: number;
  credentials?: {
    employeeId: string;
    email: string;
    temporaryPassword: string;
  };
  remainingViews?: number;
  message?: string;
}

export interface ViewStatus {
  hasCredentials: boolean;
  canView: boolean;
  viewCount: number;
  maxViews: number;
  remainingViews: number;
}

export const notificationService = {
  // Get all notifications for current user
  async getAll(unreadOnly = false): Promise<Notification[]> {
    const response = await api.get(`/notifications?unreadOnly=${unreadOnly}`);
    return response.data;
  },

  // Get unread notification count
  async getUnreadCount(): Promise<number> {
    const response = await api.get('/notifications/unread-count');
    return response.data.count;
  },

  // Mark a notification as read
  async markAsRead(notificationId: string): Promise<Notification> {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  async markAllAsRead(): Promise<void> {
    await api.patch('/notifications/read-all');
  },

  // Get view status for a notification (doesn't increment count)
  async getViewStatus(notificationId: string): Promise<ViewStatus> {
    const response = await api.get(`/notifications/${notificationId}/view-status`);
    return response.data;
  },

  // View credentials (increments view count)
  async viewCredentials(notificationId: string): Promise<CredentialViewResult> {
    const response = await api.post(`/notifications/${notificationId}/view-credentials`);
    return response.data;
  },
};
