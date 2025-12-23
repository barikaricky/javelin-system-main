import { User, Notification, Meeting, MeetingParticipant, Director } from '../models';
import { logger } from '../utils/logger';

interface CreateNotificationData {
  senderId?: string;
  receiverId: string;
  type: string;
  subject?: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: any;
  maxViews?: number;
}

export async function createNotification(data: CreateNotificationData) {
  try {
    const notification = await Notification.create({
      senderId: data.senderId,
      receiverId: data.receiverId,
      type: data.type,
      subject: data.subject,
      message: data.message,
      entityType: data.entityType,
      entityId: data.entityId,
      actionUrl: data.actionUrl,
      metadata: data.metadata,
      maxViews: data.maxViews || 3,
      sentAt: new Date(),
    });

    logger.info('Notification created', {
      notificationId: notification._id,
      type: data.type,
      receiverId: data.receiverId,
    });

    return notification;
  } catch (error) {
    logger.error('Create notification error:', error);
    throw error;
  }
}

export async function notifyDirectorsOfNewSupervisor(
  supervisorId: string,
  supervisorName: string,
  supervisorType: 'GENERAL_SUPERVISOR' | 'SUPERVISOR',
  registeredById: string
) {
  try {
    // Get registrar info
    const registrar = await User.findById(registeredById).select('firstName lastName role');

    const typeLabel = supervisorType === 'GENERAL_SUPERVISOR' ? 'General Supervisor' : 'Supervisor';
    const registrarName = registrar ? `${registrar.firstName} ${registrar.lastName}` : 'Unknown';
    const registrarRole = registrar?.role || 'Unknown';

    // Determine who to notify based on supervisor type
    // General Supervisors (registered by Manager) → notify Directors
    // Supervisors (registered by General Supervisor) → notify Managers for approval
    let recipientRole: string;
    let actionUrl: string;

    if (supervisorType === 'GENERAL_SUPERVISOR') {
      // Manager registered a General Supervisor → Directors approve
      recipientRole = 'DIRECTOR';
      actionUrl = '/director/personnel/pending-approvals';
    } else {
      // General Supervisor registered a Supervisor → Managers approve first
      recipientRole = 'MANAGER';
      actionUrl = '/manager/pending-approvals';
    }

    // Get all recipients
    const recipients = await User.find({
      role: recipientRole,
      status: 'ACTIVE',
    }).select('_id');

    // Create notification for each recipient
    const notifications = await Promise.all(
      recipients.map((recipient) =>
        createNotification({
          senderId: registeredById,
          receiverId: recipient._id.toString(),
          type: 'SUPERVISOR_APPROVAL',
          subject: `New ${typeLabel} Registration Pending Approval`,
          message: `${registrarName} (${registrarRole === 'MANAGER' ? 'Manager' : 'General Supervisor'}) has registered a new ${typeLabel}: ${supervisorName}. Please review and approve or reject this registration.`,
          entityType: 'supervisor',
          entityId: supervisorId,
          actionUrl,
        })
      )
    );

    logger.info('Recipients notified of new supervisor registration', {
      supervisorId,
      supervisorType,
      recipientRole,
      notificationCount: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify of new supervisor error:', error);
    throw error;
  }
}

// Notify General Supervisor when their supervisor is approved/rejected
export async function notifyGeneralSupervisorOfApprovalResult(
  generalSupervisorUserId: string,
  supervisorId: string,
  supervisorName: string,
  approved: boolean,
  reviewerId: string,
  credentials?: {
    employeeId: string;
    email: string;
    temporaryPassword: string;
  },
  rejectionReason?: string
) {
  try {
    const reviewer = await User.findById(reviewerId).select('firstName lastName role');

    const reviewerName = reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Reviewer';
    const reviewerRole = reviewer?.role === 'MANAGER' ? 'Manager' : 'Director';

    let message: string;
    let subject: string;
    let metadata: any = null;

    if (approved && credentials) {
      subject = `Supervisor Registration Approved - ${supervisorName}`;
      message = `${reviewerName} (${reviewerRole}) has approved the registration for Supervisor: ${supervisorName}. Click "View Credentials" to see the login details. You can view credentials up to 3 times.`;
      // Store credentials in metadata for secure retrieval
      metadata = {
        credentials: {
          employeeId: credentials.employeeId,
          email: credentials.email,
          temporaryPassword: credentials.temporaryPassword,
        },
        supervisorName,
        supervisorType: 'SUPERVISOR',
      };
    } else {
      subject = `Supervisor Registration Rejected - ${supervisorName}`;
      message = `${reviewerName} (${reviewerRole}) has rejected the registration for Supervisor: ${supervisorName}.\n\nReason: ${rejectionReason || 'No reason provided'}`;
    }

    const notification = await Notification.create({
      senderId: reviewerId,
      receiverId: generalSupervisorUserId,
      type: approved ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED',
      subject,
      message,
      entityType: 'supervisor',
      entityId: supervisorId,
      actionUrl: `/general-supervisor/supervisors/${supervisorId}`,
      metadata,
      maxViews: 3,
      sentAt: new Date(),
    });

    logger.info('General Supervisor notified of approval result', {
      generalSupervisorUserId,
      supervisorId,
      approved,
      notificationId: notification._id,
    });

    return notification;
  } catch (error) {
    logger.error('Notify General Supervisor of approval result error:', error);
    throw error;
  }
}

export async function notifyManagerOfApprovalResult(
  managerId: string,
  supervisorId: string,
  supervisorName: string,
  supervisorType: 'GENERAL_SUPERVISOR' | 'SUPERVISOR',
  approved: boolean,
  directorId: string,
  credentials?: {
    employeeId: string;
    email: string;
    temporaryPassword: string;
  },
  rejectionReason?: string
) {
  try {
    const director = await User.findById(directorId).select('firstName lastName');

    const typeLabel = supervisorType === 'GENERAL_SUPERVISOR' ? 'General Supervisor' : 'Supervisor';
    const directorName = director ? `${director.firstName} ${director.lastName}` : 'The Director';

    let message: string;
    let subject: string;
    let metadata: any = null;

    if (approved && credentials) {
      subject = `${typeLabel} Registration Approved - ${supervisorName}`;
      message = `${directorName} has approved the registration for ${typeLabel}: ${supervisorName}. Click "View Credentials" to see the login details. You can view credentials up to 3 times.`;
      // Store credentials in metadata for secure retrieval
      metadata = {
        credentials: {
          employeeId: credentials.employeeId,
          email: credentials.email,
          temporaryPassword: credentials.temporaryPassword,
        },
        supervisorName,
        supervisorType,
      };
    } else {
      subject = `${typeLabel} Registration Rejected - ${supervisorName}`;
      message = `${directorName} has rejected the registration for ${typeLabel}: ${supervisorName}.\n\nReason: ${rejectionReason || 'No reason provided'}`;
    }

    const notification = await Notification.create({
      senderId: directorId,
      receiverId: managerId,
      type: approved ? 'SUPERVISOR_APPROVED' : 'SUPERVISOR_REJECTED',
      subject,
      message,
      entityType: 'supervisor',
      entityId: supervisorId,
      actionUrl: `/manager/supervisors/${supervisorId}`,
      metadata,
      maxViews: 3,
      sentAt: new Date(),
    });

    logger.info('Manager notified of approval result', {
      managerId,
      supervisorId,
      approved,
      notificationId: notification._id,
    });

    return notification;
  } catch (error) {
    logger.error('Notify manager of approval result error:', error);
    throw error;
  }
}

export async function getNotificationsForUser(userId: string, unreadOnly = false) {
  try {
    const where: any = { receiverId: userId };
    if (unreadOnly) {
      where.isRead = false;
    }

    const notifications = await Notification.find(where)
      .populate({
        path: 'senderId',
        select: 'firstName lastName profilePhoto',
      })
      .sort({ createdAt: -1 })
      .limit(50);

    return notifications;
  } catch (error) {
    logger.error('Get notifications error:', error);
    throw error;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string) {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, receiverId: userId },
      { isRead: true },
      { new: true }
    );

    return notification;
  } catch (error) {
    logger.error('Mark notification as read error:', error);
    throw error;
  }
}

