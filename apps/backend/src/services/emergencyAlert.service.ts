import { EmergencyAlert, EmergencyAlertStatus, EmergencyAlertType, User, Notification } from '../models';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

interface CreateEmergencyAlertData {
  title: string;
  content: string;
  alertType: EmergencyAlertType;
  triggeredById: string;
  bitId?: string;
  locationId?: string;
  targetRoles?: string[];
  targetUserIds?: string[];
}

/**
 * Create emergency alert request
 * Supervisor creates PENDING alerts, Manager/MD bypass approval
 */
export async function createEmergencyAlert(data: CreateEmergencyAlertData, userRole: string) {
  try {
    const user = await User.findById(data.triggeredById);
    if (!user) {
      throw new Error('User not found');
    }

    // Determine if alert bypasses approval (Manager/Director)
    const bypassApproval = ['DIRECTOR', 'MANAGER'].includes(userRole);

    const alert = await EmergencyAlert.create({
      title: data.title,
      content: data.content,
      alertType: data.alertType,
      triggeredById: data.triggeredById,
      bitId: data.bitId,
      locationId: data.locationId,
      targetRoles: data.targetRoles || ['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR'],
      targetUserIds: data.targetUserIds || [],
      status: bypassApproval ? EmergencyAlertStatus.APPROVED : EmergencyAlertStatus.PENDING,
      approvedById: bypassApproval ? data.triggeredById : undefined,
      sentAt: bypassApproval ? new Date() : undefined,
    });

    // If bypassed approval, send immediately
    if (bypassApproval) {
      await sendEmergencyAlertNotifications(alert._id.toString());
    } else {
      // Notify GS for approval
      await notifyGSForApproval(alert._id.toString(), data.triggeredById);
    }

    logger.info('Emergency alert created', { 
      alertId: alert._id, 
      status: alert.status,
      triggeredBy: user.email 
    });

    return alert;
  } catch (error) {
    logger.error('Create emergency alert error:', error);
    throw error;
  }
}

/**
 * Get all emergency alerts with filters
 */
export async function getEmergencyAlerts(
  userId: string,
  userRole: string,
  filters?: {
    status?: EmergencyAlertStatus;
    bitId?: string;
    page?: number;
    limit?: number;
  }
) {
  try {
    const page = filters?.page || 1;
    const limit = filters?.limit || 50;
    
    const where: any = { isActive: true };

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.bitId) {
      where.bitId = filters.bitId;
    }

    // Role-based filtering
    if (userRole === 'SUPERVISOR') {
      // Supervisors see only their own alerts
      where.triggeredById = userId;
    } else if (userRole === 'GENERAL_SUPERVISOR') {
      // GS sees alerts they need to approve + sent alerts
      where.$or = [
        { status: EmergencyAlertStatus.PENDING },
        { status: EmergencyAlertStatus.SENT },
        { approvedById: userId },
      ];
    }

    const [alerts, total] = await Promise.all([
      EmergencyAlert.find(where)
        .populate('triggeredById', 'firstName lastName email role')
        .populate('approvedById', 'firstName lastName email role')
        .populate('rejectedById', 'firstName lastName email role')
        .populate('bitId', 'name code')
        .populate('locationId', 'name address')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      EmergencyAlert.countDocuments(where),
    ]);

    return {
      alerts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get emergency alerts error:', error);
    throw error;
  }
}

/**
 * Get emergency alert by ID
 */
export async function getEmergencyAlertById(alertId: string) {
  try {
    const alert = await EmergencyAlert.findById(alertId)
      .populate('triggeredById', 'firstName lastName email role profilePhoto')
      .populate('approvedById', 'firstName lastName email role')
      .populate('rejectedById', 'firstName lastName email role')
      .populate('bitId', 'name code location')
      .populate('locationId', 'name address city province')
      .populate('acknowledgments.userId', 'firstName lastName email role');

    if (!alert) {
      throw new Error('Emergency alert not found');
    }

    return alert;
  } catch (error) {
    logger.error('Get emergency alert error:', error);
    throw error;
  }
}

/**
 * Approve emergency alert (GS only)
 */
export async function approveEmergencyAlert(alertId: string, approvedById: string) {
  try {
    const alert = await EmergencyAlert.findById(alertId);
    
    if (!alert) {
      throw new Error('Emergency alert not found');
    }

    if (alert.status !== EmergencyAlertStatus.PENDING) {
      throw new Error('Alert is not pending approval');
    }

    alert.status = EmergencyAlertStatus.SENT;
    alert.approvedById = new mongoose.Types.ObjectId(approvedById);
    alert.sentAt = new Date();
    await alert.save();

    // Send notifications
    await sendEmergencyAlertNotifications(alertId);

    logger.info('Emergency alert approved', { alertId, approvedById });
    return alert;
  } catch (error) {
    logger.error('Approve emergency alert error:', error);
    throw error;
  }
}

/**
 * Reject emergency alert (GS only)
 */
