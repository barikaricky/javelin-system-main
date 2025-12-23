import { Router, Response } from 'express';
import { authenticate, AuthRequest, requireRole } from '../middlewares/auth.middleware';
import { asyncHandler } from '../middlewares/error.middleware';
import * as messagingService from '../services/messaging.service';
import { logger } from '../utils/logger';

const router = Router();

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