export async function markAllNotificationsAsRead(userId: string) {
  try {
    await Notification.updateMany(
      { receiverId: userId, isRead: false },
      { isRead: true }
    );

    return { success: true };
  } catch (error) {
    logger.error('Mark all notifications as read error:', error);
    throw error;
  }
}

export async function getUnreadNotificationCount(userId: string) {
  try {
    const count = await Notification.countDocuments({
      receiverId: userId,
      isRead: false,
    });

    return count;
  } catch (error) {
    logger.error('Get unread notification count error:', error);
    throw error;
  }
}

// View credentials from notification - increments view count
export async function viewNotificationCredentials(notificationId: string, userId: string) {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      receiverId: userId,
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    if (notification.type !== 'SUPERVISOR_APPROVED') {
      throw new Error('This notification does not contain credentials');
    }

    if (!notification.metadata) {
      throw new Error('No credentials available');
    }

    const metadata = notification.metadata as any;
    const viewCount = notification.viewCount;
    const maxViews = notification.maxViews;

    // Check if view limit reached
    if (viewCount >= maxViews) {
      return {
        canView: false,
        viewCount,
        maxViews,
        credentials: null,
        message: 'View limit reached. Credentials are no longer accessible.',
      };
    }

    // Increment view count
    const updated = await Notification.findByIdAndUpdate(
      notificationId,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    logger.info('Credentials viewed', {
      notificationId,
      userId,
      viewCount: updated!.viewCount,
      maxViews,
    });

    return {
      canView: true,
      viewCount: updated!.viewCount,
      maxViews,
      credentials: metadata.credentials,
      remainingViews: maxViews - updated!.viewCount,
    };
  } catch (error) {
    logger.error('View notification credentials error:', error);
    throw error;
  }
}

