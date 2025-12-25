import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as messagingService from '../services/messaging.service';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'messages');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `msg-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', // Images
      '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', // Documents
      '.mp4', '.mov', '.avi', '.mkv', // Videos
      '.mp3', '.wav', '.ogg', // Audio
      '.zip', '.rar' // Archives
    ];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: images, documents, videos, audio, and archives'));
    }
  }
});

// All routes require authentication
router.use(authenticate);

// ==================== CONVERSATIONS ====================

// Get all conversations for current user
router.get(
  '/conversations',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { type, search, page, limit } = req.query;

    const result = await messagingService.getConversationsForUser(
      userId,
      type as any,
      search as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50
    );

    res.json(result);
  })
);

// Get single conversation
router.get(
  '/conversations/:conversationId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;

    const conversation = await messagingService.getConversationById(conversationId, userId);
    res.json({ conversation });
  })
);

// Create conversation (direct message or group)
router.post(
  '/conversations',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { type, name, description, participantIds, avatar } = req.body;

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    const conversation = await messagingService.createConversation({
      createdById: userId,
      type: type || 'DIRECT',
      name,
      description,
      participantIds,
      avatar,
    });

    res.status(201).json({ conversation });
  })
);

// Create group
router.post(
  '/groups',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { name, description, participantIds, avatar } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Group name is required' });
    }

    if (!participantIds || participantIds.length === 0) {
      return res.status(400).json({ error: 'At least one participant is required' });
    }

    const group = await messagingService.createGroup(
      userId,
      name,
      description,
      participantIds,
      avatar
    );

    res.status(201).json({ group });
  })
);

// Add participant to group
router.post(
  '/groups/:conversationId/participants',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'Participant ID is required' });
    }

    const participant = await messagingService.addParticipantToGroup(
      conversationId,
      userId,
      participantId
    );

    res.status(201).json({ participant });
  })
);

// ==================== FILE UPLOAD ====================

// Upload file for messaging
router.post(
  '/upload',
  upload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileUrl = `/uploads/messages/${req.file.filename}`;
    
    logger.info('File uploaded for messaging', {
      userId: req.user!.userId,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });

    res.json({
      success: true,
      url: fileUrl,
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    });
  })
);

// ==================== CALL SIGNALING ====================

interface CallSignal {
  type: 'call-initiated' | 'call-ringing' | 'call-accepted' | 'call-rejected' | 'call-ended' | 'call-cancelled';
  callId: string;
  fromUserId: string;
  toUserId: string;
  conversationId: string;
  callType: 'voice' | 'video';
  roomUrl?: string;
  timestamp: number;
}

// In-memory storage for call signals (in production, use Redis or database)
const callSignals: CallSignal[] = [];

// Send call signal
router.post(
  '/call-signal',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const signal: CallSignal = req.body;
    
    // Add timestamp if not provided
    if (!signal.timestamp) {
      signal.timestamp = Date.now();
    }
    
    // Store signal
    callSignals.push(signal);
    
    // Clean up old signals (older than 5 minutes)
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const validSignals = callSignals.filter(s => s.timestamp > fiveMinutesAgo);
    callSignals.length = 0;
    callSignals.push(...validSignals);
    
    logger.info('Call signal received', {
      type: signal.type,
      callId: signal.callId,
      from: signal.fromUserId,
      to: signal.toUserId,
      callType: signal.callType
    });
    
    res.json({ success: true });
  })
);

// Get call signals for user
router.get(
  '/call-signals',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const since = req.query.since ? parseInt(req.query.since as string) : Date.now() - 10000;
    
    // Get signals for this user that are newer than 'since'
    const userSignals = callSignals.filter(
      signal => signal.toUserId === userId && signal.timestamp > since
    );
    
    res.json({ signals: userSignals });
  })
);

// Remove participant from group
router.delete(
  '/groups/:conversationId/participants/:participantId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId, participantId } = req.params;

    await messagingService.removeParticipantFromGroup(conversationId, userId, participantId);
    res.json({ success: true, message: 'Participant removed' });
  })
);

// Leave group
router.post(
  '/groups/:conversationId/leave',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;

    await messagingService.leaveGroup(conversationId, userId);
    res.json({ success: true, message: 'You have left the group' });
  })
);

// ==================== MESSAGES ====================

// Get messages in conversation
router.get(
  '/conversations/:conversationId/messages',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const { page, limit, before } = req.query;

    const result = await messagingService.getMessages(
      conversationId,
      userId,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 50,
      before ? new Date(before as string) : undefined
    );

    res.json(result);
  })
);

// Send message
router.post(
  '/conversations/:conversationId/messages',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;
    const {
      content,
      messageType,
      attachmentUrl,
      attachmentName,
      attachmentSize,
      attachmentType,
      replyToId,
      isHighPriority,
      isEmergency,
    } = req.body;

    if (!content && !attachmentUrl) {
      return res.status(400).json({ error: 'Message content or attachment is required' });
    }

    const message = await messagingService.sendMessage({
      conversationId,
      senderId: userId,
      content,
      messageType: messageType || 'TEXT',
      attachmentUrl,
      attachmentName,
      attachmentSize: attachmentSize ? BigInt(attachmentSize) : undefined,
      attachmentType,
      replyToId,
      isHighPriority,
      isEmergency,
    });

    res.status(201).json({ message });
  })
);

// Mark messages as read
router.post(
  '/conversations/:conversationId/read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { conversationId } = req.params;

    await messagingService.markMessagesAsRead(conversationId, userId);
    res.json({ success: true });
  })
);

// Delete message
router.delete(
  '/messages/:messageId',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { forAll } = req.query;

    await messagingService.deleteMessage(messageId, userId, forAll === 'true');
    res.json({ success: true, message: 'Message deleted' });
  })
);

// React to message
router.post(
  '/messages/:messageId/react',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { emoji } = req.body;

    if (!emoji) {
      return res.status(400).json({ error: 'Emoji is required' });
    }

    const result = await messagingService.reactToMessage(messageId, userId, emoji);
    res.json(result);
  })
);

// Pin message
router.post(
  '/messages/:messageId/pin',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { messageId } = req.params;
    const { isPinned } = req.body;

    await messagingService.pinMessage(messageId, userId, isPinned !== false);
    res.json({ success: true });
  })
);

// ==================== BROADCASTS ====================

// Get broadcasts for current user
router.get(
  '/broadcasts',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { page, limit } = req.query;

    const result = await messagingService.getBroadcastsForUser(
      userId,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  })
);

// Send broadcast (Director, Manager, General Supervisor only)
router.post(
  '/broadcasts',
  requireRole(['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR']),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const {
      title,
      content,
      messageType,
      attachmentUrl,
      attachmentName,
      targetRoles,
      targetUserIds,
      targetRegions,
      isEmergency,
      expiresAt,
    } = req.body;

    if (!title || !content) {
      return res.status(400).json({ error: 'Title and content are required' });
    }

    if (!targetRoles || targetRoles.length === 0) {
      return res.status(400).json({ error: 'At least one target role is required' });
    }

    const broadcast = await messagingService.sendBroadcast({
      senderId: userId,
      title,
      content,
      messageType,
      attachmentUrl,
      attachmentName,
      targetRoles,
      targetUserIds,
      targetRegions,
      isEmergency,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined,
    });

    res.status(201).json({ broadcast });
  })
);

// Mark broadcast as read
router.post(
  '/broadcasts/:broadcastId/read',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { broadcastId } = req.params;

    await messagingService.markBroadcastAsRead(broadcastId, userId);
    res.json({ success: true });
  })
);

// ==================== CONTACTS ====================

// Get contacts
router.get(
  '/contacts',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { role, search } = req.query;

    const result = await messagingService.getContacts(
      userId,
      role as string,
      search as string
    );

    res.json(result);
  })
);

// ==================== SEARCH ====================

// Search messages
router.get(
  '/search',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const { query, conversationId, page, limit } = req.query;

    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const result = await messagingService.searchMessages(
      userId,
      query as string,
      conversationId as string,
      page ? parseInt(page as string) : 1,
      limit ? parseInt(limit as string) : 20
    );

    res.json(result);
  })
);

// ==================== UNREAD COUNTS ====================

// Get unread counts
router.get(
  '/unread',
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const userId = req.user!.userId;
    const counts = await messagingService.getUnreadCounts(userId);
    res.json(counts);
  })
);

export default router;
