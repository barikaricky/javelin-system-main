import { AuditLog } from '../models';

// Activity types
export type ActivityType = 
  | 'LOGIN'
  | 'LOGOUT'
  | 'SUPERVISOR_REGISTERED'
  | 'SUPERVISOR_APPROVED'
  | 'SUPERVISOR_REJECTED'
  | 'MANAGER_REGISTERED'
  | 'EXPENSE_SUBMITTED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_REJECTED'
  | 'MEETING_CREATED'
  | 'MEETING_JOINED'
  | 'POLL_CREATED'
  | 'POLL_VOTED'
  | 'PROFILE_UPDATED'
  | 'PASSWORD_CHANGED'
  | 'ATTENDANCE_CHECKED_IN'
  | 'ATTENDANCE_CHECKED_OUT'
  | 'INCIDENT_REPORTED'
  | 'INCIDENT_RESOLVED';

// Log an activity
export async function logActivity(
  userId: string,
  action: ActivityType,
  entityType?: string,
  entityId?: string,
  metadata?: Record<string, any>,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    const activity = await AuditLog.create({
        userId,
        action,
        entityType,
        entityId,
        metadata: metadata ? metadata : undefined,
        ipAddress,
        userAgent,
        timestamp: new Date(),
      
    });

    return activity;
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw - activity logging should not break main operations
    return null;
  }
}

// Get recent activities (for director dashboard)
export async function getRecentActivities(limit: number = 6) {
  try {
    const activities = await AuditLog.find()
      .sort({ timestamp: -1 })
      .limit(limit)
      .populate({
        path: 'userId',
        select: 'firstName lastName email role profilePhoto',
      })
      .exec();

    // Transform activities for frontend
    return activities.map((activity) => {
      const user = activity.userId as any;
      return {
        id: activity._id.toString(),
        type: mapActionToType(activity.action),
        action: activity.action,
        user: user ? `${user.firstName} ${user.lastName}` : 'System',
        role: user?.role || '',
        userPhoto: user?.profilePhoto || null,
        time: getRelativeTime(activity.timestamp),
        timestamp: activity.timestamp,
        status: getActivityStatus(activity.action),
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: activity.metadata,
      };
    });
  } catch (error) {
    console.error('Error fetching recent activities:', error);
    throw error;
  }
}

// Get all activities with pagination
export async function getAllActivities(
  page: number = 1,
  limit: number = 20,
  filters?: {
    userId?: string;
    action?: string;
    entityType?: string;
    startDate?: Date;
    endDate?: Date;
  }
) {
  try {
    const where: any = {};

    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.action) {
      where.action = filters.action;
    }
    if (filters?.entityType) {
      where.entityType = filters.entityType;
    }
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) {
        where.timestamp.$gte = filters.startDate;
      }
      if (filters.endDate) {
        where.timestamp.$lte = filters.endDate;
      }
    }

    const skip = (page - 1) * limit;

    const [activities, total] = await Promise.all([
      AuditLog.find(where)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'userId',
          select: 'firstName lastName email role profilePhoto',
        })
        .exec(),
      AuditLog.countDocuments(where),
    ]);

    return {
      activities: activities.map((activity) => {
        const user = activity.userId as any;
        return {
          id: activity._id.toString(),
          type: mapActionToType(activity.action),
          action: activity.action,
          user: user ? `${user.firstName} ${user.lastName}` : 'System',
          role: user?.role || '',
          userPhoto: user?.profilePhoto || null,
          time: getRelativeTime(activity.timestamp),
          timestamp: activity.timestamp,
          status: getActivityStatus(activity.action),
          entityType: activity.entityType,
          entityId: activity.entityId,
          metadata: activity.metadata,
          ipAddress: activity.ipAddress,
          userAgent: activity.userAgent,
        };
      }),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    console.error('Error fetching all activities:', error);
    throw error;
  }
}

// Helper function to map action to frontend type
function mapActionToType(action: string): string {
  if (action.includes('LOGIN') || action.includes('LOGOUT')) return 'auth';
  if (action.includes('SUPERVISOR') || action.includes('MANAGER')) return 'registration';
  if (action.includes('EXPENSE')) return 'expense';
  if (action.includes('MEETING')) return 'meeting';
  if (action.includes('POLL')) return 'poll';
  if (action.includes('ATTENDANCE')) return 'check-in';
  if (action.includes('INCIDENT')) return 'alert';
  if (action.includes('PROFILE') || action.includes('PASSWORD')) return 'profile';
  return 'system';
}

// Helper function to get activity status
function getActivityStatus(action: string): string {
  if (action.includes('APPROVED') || action.includes('RESOLVED') || action.includes('SUCCESS')) {
    return 'success';
  }
  if (action.includes('REJECTED') || action.includes('FAILED')) {
    return 'error';
  }
  if (action.includes('REGISTERED') || action.includes('SUBMITTED') || action.includes('REPORTED')) {
    return 'pending';
  }
  if (action.includes('LOGIN') || action.includes('LOGOUT') || action.includes('CHECKED')) {
    return 'completed';
  }
  return 'info';
}

// Helper function to get relative time
function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) {
    return 'Just now';
  } else if (diffMins < 60) {
    return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays < 7) {
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