// Get notification with view status (doesn't increment count)
export async function getNotificationViewStatus(notificationId: string, userId: string) {
  try {
    const notification = await Notification.findOne({
      _id: notificationId,
      receiverId: userId,
    }).select('type viewCount maxViews metadata');

    if (!notification) {
      throw new Error('Notification not found');
    }

    const hasCredentials = notification.type === 'SUPERVISOR_APPROVED' && notification.metadata;
    const canView = hasCredentials && notification.viewCount < notification.maxViews;

    return {
      hasCredentials,
      canView,
      viewCount: notification.viewCount,
      maxViews: notification.maxViews,
      remainingViews: notification.maxViews - notification.viewCount,
    };
  } catch (error) {
    logger.error('Get notification view status error:', error);
    throw error;
  }
}

// ==================== MEETING NOTIFICATIONS ====================

export async function notifyUsersOfNewMeeting(
  meetingId: string,
  meetingTitle: string,
  meetingLink: string,
  scheduledTime: Date,
  organizerId: string,
  organizerName: string,
  targetRoles?: string[],
  targetUserIds?: string[]
) {
  try {
    const notifications: any[] = [];
    const userIdsToNotify = new Set<string>();

    if (targetRoles && targetRoles.length > 0) {
      const usersByRole = await User.find({
        role: { $in: targetRoles },
        status: 'ACTIVE',
        _id: { $ne: organizerId },
      }).select('_id');
      usersByRole.forEach(user => userIdsToNotify.add(user._id.toString()));
    }

    if (targetUserIds && targetUserIds.length > 0) {
      targetUserIds.forEach(userId => {
        if (userId !== organizerId) {
          userIdsToNotify.add(userId);
        }
      });
    }

    const meetingDate = new Date(scheduledTime);
    const formattedDate = meetingDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = meetingDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });

    for (const userId of userIdsToNotify) {
      const notification = await createNotification({
        senderId: organizerId,
        receiverId: userId,
        type: 'MEETING_INVITATION',
        subject: `Meeting Invitation: ${meetingTitle}`,
        message: `${organizerName} has invited you to a meeting.\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n\nClick to join the meeting when it starts.`,
        entityType: 'meeting',
        entityId: meetingId,
        actionUrl: `/meeting/${meetingLink}`,
        metadata: {
          meetingId,
          meetingTitle,
          meetingLink,
          scheduledTime: scheduledTime.toISOString(),
          organizerName,
        },
      });
      notifications.push(notification);
    }

    logger.info('Meeting invitations sent', {
      meetingId,
      meetingTitle,
      recipientCount: notifications.length,
      targetRoles,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify users of meeting error:', error);
    throw error;
  }
}

