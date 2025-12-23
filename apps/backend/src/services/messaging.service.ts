import { Conversation, ConversationParticipant, Message, BroadcastMessage, BroadcastReceipt, User, Notification } from '../models';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

// ==================== CONVERSATIONS ====================

interface CreateConversationData {
  createdById: string;
  type: ConversationType;
  name?: string;
  description?: string;
  participantIds: string[];
  avatar?: string;
}

export async function createConversation(data: CreateConversationData) {
  try {
    if (data.type === 'DIRECT' && data.participantIds.length === 1) {
      const existingConversation = await Conversation.findOne({
        type: 'DIRECT',
      }).populate({
        path: 'participants',
        match: {
          userId: { $in: [data.createdById, data.participantIds[0]] },
        },
      });

      if (existingConversation && existingConversation.participants?.length === 2) {
        return existingConversation;
      }
    }

    const conversation = await Conversation.create({
      createdById: data.createdById,
      type: data.type,
      name: data.name,
      description: data.description,
      avatar: data.avatar,
    });

    await ConversationParticipant.insertMany([
      { conversationId: conversation._id, userId: data.createdById, role: 'ADMIN' },
      ...data.participantIds.map((userId) => ({
        conversationId: conversation._id,
        userId,
        role: data.type === 'DIRECT' ? 'MEMBER' : 'MEMBER',
      })),
    ]);

    const populated = await Conversation.findById(conversation._id).populate({
      path: 'participants',
      populate: {
        path: 'userId',
        select: 'firstName lastName email profilePhoto role status',
      },
    });

    logger.info('Conversation created', { conversationId: conversation._id, type: data.type });
    return populated;
  } catch (error) {
    logger.error('Create conversation error:', error);
    throw error;
  }
}

export async function getConversationsForUser(
  userId: string,
  type?: string,
  search?: string,
  page = 1,
  limit = 50
) {
  try {
    const participantConversations = await ConversationParticipant.find({
      userId,
      leftAt: null,
      isBlocked: false,
    }).select('conversationId');

    const conversationIds = participantConversations.map(p => p.conversationId);

    const where: any = {
      _id: { $in: conversationIds },
      isActive: true,
    };

    if (type) {
      where.type = type;
    }

    if (search) {
      where.$or = [
        { name: new RegExp(search, 'i') },
      ];
    }

    const [conversations, total] = await Promise.all([
      Conversation.find(where)
        .sort({ lastMessageAt: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Conversation.countDocuments(where),
    ]);

    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const participants = await ConversationParticipant.find({
          conversationId: conv._id,
          leftAt: null,
        }).populate({
          path: 'userId',
          select: 'firstName lastName email profilePhoto role status lastLogin',
        });

        const lastMessage = await Message.findOne({
          conversationId: conv._id,
          isDeleted: false,
        }).sort({ createdAt: -1 }).select('content messageType senderId createdAt');

        const participant = await ConversationParticipant.findOne({
          conversationId: conv._id,
          userId,
        });

        return {
          ...conv.toObject(),
          participants,
          lastMessage,
          unreadCount: participant?.unreadCount || 0,
          isPinned: participant?.isPinned || false,
          isMuted: participant?.isMuted || false,
        };
      })
    );

    return {
      conversations: conversationsWithDetails,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get conversations error:', error);
    throw error;
  }
}

