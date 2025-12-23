import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as meetingService from '../services/meeting.service';
import { logger } from '../utils/logger';
import { Director } from '../models';

const router = Router();

// All routes require authentication
router.use(authenticate);

// ==================== CRUD ROUTES ====================

// Create a new meeting (Director only)
router.post(
  '/',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;

    logger.info('Meeting creation request', { userId, body: req.body });

    const director = await Director.findOne({ userId }).lean();

    if (!director) {
      logger.error('Director not found for user', { userId });
      return res.status(403).json({ error: 'Only directors can create meetings' });
    }

    logger.info('Director found', { directorId: director._id });

    const {
      title,
      description,
      scheduledTime,
      duration,
      meetingType,
      category,
      agenda,
      recordingEnabled,
      autoStartRecording,
      maxParticipants,
      targetRoles,
      targetUserIds,
      allowGuestAccess,
      isRecurring,
      recurringPattern,
      recurringEndDate,
      recurringDays,
      timezone,
      requirePassword,
      meetingPassword,
      waitingRoomEnabled,
      allowJoinBeforeHost,
      joinBeforeHostMinutes,
      muteParticipantsOnEntry,
      disableParticipantVideo,
      allowScreenSharing,
      allowChat,
      allowRaiseHand,
      allowReactions,
      customReminderMinutes,
      attachments,
    } = req.body;

    logger.info('Meeting data received', { title, scheduledTime });

    if (!title || !scheduledTime) {
      logger.error('Missing required fields', { title, scheduledTime });
      return res.status(400).json({ error: 'Title and scheduled time are required' });
    }

    const result = await meetingService.createMeeting({
      organizerId: director._id.toString(),
      title,
      description,
      scheduledTime: new Date(scheduledTime),
      duration: duration ? parseInt(duration, 10) : undefined,
      meetingType,
      category,
      agenda,
      targetRoles,
      targetUserIds,
    });

    res.status(201).json(result);
  })
);

// Get meetings with filters
router.get(
  '/',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const role = req.user!.role;
    const { 
      status, 
      meetingType, 
      category,
      startDate, 
      endDate,
      search,
      page,
      limit 
    } = req.query;

    // Parse status - can be comma-separated
    let statusFilter: any;
    if (status) {
      const statusStr = status as string;
      statusFilter = statusStr.includes(',') ? statusStr.split(',') : statusStr;
    }

    const result = await meetingService.getMeetings({
      userId,
      status: statusFilter,
      meetingType: meetingType as any,
      category: category as any,
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      search: search as string,
      page: page ? parseInt(page as string) : 1,
      limit: limit ? parseInt(limit as string) : 20,
    });

    res.json(result);
  })
);

// Get meeting statistics
router.get(
  '/stats',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { startDate, endDate } = req.query;

    const stats = await meetingService.getMeetingStats(
      undefined,
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    res.json(stats);
  })
);

// Get upcoming meetings
router.get(
  '/upcoming',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { limit } = req.query;

    const meetings = await meetingService.getUpcomingMeetings(
      userId,
      limit ? parseInt(limit as string) : 10
    );

    res.json({ meetings });
  })
);

// Get ongoing meetings
router.get(
  '/ongoing',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const meetings = await meetingService.getOngoingMeetings(undefined, userId);
    res.json({ meetings });
  })
);

// Get past meetings
router.get(
  '/past',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = req.query;

    const result = await meetingService.getPastMeetings(
      undefined,
      userId,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  })
);

// Get cancelled meetings
router.get(
  '/cancelled',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = req.query;

    const director = await Director.findOne({ userId }).lean();

    const result = await meetingService.getCancelledMeetings(
      director?._id?.toString(),
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  })
);

// Get meeting by ID
router.get(
  '/:meetingId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const meeting = await meetingService.getMeetingById(meetingId);
    res.json({ meeting });
  })
);

// Get meeting by link
router.get(
  '/link/:meetingLink',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingLink } = req.params;
    const meeting = await meetingService.getMeetingByLink(meetingLink);
    res.json({ meeting });
  })
);

