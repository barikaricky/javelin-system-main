import { AppError } from '../middlewares/error.middleware';
import { logger } from '../utils/logger';
import { Meeting, Director, User, MeetingParticipant } from '../models';

// Type definitions
type MeetingStatus = 'SCHEDULED' | 'WAITING' | 'LIVE' | 'ENDED' | 'CANCELLED';
type MeetingType = 'VIDEO_CONFERENCE' | 'AUDIO_ONLY' | 'WEBINAR' | 'HYBRID';
type MeetingCategory = 'GENERAL' | 'TRAINING' | 'EMERGENCY' | 'REVIEW' | 'PLANNING' | 'OTHER';

// Generate a unique meeting link
function generateMeetingLink(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let link = '';
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 4; j++) {
      link += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < 2) link += '-';
  }
  return link;
}

interface MeetingFilters {
  organizerId?: string;
  userId?: string;
  status?: MeetingStatus | MeetingStatus[];
  meetingType?: MeetingType;
  category?: MeetingCategory;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}

// Get all meetings with filters
export async function getMeetings(filters: MeetingFilters) {
  const {
    organizerId,
    userId,
    status,
    meetingType,
    category,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
  } = filters;

  const filter: any = {};

  // If userId provided, find meetings they're part of
  if (userId) {
    const director = await Director.findOne({ userId }).lean();
    
    if (director) {
      filter.$or = [
        { organizerId: director._id },
        // User is a participant would require join - simplified for now
      ];
    }
  } else if (organizerId) {
    filter.organizerId = organizerId;
  }

  if (status) {
    filter.status = Array.isArray(status) ? { $in: status } : status;
  }

  if (meetingType) {
    filter.meetingType = meetingType;
  }

  if (category) {
    filter.category = category;
  }

  if (startDate || endDate) {
    filter.scheduledTime = {};
    if (startDate) filter.scheduledTime.$gte = startDate;
    if (endDate) filter.scheduledTime.$lte = endDate;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }

  const skip = (page - 1) * limit;

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('organizerId')
      .sort({ scheduledTime: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Meeting.countDocuments(filter),
  ]);

  return {
    meetings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get upcoming meetings for a user
export async function getUpcomingMeetings(userId: string, limit: number = 10) {
  const now = new Date();
  
  // Find director if user is one
  const director = await Director.findOne({ userId }).lean();
  
  const filter: any = {
    scheduledTime: { $gte: now },
    status: { $in: ['SCHEDULED', 'LIVE'] },
  };

  if (director) {
    filter.$or = [{ organizerId: director._id }];
  }

  const meetings = await Meeting.find(filter)
    .populate('organizerId')
    .sort({ scheduledTime: 1 })
    .limit(limit)
    .lean();

  return meetings;
}

// Get meeting statistics
export async function getMeetingStats(userId?: string) {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  let filter: any = {};
  
  if (userId) {
    const director = await Director.findOne({ userId }).lean();
    if (director) {
      filter.organizerId = director._id;
    }
  }

  const [
    totalMeetings,
    scheduledMeetings,
    completedMeetings,
    cancelledMeetings,
    recentMeetings,
  ] = await Promise.all([
    Meeting.countDocuments(filter),
    Meeting.countDocuments({ ...filter, status: 'SCHEDULED', scheduledTime: { $gte: now } }),
    Meeting.countDocuments({ ...filter, status: 'ENDED' }),
    Meeting.countDocuments({ ...filter, status: 'CANCELLED' }),
    Meeting.countDocuments({ ...filter, createdAt: { $gte: thirtyDaysAgo } }),
  ]);

  return {
    total: totalMeetings,
    scheduled: scheduledMeetings,
    completed: completedMeetings,
    cancelled: cancelledMeetings,
    recentlyCreated: recentMeetings,
  };
}

// Create a new meeting
interface CreateMeetingData {
  organizerId: string;
  title: string;
  description?: string;
  scheduledTime: Date;
  duration?: number;
  meetingType?: MeetingType;
  category?: MeetingCategory;
  agenda?: string;
  targetRoles?: string[];
  targetUserIds?: string[];
}

export async function createMeeting(data: CreateMeetingData) {
  try {
    logger.info('Creating new meeting - full data', { 
      organizerId: data.organizerId, 
      title: data.title,
      scheduledTime: data.scheduledTime,
      fullData: data 
    });

    // Verify organizer is a director
    const director = await Director.findById(data.organizerId).populate('userId');

    logger.info('Director lookup result', { 
      found: !!director, 
      directorId: director?._id,
      userId: director?.userId 
    });

    if (!director) {
      logger.error('Director not found for organizerId', { organizerId: data.organizerId });
      throw new AppError('Only directors can create meetings', 403);
    }

    // Generate meeting link
    const meetingLink = generateMeetingLink();

    // Calculate end time
    const duration = data.duration || 60;
    const endTime = new Date(data.scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + duration);

    // Create meeting
    const meeting = await Meeting.create({
      organizerId: data.organizerId,
      title: data.title,
      description: data.description,
      meetingLink,
      scheduledTime: data.scheduledTime,
      duration,
      endTime,
      meetingType: data.meetingType || 'VIDEO_CONFERENCE',
      category: data.category || 'GENERAL',
      agenda: data.agenda,
      targetRoles: data.targetRoles || [],
      targetUserIds: data.targetUserIds || [],
      status: 'SCHEDULED',
    });

    logger.info('Meeting created successfully', { meetingId: meeting._id, meetingLink });

    return {
      success: true,
      meeting: {
        id: meeting._id,
        title: meeting.title,
        description: meeting.description,
        meetingLink: meeting.meetingLink,
        joinUrl: `/meeting/${meeting.meetingLink}`,
        scheduledTime: meeting.scheduledTime,
        duration: meeting.duration,
        status: meeting.status,
      },
    };
  } catch (error: any) {
    logger.error('Error creating meeting:', error);
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(error.message || 'Failed to create meeting', 500);
  }
}

// Get meeting by ID
export async function getMeetingById(meetingId: string) {
  const meeting = await Meeting.findById(meetingId)
    .populate('organizerId')
    .lean();

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  return meeting;
}

// Get meeting by link
export async function getMeetingByLink(meetingLink: string) {
  const meeting = await Meeting.findOne({ meetingLink })
    .populate('organizerId')
    .lean();

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  return meeting;
}

// Cancel meeting
export async function cancelMeeting(meetingId: string, userId: string, reason?: string) {
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const director = await Director.findById(meeting.organizerId);
  if (!director || director.userId.toString() !== userId) {
    throw new AppError('Only the meeting organizer can cancel the meeting', 403);
  }

  meeting.status = 'CANCELLED';
  meeting.cancelledAt = new Date();
  meeting.cancellationReason = reason;
  await meeting.save();

  logger.info('Meeting cancelled', { meetingId });
  return meeting;
}

// Start meeting
export async function startMeeting(meetingId: string, userId: string) {
  logger.info('startMeeting called', { meetingId, userId });
  
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    logger.error('Meeting not found', { meetingId });
    throw new AppError('Meeting not found', 404);
  }

  logger.info('Meeting found', { 
    meetingId, 
    organizerId: meeting.organizerId,
    status: meeting.status 
  });

  // Check if user is the organizer
  // The organizerId could be a Director _id or a User _id
  const director = await Director.findById(meeting.organizerId);
  
  logger.info('Director lookup', { 
    found: !!director,
    directorUserId: director?.userId?.toString(),
    requestUserId: userId 
  });
  
  const isOrganizer = director 
    ? director.userId.toString() === userId 
    : meeting.organizerId.toString() === userId;

  logger.info('Authorization check', { isOrganizer });

  if (!isOrganizer) {
    logger.error('User not authorized to start meeting', { 
      userId, 
      organizerId: meeting.organizerId,
      directorUserId: director?.userId 
    });
    throw new AppError('Only the meeting organizer can start the meeting', 403);
  }

  meeting.status = 'LIVE';
  meeting.startedAt = new Date();
  
  // Generate 8x8 video conference URL if not already set
  if (!meeting.videoUrl) {
    // 8x8 uses format: https://8x8.vc/vpaas-magic-cookie-YOUR_TENANT/MeetingName
    // For free tier, use meet.jit.si (powered by 8x8)
    meeting.videoUrl = `https://meet.jit.si/jevelin-${meeting.meetingLink}`;
  }
  
  await meeting.save();

  logger.info('Meeting started with 8x8', { meetingId, videoUrl: meeting.videoUrl });
  return meeting;
}

// End meeting
export async function endMeeting(meetingId: string, userId: string) {
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const director = await Director.findById(meeting.organizerId);
  if (!director || director.userId.toString() !== userId) {
    throw new AppError('Only the meeting organizer can end the meeting', 403);
  }

  meeting.status = 'ENDED';
  meeting.endedAt = new Date();
  
  if (meeting.startedAt) {
    const duration = Math.floor((meeting.endedAt.getTime() - meeting.startedAt.getTime()) / 60000);
    meeting.actualDuration = duration;
  }
  
  await meeting.save();

  logger.info('Meeting ended', { meetingId });
  return meeting;
}

// Delete meeting
export async function deleteMeeting(meetingId: string, userId: string) {
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const director = await Director.findById(meeting.organizerId);
  if (!director || director.userId.toString() !== userId) {
    throw new AppError('Only the meeting organizer can delete the meeting', 403);
  }

  await Meeting.findByIdAndDelete(meetingId);

  logger.info('Meeting deleted', { meetingId });
  return { success: true };
}

// Update meeting
export async function updateMeeting(meetingId: string, userId: string, updates: Partial<CreateMeetingData>) {
  const meeting = await Meeting.findById(meetingId);

  if (!meeting) {
    throw new AppError('Meeting not found', 404);
  }

  const director = await Director.findById(meeting.organizerId);
  if (!director || director.userId.toString() !== userId) {
    throw new AppError('Only the meeting organizer can update the meeting', 403);
  }

  Object.assign(meeting, updates);
  
  // Recalculate end time if duration or scheduledTime changed
  if (updates.duration || updates.scheduledTime) {
    const endTime = new Date(meeting.scheduledTime);
    endTime.setMinutes(endTime.getMinutes() + meeting.duration);
    meeting.endTime = endTime;
  }
  
  await meeting.save();

  logger.info('Meeting updated', { meetingId });
  return meeting;
}

// Get ongoing meetings
export async function getOngoingMeetings(organizerId?: string, userId?: string) {
  const now = new Date();
  
  const filter: any = {
    status: 'LIVE',
  };

  if (organizerId) {
    filter.organizerId = organizerId;
  }

  const meetings = await Meeting.find(filter)
    .populate('organizerId')
    .sort({ startedAt: -1 })
    .lean();

  return meetings;
}

// Get past meetings
export async function getPastMeetings(organizerId?: string, userId?: string, page: number = 1, limit: number = 20) {
  const filter: any = {
    status: 'ENDED',
  };

  if (organizerId) {
    filter.organizerId = organizerId;
  }

  const skip = (page - 1) * limit;

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('organizerId')
      .sort({ endedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Meeting.countDocuments(filter),
  ]);

  return {
    meetings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

// Get cancelled meetings
export async function getCancelledMeetings(organizerId?: string, page: number = 1, limit: number = 20) {
  const filter: any = {
    status: 'CANCELLED',
  };

  if (organizerId) {
    filter.organizerId = organizerId;
  }

  const skip = (page - 1) * limit;

  const [meetings, total] = await Promise.all([
    Meeting.find(filter)
      .populate('organizerId')
      .sort({ cancelledAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Meeting.countDocuments(filter),
  ]);

  return {
    meetings,
    pagination: {
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    },
  };
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  forAll = false
) {
  try {
    const message = await Message.findById(messageId).populate('conversationId');

    if (!message) {
      throw new Error('Message not found');
    }

    if (forAll) {
      const isAdmin = await ConversationParticipant.findOne({
        conversationId: message.conversationId,
        userId,
        role: { $in: ['ADMIN', 'MODERATOR'] },
      });

      if (!isAdmin && message.senderId.toString() !== userId) {
        throw new Error('You cannot delete this message for everyone');
      }
    }

    await Message.findByIdAndUpdate(messageId, {
      isDeleted: true,
      deletedAt: new Date(),
      deletedForAll: forAll,
      content: forAll ? 'This message was deleted' : message.content,
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete message error:', error);
    throw error;
  }
}

export async function reactToMessage(messageId: string, userId: string, emoji: string) {
  try {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = (message.reactions as any) || {};
    
    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id: string) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      reactions[emoji].push(userId);
    }

    await Message.findByIdAndUpdate(messageId, { reactions });

    return { success: true, reactions };
  } catch (error) {
    logger.error('React to message error:', error);
    throw error;
  }
}