export async function rejectEmergencyAlert(
  alertId: string, 
  rejectedById: string, 
  reason: string
) {
  try {
    const alert = await EmergencyAlert.findById(alertId);
    
    if (!alert) {
      throw new Error('Emergency alert not found');
    }

    if (alert.status !== EmergencyAlertStatus.PENDING) {
      throw new Error('Alert is not pending approval');
    }

    alert.status = EmergencyAlertStatus.REJECTED;
    alert.rejectedById = new mongoose.Types.ObjectId(rejectedById);
    alert.rejectionReason = reason;
    await alert.save();

    // Notify the supervisor who created it
    await Notification.create({
      userId: alert.triggeredById,
      type: 'ALERT_REJECTED',
      title: 'Emergency Alert Rejected',
      message: `Your emergency alert "${alert.title}" was rejected. Reason: ${reason}`,
      priority: 'HIGH',
      relatedId: alertId,
      relatedModel: 'EmergencyAlert',
    });

    logger.info('Emergency alert rejected', { alertId, rejectedById, reason });
    return alert;
  } catch (error) {
    logger.error('Reject emergency alert error:', error);
    throw error;
  }
}

/**
 * Acknowledge emergency alert
 */
export async function acknowledgeEmergencyAlert(alertId: string, userId: string) {
  try {
    const alert = await EmergencyAlert.findById(alertId);
    
    if (!alert) {
      throw new Error('Emergency alert not found');
    }

    if (alert.status !== EmergencyAlertStatus.SENT) {
      throw new Error('Alert is not active');
    }

    // Check if already acknowledged
    const alreadyAcknowledged = alert.acknowledgments.some(
      ack => ack.userId.toString() === userId
    );

    if (alreadyAcknowledged) {
      return alert;
    }

    alert.acknowledgments.push({
      userId: new mongoose.Types.ObjectId(userId),
      acknowledgedAt: new Date(),
    });

    await alert.save();

    logger.info('Emergency alert acknowledged', { alertId, userId });
    return alert;
  } catch (error) {
    logger.error('Acknowledge emergency alert error:', error);
    throw error;
  }
}

/**
 * Send notifications for emergency alert
 */
async function sendEmergencyAlertNotifications(alertId: string) {
  try {
    const alert = await EmergencyAlert.findById(alertId)
      .populate('triggeredById', 'firstName lastName')
      .populate('bitId', 'name code');

    if (!alert) {
      throw new Error('Alert not found');
    }

    // Get target users
    let targetUsers: any[] = [];

    if (alert.targetUserIds.length > 0) {
      targetUsers = await User.find({
        _id: { $in: alert.targetUserIds },
      });
    } else if (alert.targetRoles.length > 0) {
      targetUsers = await User.find({
        role: { $in: alert.targetRoles },
        status: 'ACTIVE',
      });
    }

    // Create notifications for all target users
    const notifications = targetUsers.map(user => ({
      userId: user._id,
      type: 'EMERGENCY_ALERT',
      title: `🚨 EMERGENCY: ${alert.title}`,
      message: alert.content,
      priority: 'URGENT',
      relatedId: alertId,
      relatedModel: 'EmergencyAlert',
      metadata: {
        alertType: alert.alertType,
        bitId: alert.bitId?._id,
        bitName: alert.bitId?.name,
        triggeredBy: alert.triggeredById,
      },
    }));

    await Notification.insertMany(notifications);

    logger.info('Emergency alert notifications sent', { 
      alertId, 
      recipientCount: targetUsers.length 
    });
  } catch (error) {
    logger.error('Send emergency alert notifications error:', error);
    throw error;
  }
}

/**
 * Notify General Supervisors for approval
 */
async function notifyGSForApproval(alertId: string, supervisorId: string) {
  try {
    const alert = await EmergencyAlert.findById(alertId);
    const supervisor = await User.findById(supervisorId);

    if (!alert || !supervisor) {
      return;
    }

    // Find all General Supervisors
    const generalSupervisors = await User.find({
      role: 'GENERAL_SUPERVISOR',
      status: 'ACTIVE',
    });

    const notifications = generalSupervisors.map(gs => ({
      userId: gs._id,
      type: 'ALERT_APPROVAL_REQUIRED',
      title: 'Emergency Alert Approval Required',
      message: `${supervisor.firstName} ${supervisor.lastName} has submitted an emergency alert: "${alert.title}"`,
      priority: 'HIGH',
      relatedId: alertId,
      relatedModel: 'EmergencyAlert',
    }));

    await Notification.insertMany(notifications);

    logger.info('GS notified for alert approval', { alertId, gsCount: generalSupervisors.length });
  } catch (error) {
    logger.error('Notify GS for approval error:', error);
  }
}

/**
 * Get pending alerts count (for GS dashboard)
 */
export async function getPendingAlertsCount() {
  try {
    const count = await EmergencyAlert.countDocuments({
      status: EmergencyAlertStatus.PENDING,
      isActive: true,
    });

    return count;
  } catch (error) {
    logger.error('Get pending alerts count error:', error);
    return 0;
  }
}