export async function notifyUsersOfMeetingReminder(
  meetingId: string,
  meetingTitle: string,
  meetingLink: string,
  scheduledTime: Date,
  minutesBefore: number
) {
  try {
    const participants = await MeetingParticipant.find({
      meetingId,
      status: { $in: ['INVITED', 'ACCEPTED'] },
    }).select('userId');

    const notifications: any[] = [];

    for (const participant of participants) {
      const notification = await createNotification({
        receiverId: participant.userId.toString(),
        type: 'MEETING_REMINDER',
        subject: `Meeting Reminder: ${meetingTitle}`,
        message: `Your meeting "${meetingTitle}" starts in ${minutesBefore} minutes. Click to join now.`,
        entityType: 'meeting',
        entityId: meetingId,
        actionUrl: `/meeting/${meetingLink}`,
        metadata: {
          meetingId,
          meetingTitle,
          meetingLink,
          scheduledTime: scheduledTime.toISOString(),
          minutesBefore,
        },
      });
      notifications.push(notification);
    }

    logger.info('Meeting reminders sent', {
      meetingId,
      minutesBefore,
      recipientCount: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify meeting reminder error:', error);
    throw error;
  }
}

export async function notifyUsersOfMeetingCancellation(
  meetingId: string,
  meetingTitle: string,
  organizerName: string,
  reason?: string
) {
  try {
    const participants = await MeetingParticipant.find({
      meetingId,
    }).select('userId');

    const notifications: any[] = [];

    for (const participant of participants) {
      const notification = await createNotification({
        receiverId: participant.userId.toString(),
        type: 'MEETING_CANCELLED',
        subject: `Meeting Cancelled: ${meetingTitle}`,
        message: `${organizerName} has cancelled the meeting "${meetingTitle}".${reason ? `\n\nReason: ${reason}` : ''}`,
        entityType: 'meeting',
        entityId: meetingId,
        metadata: {
          meetingId,
          meetingTitle,
          reason,
        },
      });
      notifications.push(notification);
    }

    logger.info('Meeting cancellation notifications sent', {
      meetingId,
      recipientCount: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify meeting cancellation error:', error);
    throw error;
  }
}

export async function notifyUsersOfMeetingStarted(
  meetingId: string,
  meetingTitle: string,
  meetingLink: string,
  organizerName: string
) {
  try {
    const participants = await MeetingParticipant.find({
      meetingId,
      status: { $in: ['INVITED', 'ACCEPTED'] },
    }).select('userId');

    const notifications: any[] = [];

    for (const participant of participants) {
      const notification = await createNotification({
        receiverId: participant.userId.toString(),
        type: 'MEETING_STARTED',
        subject: `Meeting Started: ${meetingTitle}`,
        message: `${organizerName} has started the meeting "${meetingTitle}". Click to join now!`,
        entityType: 'meeting',
        entityId: meetingId,
        actionUrl: `/meeting/${meetingLink}`,
        metadata: {
          meetingId,
          meetingTitle,
          meetingLink,
        },
      });
      notifications.push(notification);
    }

    logger.info('Meeting started notifications sent', {
      meetingId,
      recipientCount: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify meeting started error:', error);
    throw error;
  }
}

// ==================== DIRECTOR ACTION NOTIFICATIONS ====================
// Notify all Directors when Managers or Supervisors perform significant actions

export type DirectorNotificationAction = 
  | 'PERSONNEL_REGISTERED'
  | 'PERSONNEL_APPROVED'
  | 'PERSONNEL_REJECTED'
  | 'INCIDENT_REPORTED'
  | 'ATTENDANCE_ISSUE'
  | 'LOCATION_CREATED'
  | 'LOCATION_UPDATED'
  | 'PERSONNEL_STATUS_CHANGED'
  | 'MEETING_SCHEDULED'
  | 'EXPENSE_SUBMITTED'
  | 'GENERAL_ACTION';

export async function notifyDirectorsOfAction(params: {
  actorId: string;
  actorName: string;
  actorRole: string;
  action: DirectorNotificationAction;
  subject: string;
  message: string;
  entityType?: string;
  entityId?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}) {
  try {
    const directors = await User.find({
      role: 'DIRECTOR',
      status: 'ACTIVE',
      _id: { $ne: params.actorId },
    }).select('_id');

    if (directors.length === 0) {
      logger.info('No directors to notify');
      return [];
    }

    const notifications: any[] = [];

    for (const director of directors) {
      const notification = await createNotification({
        senderId: params.actorId,
        receiverId: director._id.toString(),
        type: 'DIRECTOR_ACTION_ALERT',
        subject: params.subject,
        message: params.message,
        entityType: params.entityType,
        entityId: params.entityId,
        actionUrl: params.actionUrl,
        metadata: {
          ...params.metadata,
          actorId: params.actorId,
          actorName: params.actorName,
          actorRole: params.actorRole,
          actionType: params.action,
        },
      });
      notifications.push(notification);
    }

    logger.info('Directors notified of action', {
      action: params.action,
      actorId: params.actorId,
      actorRole: params.actorRole,
      recipientCount: notifications.length,
    });

    return notifications;
  } catch (error) {
    logger.error('Notify directors of action error:', error);
    throw error;
  }
}

// Helper function: Notify directors when a Manager registers a General Supervisor
export async function notifyDirectorsOfGSRegistration(
  managerId: string,
  managerName: string,
  gsName: string,
  gsEmail: string
) {
  return notifyDirectorsOfAction({
    actorId: managerId,
    actorName: managerName,
    actorRole: 'MANAGER',
    action: 'PERSONNEL_REGISTERED',
    subject: `New General Supervisor Registered`,
    message: `${managerName} (Manager) has registered a new General Supervisor: ${gsName} (${gsEmail}). Pending your approval.`,
    entityType: 'registration',
    actionUrl: '/director/registration-requests',
    metadata: {
      personnelType: 'GENERAL_SUPERVISOR',
      personnelName: gsName,
      personnelEmail: gsEmail,
    },
  });
}

// Helper function: Notify directors when a General Supervisor registers a Supervisor
export async function notifyDirectorsOfSupervisorRegistration(
  gsId: string,
  gsName: string,
  supervisorName: string,
  supervisorEmail: string
) {
  return notifyDirectorsOfAction({
    actorId: gsId,
    actorName: gsName,
    actorRole: 'GENERAL_SUPERVISOR',
    action: 'PERSONNEL_REGISTERED',
    subject: `New Supervisor Registered`,
    message: `${gsName} (General Supervisor) has registered a new Supervisor: ${supervisorName} (${supervisorEmail}). Awaiting Manager approval.`,
    entityType: 'registration',
    metadata: {
      personnelType: 'SUPERVISOR',
      personnelName: supervisorName,
      personnelEmail: supervisorEmail,
    },
  });
}

// Helper function: Notify directors when a Supervisor registers an Operator
export async function notifyDirectorsOfOperatorRegistration(
  supervisorId: string,
  supervisorName: string,
  operatorName: string,
  operatorEmail: string
) {
  return notifyDirectorsOfAction({
    actorId: supervisorId,
    actorName: supervisorName,
    actorRole: 'SUPERVISOR',
    action: 'PERSONNEL_REGISTERED',
    subject: `New Operator Registered`,
    message: `${supervisorName} (Supervisor) has registered a new Operator: ${operatorName} (${operatorEmail}).`,
    entityType: 'registration',
    metadata: {
      personnelType: 'OPERATOR',
      personnelName: operatorName,
      personnelEmail: operatorEmail,
    },
  });
}

// Helper function: Notify directors when Manager approves/rejects a Supervisor
export async function notifyDirectorsOfSupervisorApproval(
  managerId: string,
  managerName: string,
  supervisorName: string,
  approved: boolean,
  reason?: string
) {
  return notifyDirectorsOfAction({
    actorId: managerId,
    actorName: managerName,
    actorRole: 'MANAGER',
    action: approved ? 'PERSONNEL_APPROVED' : 'PERSONNEL_REJECTED',
    subject: `Supervisor ${approved ? 'Approved' : 'Rejected'}`,
    message: `${managerName} (Manager) has ${approved ? 'approved' : 'rejected'} Supervisor: ${supervisorName}.${reason ? `\nReason: ${reason}` : ''}`,
    entityType: 'registration',
    metadata: {
      personnelType: 'SUPERVISOR',
      personnelName: supervisorName,
      approved,
      reason,
    },
  });
}

// Helper function: Notify directors of incident reports
export async function notifyDirectorsOfIncident(
  reporterId: string,
  reporterName: string,
  reporterRole: string,
  incidentType: string,
  description: string,
  location?: string
) {
  return notifyDirectorsOfAction({
    actorId: reporterId,
    actorName: reporterName,
    actorRole: reporterRole,
    action: 'INCIDENT_REPORTED',
    subject: `Incident Report: ${incidentType}`,
    message: `${reporterName} (${reporterRole}) has reported an incident: ${incidentType}.\n\nDetails: ${description}${location ? `\nLocation: ${location}` : ''}`,
    entityType: 'incident',
    actionUrl: '/director/incidents',
    metadata: {
      incidentType,
      description,
      location,
    },
  });
}

// Helper function: Notify directors of attendance issues
export async function notifyDirectorsOfAttendanceIssue(
  reporterId: string,
  reporterName: string,
  reporterRole: string,
  operatorName: string,
  issueType: string,
  details: string
) {
  return notifyDirectorsOfAction({
    actorId: reporterId,
    actorName: reporterName,
    actorRole: reporterRole,
    action: 'ATTENDANCE_ISSUE',
    subject: `Attendance Issue: ${issueType}`,
    message: `${reporterName} (${reporterRole}) reported an attendance issue for ${operatorName}.\n\nType: ${issueType}\nDetails: ${details}`,
    entityType: 'attendance',
    metadata: {
      operatorName,
      issueType,
      details,
    },
  });
}

// Helper function: Notify directors when locations are created/updated
export async function notifyDirectorsOfLocationChange(
  actorId: string,
  actorName: string,
  actorRole: string,
  locationName: string,
  isNew: boolean,
  details?: string
) {
  return notifyDirectorsOfAction({
    actorId,
    actorName,
    actorRole,
    action: isNew ? 'LOCATION_CREATED' : 'LOCATION_UPDATED',
    subject: `Location ${isNew ? 'Created' : 'Updated'}: ${locationName}`,
    message: `${actorName} (${actorRole}) has ${isNew ? 'created a new' : 'updated'} location: ${locationName}.${details ? `\n\n${details}` : ''}`,
    entityType: 'location',
    actionUrl: '/director/workers',
    metadata: {
      locationName,
      isNew,
      details,
    },
  });
}

// Helper function: Notify directors of personnel status changes
export async function notifyDirectorsOfStatusChange(
  actorId: string,
  actorName: string,
  actorRole: string,
  personnelName: string,
  personnelRole: string,
  newStatus: string,
  reason?: string
) {
  return notifyDirectorsOfAction({
    actorId,
    actorName,
    actorRole,
    action: 'PERSONNEL_STATUS_CHANGED',
    subject: `Personnel Status Changed`,
    message: `${actorName} (${actorRole}) has changed the status of ${personnelName} (${personnelRole}) to ${newStatus}.${reason ? `\n\nReason: ${reason}` : ''}`,
    entityType: 'user',
    actionUrl: '/director/workers',
    metadata: {
      personnelName,
      personnelRole,
      newStatus,
      reason,
    },
  });
}

// Helper function: Notify directors when meetings are scheduled
export async function notifyDirectorsOfMeetingScheduled(
  organizerId: string,
  organizerName: string,
  organizerRole: string,
  meetingTitle: string,
  scheduledTime: Date,
  participants: number
) {
  const formattedDate = scheduledTime.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = scheduledTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return notifyDirectorsOfAction({
    actorId: organizerId,
    actorName: organizerName,
    actorRole: organizerRole,
    action: 'MEETING_SCHEDULED',
    subject: `Meeting Scheduled: ${meetingTitle}`,
    message: `${organizerName} (${organizerRole}) has scheduled a meeting: ${meetingTitle}\n\n📅 ${formattedDate}\n⏰ ${formattedTime}\n👥 ${participants} participants`,
    entityType: 'meeting',
    metadata: {
      meetingTitle,
      scheduledTime: scheduledTime.toISOString(),
      participants,
    },
  });
}

// Helper function: Notify directors when expenses are submitted
export async function notifyDirectorsOfExpenseSubmission(
  submitterId: string,
  submitterName: string,
  submitterRole: string,
  amount: number,
  category: string,
  description: string
) {
  return notifyDirectorsOfAction({
    actorId: submitterId,
    actorName: submitterName,
    actorRole: submitterRole,
    action: 'EXPENSE_SUBMITTED',
    subject: `Expense Submitted: $${amount.toFixed(2)}`,
    message: `${submitterName} (${submitterRole}) has submitted an expense.\n\n💰 Amount: $${amount.toFixed(2)}\n📂 Category: ${category}\n📝 ${description}`,
    entityType: 'expense',
    actionUrl: '/director/expenses',
    metadata: {
      amount,
      category,
      description,
    },
  });
}