// Update a meeting (Director only)
router.patch(
  '/:meetingId',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const updateData = req.body;

    // Convert date strings to Date objects
    if (updateData.scheduledTime) {
      updateData.scheduledTime = new Date(updateData.scheduledTime);
    }
    if (updateData.recurringEndDate) {
      updateData.recurringEndDate = new Date(updateData.recurringEndDate);
    }

    const meeting = await meetingService.updateMeeting(meetingId, updateData);
    res.json({ meeting });
  })
);

// Delete a meeting (Director only)
router.delete(
  '/:meetingId',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;

    await meetingService.deleteMeeting(meetingId, userId);
    res.json({ success: true, message: 'Meeting deleted' });
  })
);

// ==================== MEETING LIFECYCLE ====================

// Start a meeting
router.post(
  '/:meetingId/start',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;

    logger.info('Starting meeting with 8x8', { meetingId, userId });
    
    try {
      const meeting = await meetingService.startMeeting(meetingId, userId);
      logger.info('Meeting started successfully', { meetingId, videoUrl: meeting.videoUrl });
      res.json({ meeting });
    } catch (error: any) {
      logger.error('Failed to start meeting', { 
        meetingId, 
        userId, 
        error: error.message,
        stack: error.stack 
      });
      throw error;
    }
  })
);

// Join a meeting
router.post(
  '/join/:meetingLink',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingLink } = req.params;
    const userId = req.user!.userId;

    const result = await meetingService.joinMeeting(meetingLink, userId);
    res.json(result);
  })
);

// Leave a meeting
router.post(
  '/:meetingId/leave',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;

    await meetingService.leaveMeeting(meetingId, userId);
    res.json({ success: true, message: 'Successfully left the meeting' });
  })
);

// End a meeting
router.post(
  '/:meetingId/end',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;

    const meeting = await meetingService.endMeeting(meetingId, userId);
    res.json({ meeting });
  })
);

// Cancel a meeting
router.post(
  '/:meetingId/cancel',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;
    const { reason } = req.body;

    const meeting = await meetingService.cancelMeeting(meetingId, userId, reason);
    res.json({ meeting });
  })
);

// Enable waiting room
router.post(
  '/:meetingId/waiting-room',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;

    const meeting = await meetingService.enableWaitingRoom(meetingId, userId);
    res.json({ meeting });
  })
);

// ==================== PARTICIPANTS ====================

// Get meeting participants
router.get(
  '/:meetingId/participants',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const participants = await meetingService.getParticipants(meetingId);
    res.json({ participants });
  })
);

// Add participants to meeting (Director only)
router.post(
  '/:meetingId/participants',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const { userIds } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'User IDs array is required' });
    }

    const participants = await meetingService.addParticipants(meetingId, userIds);
    res.status(201).json({ participants });
  })
);

// Remove participant from meeting (Director only)
router.delete(
  '/:meetingId/participants/:participantId',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId, participantId } = req.params;
    await meetingService.removeParticipant(meetingId, participantId);
    res.json({ success: true, message: 'Participant removed' });
  })
);

// Update participant status
router.patch(
  '/:meetingId/participants/:userId/status',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId, userId } = req.params;
    const { status } = req.body;

    const participant = await meetingService.updateParticipantStatus(meetingId, userId, status);
    res.json({ participant });
  })
);

// Update participant role (Director only)
router.patch(
  '/:meetingId/participants/:userId/role',
  requireRole(['DIRECTOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId, userId } = req.params;
    const { role } = req.body;

    const participant = await meetingService.updateParticipantRole(meetingId, userId, role);
    res.json({ participant });
  })
);

// Toggle participant mute (for host/co-host)
router.patch(
  '/:meetingId/participants/:userId/mute',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId, userId } = req.params;
    const { isMuted } = req.body;

    const participant = await meetingService.toggleParticipantMute(meetingId, userId, isMuted);
    res.json({ participant });
  })
);

