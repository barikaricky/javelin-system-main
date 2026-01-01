import { Router, Request, Response } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../utils/asyncHandler';

const router = Router();

interface Notification {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  relatedId?: string;
  relatedType?: string;
  read: boolean;
  createdAt: Date;
}

// In-memory notification store (replace with database in production)
const notifications: Notification[] = [];

// GET /api/notifications - Get user's notifications
router.get('/', authenticate, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.userId;
  
  const userNotifications = notifications
    .filter((n) => n.userId === userId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 50); // Last 50 notifications

  const unreadCount = userNotifications.filter((n) => !n.read).length;

  res.json({
    success: true,
    notifications: userNotifications,
    unreadCount,
  });
}));

// POST /api/notifications/:id/read - Mark notification as read
router.post('/:id/read', authenticate, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const notification = notifications.find((n) => n._id === id && n.userId === userId);
  
  if (!notification) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notification.read = true;

  res.json({
    success: true,
    message: 'Notification marked as read',
  });
}));

// POST /api/notifications/read-all - Mark all notifications as read
router.post('/read-all', authenticate, asyncHandler(async (req: any, res: Response) => {
  const userId = req.user.userId;

  notifications
    .filter((n) => n.userId === userId && !n.read)
    .forEach((n) => (n.read = true));

  res.json({
    success: true,
    message: 'All notifications marked as read',
  });
}));

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', authenticate, asyncHandler(async (req: any, res: Response) => {
  const { id } = req.params;
  const userId = req.user.userId;

  const index = notifications.findIndex((n) => n._id === id && n.userId === userId);
  
  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Notification not found' });
  }

  notifications.splice(index, 1);

  res.json({
    success: true,
    message: 'Notification deleted',
  });
}));

// Helper function to create notification (can be called from other routes)
export function createNotification(
  userId: string,
  type: string,
  title: string,
  message: string,
  relatedId?: string,
  relatedType?: string
) {
  const notification: Notification = {
    _id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    userId,
    type,
    title,
    message,
    relatedId,
    relatedType,
    read: false,
    createdAt: new Date(),
  };

  notifications.push(notification);
  
  // In production, you would:
  // 1. Save to database
  // 2. Send push notification
  // 3. Send email if configured
  // 4. Send SMS if critical
  
  return notification;
}

export default router;
