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
      // Find existing direct conversation with these two users
      const allUserIds = [data.createdById, data.participantIds[0]];
      const existingParticipants = await ConversationParticipant.find({
        userId: { $in: allUserIds },
        leftAt: null,
      });

      // Group by conversationId and check if any conversation has exactly these 2 users
      const conversationCounts = new Map<string, number>();
      existingParticipants.forEach(p => {
        const convId = p.conversationId.toString();
        conversationCounts.set(convId, (conversationCounts.get(convId) || 0) + 1);
      });

      // Find a conversation with exactly 2 participants (both users)
      for (const [convId, count] of conversationCounts) {
        if (count === 2) {
          // Verify it's a DIRECT type conversation
          const existingConversation = await Conversation.findById(convId);
          if (existingConversation && existingConversation.type === 'DIRECT') {
            // Return the existing conversation with participants
            const participants = await ConversationParticipant.find({
              conversationId: convId,
              leftAt: null,
            }).populate({
              path: 'userId',
              select: 'firstName lastName email profilePhoto role status',
            });
            
            const convObj = existingConversation.toJSON();
            return {
              ...convObj,
              id: existingConversation._id.toString(),
              participants: participants.map(p => {
                const userObj = p.userId as any;
                return {
                  id: p._id.toString(),
                  conversationId: p.conversationId.toString(),
                  userId: userObj?._id?.toString() || p.userId?.toString(),
                  role: p.role,
                  joinedAt: p.joinedAt,
                  isMuted: p.isMuted,
                  isPinned: p.isPinned,
                  isBlocked: p.isBlocked,
                  unreadCount: p.unreadCount,
                  user: userObj?._id ? {
                    id: userObj._id.toString(),
                    firstName: userObj.firstName,
                    lastName: userObj.lastName,
                    email: userObj.email,
                    profilePhoto: userObj.profilePhoto,
                    role: userObj.role,
                    status: userObj.status,
                  } : null,
                };
              }),
            };
          }
        }
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

    // Manually fetch participants instead of populating
    const participants = await ConversationParticipant.find({
      conversationId: conversation._id,
      leftAt: null,
    }).populate({
      path: 'userId',
      select: 'firstName lastName email profilePhoto role status',
    });

    logger.info('Conversation created', { conversationId: conversation._id, type: data.type });
    
    const convObj = conversation.toJSON();
    return {
      ...convObj,
      id: conversation._id.toString(),
      participants: participants.map(p => {
        const userObj = p.userId as any;
        return {
          id: p._id.toString(),
          conversationId: p.conversationId.toString(),
          userId: userObj?._id?.toString() || p.userId?.toString(),
          role: p.role,
          joinedAt: p.joinedAt,
          isMuted: p.isMuted,
          isPinned: p.isPinned,
          isBlocked: p.isBlocked,
          unreadCount: p.unreadCount,
          user: userObj?._id ? {
            id: userObj._id.toString(),
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            email: userObj.email,
            profilePhoto: userObj.profilePhoto,
            role: userObj.role,
            status: userObj.status,
          } : null,
        };
      }),
    };
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

        // Ensure we return id field along with _id
        const convObj = conv.toJSON();
        return {
          ...convObj,
          id: conv._id.toString(), // Add id field for frontend compatibility
          participants: participants.map(p => {
            const pObj = p.toJSON();
            // When populated, userId is the full user object, not just the ID
            const userObj = p.userId as any;
            return {
              ...pObj,
              id: p._id.toString(),
              conversationId: p.conversationId.toString(),
              userId: userObj?._id?.toString() || p.userId?.toString(),
              user: userObj?._id ? {
                id: userObj._id.toString(),
                firstName: userObj.firstName,
                lastName: userObj.lastName,
                email: userObj.email,
                profilePhoto: userObj.profilePhoto,
                role: userObj.role,
                status: userObj.status,
                lastLogin: userObj.lastLogin,
              } : null,
            };
          }),
          lastMessage: lastMessage ? {
            ...lastMessage.toJSON(),
            id: lastMessage._id.toString(),
          } : null,
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

    const convObj = conversation.toJSON();
    return {
      ...convObj,
      id: conversation._id.toString(),
      participants: participants.map(p => {
        const userObj = p.userId as any;
        return {
          id: p._id.toString(),
          conversationId: p.conversationId.toString(),
          userId: userObj?._id?.toString() || p.userId?.toString(),
          role: p.role,
          joinedAt: p.joinedAt,
          isMuted: p.isMuted,
          isPinned: p.isPinned,
          isBlocked: p.isBlocked,
          unreadCount: p.unreadCount,
          user: userObj?._id ? {
            id: userObj._id.toString(),
            firstName: userObj.firstName,
            lastName: userObj.lastName,
            email: userObj.email,
            profilePhoto: userObj.profilePhoto,
            role: userObj.role,
            status: userObj.status,
            lastLogin: userObj.lastLogin,
          } : null,
        };
      }),
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
    
    // Properly serialize the message with id fields
    if (!populated) {
      throw new Error('Failed to retrieve sent message');
    }
    
    // Safely handle populated fields
    const senderObj = populated.senderId as any;
    const replyToObj = populated.replyToId as any;
    
    return {
      id: populated._id.toString(),
      conversationId: populated.conversationId.toString(),
      content: populated.content,
      messageType: populated.messageType,
      status: populated.status,
      attachmentUrl: populated.attachmentUrl,
      attachmentName: populated.attachmentName,
      attachmentSize: populated.attachmentSize,
      attachmentType: populated.attachmentType,
      thumbnailUrl: populated.thumbnailUrl,
      isPinned: populated.isPinned,
      isEdited: populated.isEdited,
      isDeleted: populated.isDeleted,
      isHighPriority: populated.isHighPriority,
      isEmergency: populated.isEmergency,
      reactions: populated.reactions,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
      senderId: senderObj?._id?.toString() || populated.senderId?.toString(),
      sender: senderObj?._id ? {
        id: senderObj._id.toString(),
        firstName: senderObj.firstName,
        lastName: senderObj.lastName,
        profilePhoto: senderObj.profilePhoto,
        role: senderObj.role,
      } : null,
      replyToId: replyToObj?._id?.toString() || populated.replyToId?.toString() || null,
      replyTo: replyToObj?._id ? {
        id: replyToObj._id.toString(),
        content: replyToObj.content,
        senderId: replyToObj.senderId?._id?.toString() || replyToObj.senderId?.toString(),
        sender: replyToObj.senderId?._id ? {
          id: replyToObj.senderId._id.toString(),
          firstName: replyToObj.senderId.firstName,
          lastName: replyToObj.senderId.lastName,
        } : null,
      } : null,
    };
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
    // Validate conversationId
    if (!conversationId || conversationId === 'undefined') {
      throw new Error('Invalid conversation ID');
    }

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
      messages: messages.reverse().map(m => {
        // Safely handle populated senderId field
        const senderObj = m.senderId as any;
        const replyToObj = m.replyToId as any;
        
        return {
          id: m._id.toString(),
          conversationId: m.conversationId.toString(),
          content: m.content,
          messageType: m.messageType,
          status: m.status,
          attachmentUrl: m.attachmentUrl,
          attachmentName: m.attachmentName,
          attachmentSize: m.attachmentSize,
          attachmentType: m.attachmentType,
          thumbnailUrl: m.thumbnailUrl,
          isPinned: m.isPinned,
          isEdited: m.isEdited,
          isDeleted: m.isDeleted,
          isHighPriority: m.isHighPriority,
          isEmergency: m.isEmergency,
          reactions: m.reactions,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          senderId: senderObj?._id?.toString() || m.senderId?.toString(),
          sender: senderObj?._id ? {
            id: senderObj._id.toString(),
            firstName: senderObj.firstName,
            lastName: senderObj.lastName,
            profilePhoto: senderObj.profilePhoto,
            role: senderObj.role,
          } : null,
          replyToId: replyToObj?._id?.toString() || m.replyToId?.toString() || null,
          replyTo: replyToObj?._id ? {
            id: replyToObj._id.toString(),
            content: replyToObj.content,
            senderId: replyToObj.senderId?._id?.toString() || replyToObj.senderId?.toString(),
            sender: replyToObj.senderId?._id ? {
              id: replyToObj.senderId._id.toString(),
              firstName: replyToObj.senderId.firstName,
              lastName: replyToObj.senderId.lastName,
            } : null,
          } : null,
        };
      }),
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
    const message = await Message.findById(messageId).populate('conversation');

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

export async function reactToMessage(
  messageId: string,
  userId: string,
  emoji: string
) {
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

export async function pinMessage(messageId: string, userId: string, isPinned: boolean) {
  try {
    const message = await Message.findById(messageId);

    if (!message) {
      throw new Error('Message not found');
    }

    const participant = await ConversationParticipant.findOne({
      conversationId: message.conversationId,
      userId,
      role: { $in: ['ADMIN', 'MODERATOR'] },
    });

    if (!participant) {
      throw new Error('You do not have permission to pin messages');
    }

    await Message.findByIdAndUpdate(messageId, { isPinned });

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

    if (!populated) {
      throw new Error('Failed to retrieve broadcast');
    }

    const senderObj = populated.senderId as any;
    return {
      id: populated._id.toString(),
      title: populated.title,
      content: populated.content,
      messageType: populated.messageType,
      attachmentUrl: populated.attachmentUrl,
      attachmentName: populated.attachmentName,
      targetRoles: populated.targetRoles,
      isEmergency: populated.isEmergency,
      expiresAt: populated.expiresAt,
      sentCount: populated.sentCount,
      readCount: populated.readCount,
      createdAt: populated.createdAt,
      updatedAt: populated.updatedAt,
      senderId: senderObj?._id?.toString() || populated.senderId?.toString(),
      sender: senderObj?._id ? {
        id: senderObj._id.toString(),
        firstName: senderObj.firstName,
        lastName: senderObj.lastName,
        profilePhoto: senderObj.profilePhoto,
        role: senderObj.role,
      } : null,
    };
  } catch (error) {
    logger.error('Send broadcast error:', error);
    throw error;
  }
}

export async function getBroadcastsForUser(userId: string, page = 1, limit = 20) {
  try {
    const receipts = await BroadcastReceipt.find({ userId }).select('broadcastId isRead readAt');
    const broadcastIds = receipts.map(r => r.broadcastId);

    const where: any = {
      _id: { $in: broadcastIds },
      isActive: true,
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } },
      ],
    };

    const [broadcasts, total] = await Promise.all([
      BroadcastMessage.find(where)
        .populate({
          path: 'senderId',
          select: 'firstName lastName profilePhoto role',
        })
        .sort({ isEmergency: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      BroadcastMessage.countDocuments(where),
    ]);

    const broadcastsWithReceipts = broadcasts.map((broadcast) => {
      const receipt = receipts.find(r => r.broadcastId.toString() === broadcast._id.toString());
      const senderObj = broadcast.senderId as any;
      return {
        id: broadcast._id.toString(),
        title: broadcast.title,
        content: broadcast.content,
        messageType: broadcast.messageType,
        attachmentUrl: broadcast.attachmentUrl,
        attachmentName: broadcast.attachmentName,
        targetRoles: broadcast.targetRoles,
        isEmergency: broadcast.isEmergency,
        expiresAt: broadcast.expiresAt,
        sentCount: broadcast.sentCount,
        readCount: broadcast.readCount,
        createdAt: broadcast.createdAt,
        updatedAt: broadcast.updatedAt,
        senderId: senderObj?._id?.toString() || broadcast.senderId?.toString(),
        sender: senderObj?._id ? {
          id: senderObj._id.toString(),
          firstName: senderObj.firstName,
          lastName: senderObj.lastName,
          profilePhoto: senderObj.profilePhoto,
          role: senderObj.role,
        } : null,
        isRead: receipt?.isRead || false,
        readAt: receipt?.readAt,
      };
    });

    return {
      broadcasts: broadcastsWithReceipts,
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
    await BroadcastReceipt.updateMany(
      { broadcastId, userId },
      { isRead: true, readAt: new Date() }
    );

    await BroadcastMessage.findByIdAndUpdate(broadcastId, {
      $inc: { readCount: 1 },
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
    const user = await User.findById(userId).select('role');

    if (!user) {
      throw new Error('User not found');
    }

    const allowedRoles = getMessageableRoles(user.role);

    const where: any = {
      _id: { $ne: userId },
      status: 'ACTIVE',
      role: { $in: allowedRoles },
    };

    if (role) {
      where.role = role;
    }

    if (search) {
      where.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }

    const contacts = await User.find(where)
      .select('firstName lastName email phone profilePhoto role status lastLogin')
      .sort({ role: 1, firstName: 1 });

    // Serialize contacts with id field
    const serializedContacts = contacts.map(c => {
      const cObj = c.toJSON();
      return {
        ...cObj,
        id: c._id.toString(),
      };
    });

    const groupedContacts = serializedContacts.reduce((acc, contact) => {
      if (!acc[contact.role]) {
        acc[contact.role] = [];
      }
      acc[contact.role].push(contact);
      return acc;
    }, {} as Record<string, typeof serializedContacts>);

    return {
      contacts: serializedContacts,
      groupedContacts,
      totalCount: serializedContacts.length,
    };
  } catch (error) {
    logger.error('Get contacts error:', error);
    throw error;
  }
}

function getMessageableRoles(userRole: string): string[] {
  switch (userRole) {
    case 'DIRECTOR':
      return ['DIRECTOR', 'MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR', 'SECRETARY'];
    case 'MANAGER':
      return ['MANAGER', 'GENERAL_SUPERVISOR'];
    case 'GENERAL_SUPERVISOR':
      return ['MANAGER', 'GENERAL_SUPERVISOR', 'SUPERVISOR'];
    case 'SUPERVISOR':
      return ['GENERAL_SUPERVISOR'];
    case 'SECRETARY':
      return ['DIRECTOR', 'MANAGER'];
    case 'OPERATOR':
      return [];
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
    const admin = await ConversationParticipant.findOne({
      conversationId,
      userId: adminUserId,
      role: { $in: ['ADMIN', 'MODERATOR'] },
      leftAt: null,
    });

    if (!admin) {
      throw new Error('You do not have permission to add participants');
    }

    const existing = await ConversationParticipant.findOne({
      conversationId,
      userId,
      leftAt: null,
    });

    if (existing) {
      throw new Error('User is already a participant');
    }

    const participant = await ConversationParticipant.create({
      conversationId,
      userId,
      role: 'MEMBER',
    });

    const populatedParticipant = await ConversationParticipant.findById(participant._id).populate({
      path: 'userId',
      select: 'firstName lastName profilePhoto role',
    });

    return populatedParticipant;
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
    const admin = await ConversationParticipant.findOne({
      conversationId,
      userId: adminUserId,
      role: 'ADMIN',
      leftAt: null,
    });

    if (!admin) {
      throw new Error('You do not have permission to remove participants');
    }

    await ConversationParticipant.updateMany(
      { conversationId, userId },
      { leftAt: new Date() }
    );

    return { success: true };
  } catch (error) {
    logger.error('Remove participant error:', error);
    throw error;
  }
}

export async function leaveGroup(conversationId: string, userId: string) {
  try {
    await ConversationParticipant.updateMany(
      { conversationId, userId },
      { leftAt: new Date() }
    );

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
      ConversationParticipant.aggregate([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(userId),
            leftAt: null,
          },
        },
        {
          $group: {
            _id: null,
            totalUnread: { $sum: '$unreadCount' },
          },
        },
      ]),
      BroadcastReceipt.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        isRead: false,
      }),
    ]);

    const conversationTotal = conversationUnread[0]?.totalUnread || 0;

    return {
      conversations: conversationTotal,
      broadcasts: broadcastUnread,
      total: conversationTotal + broadcastUnread,
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
    const participantConversations = await ConversationParticipant.find({
      userId,
      leftAt: null,
    }).select('conversationId');

    const conversationIds = participantConversations.map(p => p.conversationId);

    const where: any = {
      isDeleted: false,
      content: new RegExp(query, 'i'),
      conversationId: { $in: conversationIds },
    };

    if (conversationId) {
      where.conversationId = conversationId;
    }

    const [messages, total] = await Promise.all([
      Message.find(where)
        .populate({
          path: 'senderId',
          select: 'firstName lastName profilePhoto',
        })
        .populate({
          path: 'conversationId',
          select: 'name type',
        })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Message.countDocuments(where),
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

// ==================== TYPES ====================

type ConversationType = 'DIRECT' | 'GROUP' | 'CHANNEL';
type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'AUDIO' | 'VIDEO' | 'LOCATION' | 'CONTACT' | 'STICKER';