// Toggle participant video (for host/co-host)
router.patch(
  '/:meetingId/participants/:userId/video',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId, userId } = req.params;
    const { isVideoOn } = req.body;

    const participant = await meetingService.toggleParticipantVideo(meetingId, userId, isVideoOn);
    res.json({ participant });
  })
);

// ==================== CHAT ====================

// Get chat messages
router.get(
  '/:meetingId/chat',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const { limit, before } = req.query;

    const messages = await meetingService.getChatMessages(
      meetingId,
      limit ? parseInt(limit as string) : 100,
      before ? new Date(before as string) : undefined
    );

    res.json({ messages });
  })
);

// Send chat message
router.post(
  '/:meetingId/chat',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;
    const { message, messageType, fileUrl, fileName, isPrivate } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const chatMessage = await meetingService.sendChatMessage(
      meetingId,
      userId,
      message,
      messageType,
      fileUrl,
      fileName,
      isPrivate
    );

    res.status(201).json({ message: chatMessage });
  })
);

// Pin/unpin chat message
router.patch(
  '/:meetingId/chat/:messageId/pin',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { messageId } = req.params;
    const { isPinned } = req.body;

    const message = await meetingService.pinChatMessage(messageId, isPinned);
    res.json({ message });
  })
);

// ==================== RECORDINGS ====================

// Get meeting recordings
router.get(
  '/:meetingId/recordings',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const recordings = await meetingService.getRecordings(meetingId);
    res.json({ recordings });
  })
);

// Add recording (webhook from Mux)
router.post(
  '/:meetingId/recordings',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const { muxAssetId, muxPlaybackId, title } = req.body;

    const recording = await meetingService.addRecording(meetingId, muxAssetId, muxPlaybackId, title);
    res.status(201).json({ recording });
  })
);

// Update recording status
router.patch(
  '/:meetingId/recordings/:recordingId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recordingId } = req.params;
    const { status, duration, fileSize, downloadUrl, thumbnailUrl } = req.body;

    const recording = await meetingService.updateRecordingStatus(
      recordingId,
      status,
      duration,
      fileSize ? BigInt(fileSize) : undefined,
      downloadUrl,
      thumbnailUrl
    );

    res.json({ recording });
  })
);

// Increment recording views
router.post(
  '/:meetingId/recordings/:recordingId/view',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { recordingId } = req.params;
    const recording = await meetingService.incrementRecordingViews(recordingId);
    res.json({ recording });
  })
);

// ==================== ATTENDANCE ====================

// Get attendance report
router.get(
  '/:meetingId/attendance',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const attendance = await meetingService.getAttendanceReport(meetingId);
    res.json({ attendance });
  })
);

// ==================== FILES ====================

// Get meeting files
router.get(
  '/:meetingId/files',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const files = await meetingService.getMeetingFiles(meetingId);
    res.json({ files });
  })
);

// Add meeting file
router.post(
  '/:meetingId/files',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;
    const { fileName, fileUrl, fileType, fileSize, description, isAgenda } = req.body;

    const file = await meetingService.addMeetingFile(
      meetingId,
      userId,
      fileName,
      fileUrl,
      fileType,
      fileSize ? BigInt(fileSize) : undefined,
      description,
      isAgenda
    );

    res.status(201).json({ file });
  })
);

// Delete meeting file
router.delete(
  '/:meetingId/files/:fileId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { fileId } = req.params;
    await meetingService.deleteMeetingFile(fileId);
    res.json({ success: true, message: 'File deleted' });
  })
);

// ==================== REMINDERS ====================

// Create reminder
router.post(
  '/:meetingId/reminders',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const userId = req.user!.userId;
    const { reminderType, minutesBefore } = req.body;

    const reminder = await meetingService.createReminder(meetingId, userId, reminderType, minutesBefore);
    res.status(201).json({ reminder });
  })
);

// ==================== RECURRING ====================

// Get recurring instances
router.get(
  '/:meetingId/recurring',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { meetingId } = req.params;
    const instances = await meetingService.getRecurringInstances(meetingId);
    res.json({ instances });
  })
);

export default router;
