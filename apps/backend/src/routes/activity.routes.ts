import { Router, Request, Response, NextFunction } from 'express';
import { getRecentActivities, getAllActivities } from '../services/activity.service';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Apply authentication middleware to all routes
router.use(authenticate);

// GET /api/activities/recent - Get recent activities (for dashboard)
router.get('/recent', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const limit = 6; // Show 6 activities on dashboard
    const activities = await getRecentActivities(limit);
    res.json({ activities });
  } catch (error) {
    next(error);
  }
});

// GET /api/activities - Get all activities with pagination
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.query.userId as string;
    const action = req.query.action as string;
    const entityType = req.query.entityType as string;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const result = await getAllActivities(page, limit, {
      userId,
      action,
      entityType,
      startDate,
      endDate,
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;