export async function getConversationById(conversationId: string, userId: string) {
  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const participant = await ConversationParticipant.findOne({
      conversationId,
      userId,
      leftAt: null,
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    const participants = await ConversationParticipant.find({
      conversationId,
      leftAt: null,
    }).populate({
      path: 'userId',
      select: 'firstName lastName email profilePhoto role status lastLogin',
    });

    return {
      ...conversation.toObject(),
      participants,
    };
  } catch (error) {
    logger.error('Get conversation error:', error);
    throw error;
  }
}

// ==================== MESSAGES ====================

interface SendMessageData {
  conversationId: string;
  senderId: string;
  content?: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: bigint;
  attachmentType?: string;
  replyToId?: string;
  isHighPriority?: boolean;
  isEmergency?: boolean;
}

export async function sendMessage(data: SendMessageData) {
  try {
    const participant = await ConversationParticipant.findOne({
      conversationId: data.conversationId,
      userId: data.senderId,
      leftAt: null,
      isBlocked: false,
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    const message = await Message.create({
      conversationId: data.conversationId,
      senderId: data.senderId,
      content: data.content,
      messageType: data.messageType || 'TEXT',
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      attachmentSize: data.attachmentSize,
      attachmentType: data.attachmentType,
      replyToId: data.replyToId,
      isHighPriority: data.isHighPriority || false,
      isEmergency: data.isEmergency || false,
      status: 'SENT',
    });

    await Conversation.findByIdAndUpdate(data.conversationId, {
      lastMessageAt: new Date(),
      lastMessagePreview: data.content?.substring(0, 100) || `[${data.messageType}]`,
    });

    await ConversationParticipant.updateMany(
      {
        conversationId: data.conversationId,
        userId: { $ne: data.senderId },
        leftAt: null,
      },
      { $inc: { unreadCount: 1 } }
    );

    const populated = await Message.findById(message._id)
      .populate({
        path: 'senderId',
        select: 'firstName lastName profilePhoto role',
      })
      .populate({
        path: 'replyToId',
        select: 'content senderId',
        populate: {
          path: 'senderId',
          select: 'firstName lastName',
        },
      });

    logger.info('Message sent', { messageId: message._id, conversationId: data.conversationId });
    return populated;
  } catch (error) {
    logger.error('Send message error:', error);
    throw error;
  }
}

export async function getMessages(
  conversationId: string,
  userId: string,
  page = 1,
  limit = 50,
  before?: Date
) {
  try {
    const participant = await ConversationParticipant.findOne({
      conversationId,
      userId,
      leftAt: null,
    });

    if (!participant) {
      throw new Error('You are not a participant of this conversation');
    }

    const where: any = {
      conversationId,
      isDeleted: false,
    };

    if (before) {
      where.createdAt = { $lt: before };
    }

    const [messages, total] = await Promise.all([
      Message.find(where)
        .populate({
          path: 'senderId',
          select: 'firstName lastName profilePhoto role',
        })
        .populate({
          path: 'replyToId',
          select: 'content senderId',
          populate: {
            path: 'senderId',
            select: 'firstName lastName',
          },
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(where),
    ]);

    return {
      messages: messages.reverse(),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get messages error:', error);
    throw error;
  }
}

export async function markMessagesAsRead(conversationId: string, userId: string) {
  try {
    await ConversationParticipant.updateMany(
      { conversationId, userId },
      { unreadCount: 0, lastReadAt: new Date() }
    );

    await Message.updateMany(
      {
        conversationId,
        senderId: { $ne: userId },
        status: { $ne: 'READ' },
      },
      { status: 'READ' }
    );

    return { success: true };
  } catch (error) {
    logger.error('Mark messages as read error:', error);
    throw error;
  }
}

export async function deleteMessage(
  messageId: string,
  userId: string,
  forAll = false
) {
  try {
    const message = await Message.findFirst({
      where: { id: messageId },
      include: { conversation: true },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user can delete for all
    if (forAll) {
      const isAdmin = await prisma.conversation_participants.findFirst({
        where: {
          conversationId: message.conversationId,
          userId,
          role: { in: ['ADMIN', 'MODERATOR'] },
        },
      });

      if (!isAdmin && message.senderId !== userId) {
        throw new Error('You cannot delete this message for everyone');
      }
    }

    await prisma.messages.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedForAll: forAll,
        content: forAll ? 'This message was deleted' : message.content,
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Delete message error:', error);
    throw error;
  }
}

export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string
) {
  try {
    const message = await prisma.messages.findFirst({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    const reactions = (message.reactions as Record<string, string[]>) || {};
    
    // Toggle reaction
    if (reactions[emoji]?.includes(userId)) {
      reactions[emoji] = reactions[emoji].filter((id) => id !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
    } else {
      if (!reactions[emoji]) {
        reactions[emoji] = [];
      }
      reactions[emoji].push(userId);
    }

    await prisma.messages.update({
      where: { id: messageId },
      data: { reactions },
    });

    return { success: true, reactions };
  } catch (error) {
    logger.error('React to message error:', error);
    throw error;
  }
}

export async function pinMessage(messageId: string, userId: string, isPinned: boolean) {
  try {
    const message = await prisma.messages.findFirst({
      where: { id: messageId },
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user has permission
    const participant = await prisma.conversation_participants.findFirst({
      where: {
        conversationId: message.conversationId,
        userId,
        role: { in: ['ADMIN', 'MODERATOR'] },
      },
    });

    if (!participant) {
      throw new Error('You do not have permission to pin messages');
    }

    await prisma.messages.update({
      where: { id: messageId },
      data: { isPinned },
    });

    return { success: true };
  } catch (error) {
    logger.error('Pin message error:', error);
    throw error;
  }
}

// ==================== BROADCAST ====================

interface SendBroadcastData {
  senderId: string;
  title: string;
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  targetRoles: string[];
  targetUserIds?: string[];
  targetRegions?: string[];
  isEmergency?: boolean;
  expiresAt?: Date;
}

export async function sendBroadcast(data: SendBroadcastData) {
  try {
    const targetUsers = await User.find({
      status: 'ACTIVE',
      $or: [
        { role: { $in: data.targetRoles } },
        { _id: { $in: data.targetUserIds || [] } },
      ],
    }).select('_id');

    const broadcast = await BroadcastMessage.create({
      senderId: data.senderId,
      title: data.title,
      content: data.content,
      messageType: data.messageType || 'TEXT',
      attachmentUrl: data.attachmentUrl,
      attachmentName: data.attachmentName,
      targetRoles: data.targetRoles,
      targetUserIds: data.targetUserIds || [],
      targetRegions: data.targetRegions || [],
      isEmergency: data.isEmergency || false,
      expiresAt: data.expiresAt,
      sentCount: targetUsers.length,
    });

    await BroadcastReceipt.insertMany(
      targetUsers.map((user) => ({
        broadcastId: broadcast._id,
        userId: user._id,
      }))
    );

    await Promise.all(
      targetUsers.map((user) =>
        Notification.create({
          senderId: data.senderId,
          receiverId: user._id.toString(),
          type: data.isEmergency ? 'EMERGENCY_BROADCAST' : 'BROADCAST',
          subject: data.title,
          message: data.content.substring(0, 200),
          entityType: 'broadcast',
          entityId: broadcast._id.toString(),
          actionUrl: `/messages/broadcasts/${broadcast._id}`,
          sentAt: new Date(),
        })
      )
    );

    const populated = await BroadcastMessage.findById(broadcast._id).populate({
      path: 'senderId',
      select: 'firstName lastName profilePhoto role',
    });

    logger.info('Broadcast sent', {
      broadcastId: broadcast._id,
      recipientCount: targetUsers.length,
      isEmergency: data.isEmergency,
    });

    return populated;
  } catch (error) {
    logger.error('Send broadcast error:', error);
    throw error;
  }
}

export async function getBroadcastsForUser(userId: string, page = 1, limit = 20) {
  try {
    const [broadcasts, total] = await Promise.all([
      prisma.broadcast_messages.findMany({
        where: {
          isActive: true,
          receipts: {
            some: { userId },
          },
          OR: [
            { expiresAt: null },
            { expiresAt: { gt: new Date() } },
          ],
        },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
              role: true,
            },
          },
          receipts: {
            where: { userId },
            select: {
              isRead: true,
              readAt: true,
            },
          },
        },
        orderBy: [
          { isEmergency: 'desc' },
          { createdAt: 'desc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.broadcast_messages.count({
        where: {
          isActive: true,
          receipts: {
            some: { userId },
          },
        },
      }),
    ]);

    return {
      broadcasts: broadcasts.map((b) => ({
        ...b,
        isRead: b.receipts[0]?.isRead || false,
        readAt: b.receipts[0]?.readAt,
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Get broadcasts error:', error);
    throw error;
  }
}

export async function markBroadcastAsRead(broadcastId: string, userId: string) {
  try {
    await prisma.broadcast_receipts.updateMany({
      where: {
        broadcastId,
        userId,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    // Increment read count
    await prisma.broadcast_messages.update({
      where: { id: broadcastId },
      data: {
        readCount: { increment: 1 },
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Mark broadcast as read error:', error);
    throw error;
  }
}

// ==================== CONTACTS ====================

export async function getContacts(userId: string, role?: string, search?: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Define who can message whom based on role hierarchy
    const allowedRoles = getMessageableRoles(user.role);

    const where: any = {
      id: { not: userId },
      status: 'ACTIVE',
      role: { in: allowedRoles },
    };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        profilePhoto: true,
        role: true,
        status: true,
        lastLogin: true,
      },
      orderBy: [{ role: 'asc' }, { firstName: 'asc' }],
    });

    // Group by role
    const groupedContacts = contacts.reduce((acc, contact) => {
      if (!acc[contact.role]) {
        acc[contact.role] = [];
      }
      acc[contact.role].push(contact);
      return acc;
    }, {} as Record<string, typeof contacts>);

    return {
      contacts,
      groupedContacts,
      totalCount: contacts.length,
    };
  } catch (error) {
    logger.error('Get contacts error:', error);
    throw error;
  }
}

function getMessageableRoles(userRole: string): string[] {
  switch (userRole) {
    case 'DIRECTOR':
      return ['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'OPERATOR', 'SECRETARY'];
    case 'MANAGER':
      return ['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'OPERATOR'];
    case 'GENERAL_SUPERVISOR':
      return ['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR'];
    case 'SUPERVISOR':
      return ['MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'OPERATOR'];
    case 'OPERATOR':
      return ['SUPERVISOR', 'GENERAL_SUPERVISOR'];
    case 'SECRETARY':
      return ['DIRECTOR', 'MANAGER'];
    default:
      return [];
  }
}

// ==================== GROUP MANAGEMENT ====================

export async function createGroup(
  createdById: string,
  name: string,
  description: string,
  participantIds: string[],
  avatar?: string
) {
  return createConversation({
    createdById,
    type: 'GROUP',
    name,
    description,
    participantIds,
    avatar,
  });
}

export async function addParticipantToGroup(
  conversationId: string,
  adminUserId: string,
  userId: string
) {
  try {
    // Verify admin permissions
    const admin = await prisma.conversation_participants.findFirst({
      where: {
        conversationId,
        userId: adminUserId,
        role: { in: ['ADMIN', 'MODERATOR'] },
        leftAt: null,
      },
    });

    if (!admin) {
      throw new Error('You do not have permission to add participants');
    }

    // Check if user is already a participant
    const existing = await prisma.conversation_participants.findFirst({
      where: {
        conversationId,
        userId,
        leftAt: null,
      },
    });

    if (existing) {
      throw new Error('User is already a participant');
    }

    const participant = await prisma.conversation_participants.create({
      data: {
        conversationId,
        userId,
        role: 'MEMBER',
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true,
            role: true,
          },
        },
      },
    });

    return participant;
  } catch (error) {
    logger.error('Add participant error:', error);
    throw error;
  }
}

export async function removeParticipantFromGroup(
  conversationId: string,
  adminUserId: string,
  userId: string
) {
  try {
    // Verify admin permissions
    const admin = await prisma.conversation_participants.findFirst({
      where: {
        conversationId,
        userId: adminUserId,
        role: 'ADMIN',
        leftAt: null,
      },
    });

    if (!admin) {
      throw new Error('You do not have permission to remove participants');
    }

    await prisma.conversation_participants.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        leftAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Remove participant error:', error);
    throw error;
  }
}

export async function leaveGroup(conversationId: string, userId: string) {
  try {
    await prisma.conversation_participants.updateMany({
      where: {
        conversationId,
        userId,
      },
      data: {
        leftAt: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    logger.error('Leave group error:', error);
    throw error;
  }
}

// ==================== UNREAD COUNTS ====================

export async function getUnreadCounts(userId: string) {
  try {
    const [conversationUnread, broadcastUnread] = await Promise.all([
      prisma.conversation_participants.aggregate({
        where: {
          userId,
          leftAt: null,
        },
        _sum: {
          unreadCount: true,
        },
      }),
      prisma.broadcast_receipts.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    return {
      conversations: conversationUnread._sum.unreadCount || 0,
      broadcasts: broadcastUnread,
      total: (conversationUnread._sum.unreadCount || 0) + broadcastUnread,
    };
  } catch (error) {
    logger.error('Get unread counts error:', error);
    throw error;
  }
}

// ==================== SEARCH ====================

export async function searchMessages(
  userId: string,
  query: string,
  conversationId?: string,
  page = 1,
  limit = 20
) {
  try {
    const where: any = {
      isDeleted: false,
      content: { contains: query, mode: 'insensitive' },
      conversation: {
        participants: {
          some: {
            userId,
            leftAt: null,
          },
        },
      },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    const [messages, total] = await Promise.all([
      prisma.messages.findMany({
        where,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePhoto: true,
            },
          },
          conversation: {
            select: {
              id: true,
              name: true,
              type: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.messages.count({ where }),
    ]);

    return {
      messages,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    logger.error('Search messages error:', error);
    throw error;
  }
}
