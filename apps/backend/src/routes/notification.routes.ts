import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import {
  getNotificationsForUser,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  getUnreadNotificationCount,
  viewNotificationCredentials,
  getNotificationViewStatus,
} from '../services/notification.service';

const router = Router();

router.use(authenticate);

// Get all notifications for current user
router.get('/', asyncHandler(async (req: any, res) => {
  const unreadOnly = req.query.unreadOnly === 'true';
  const notifications = await getNotificationsForUser(req.user.userId, unreadOnly);
  res.json(notifications);
}));

// Get unread notification count
router.get('/unread-count', asyncHandler(async (req: any, res) => {
  const count = await getUnreadNotificationCount(req.user.userId);
  res.json({ count });
}));

// Get credential view status for a notification
router.get('/:id/view-status', asyncHandler(async (req: any, res) => {
  const status = await getNotificationViewStatus(req.params.id, req.user.userId);
  res.json(status);
}));

// View credentials from notification (increments view count)
router.post('/:id/view-credentials', asyncHandler(async (req: any, res) => {
  const result = await viewNotificationCredentials(req.params.id, req.user.userId);
  res.json(result);
}));

// Mark a notification as read
router.patch('/:id/read', asyncHandler(async (req: any, res) => {
  const notification = await markNotificationAsRead(req.params.id, req.user.userId);
  res.json(notification);
}));

// Mark all notifications as read
router.patch('/read-all', asyncHandler(async (req: any, res) => {
  await markAllNotificationsAsRead(req.user.userId);
  res.json({ message: 'All notifications marked as read' });
}));

export default router;
