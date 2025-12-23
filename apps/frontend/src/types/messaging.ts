// Messaging Types and Interfaces

export type ConversationType = 'DIRECT' | 'GROUP' | 'BROADCAST' | 'EMERGENCY';

export type MessageType = 'TEXT' | 'IMAGE' | 'DOCUMENT' | 'AUDIO' | 'VIDEO' | 'LOCATION' | 'VOICE_NOTE' | 'SYSTEM';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export interface MessageUser {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  profilePhoto?: string | null;
  role: string;
  status?: string;
  lastLogin?: string | null;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: string;
  joinedAt: string;
  leftAt?: string | null;
  isMuted: boolean;
  isPinned: boolean;
  isBlocked: boolean;
  unreadCount: number;
  lastReadAt?: string | null;
  user: MessageUser;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content?: string | null;
  messageType: MessageType;
  status: MessageStatus;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentSize?: number | null;
  attachmentType?: string | null;
  thumbnailUrl?: string | null;
  replyToId?: string | null;
  isPinned: boolean;
  isEdited: boolean;
  isDeleted: boolean;
  isHighPriority: boolean;
  isEmergency: boolean;
  reactions?: Record<string, string[]> | null;
  createdAt: string;
  updatedAt: string;
  sender: MessageUser;
  replyTo?: {
    id: string;
    content?: string | null;
    senderId: string;
    sender: {
      firstName: string;
      lastName: string;
    };
  } | null;
}

export interface Conversation {
  id: string;
  name?: string | null;
  type: ConversationType;
  description?: string | null;
  avatar?: string | null;
  createdById: string;
  isActive: boolean;
  isPinned: boolean;
  lastMessageAt?: string | null;
  lastMessagePreview?: string | null;
  createdAt: string;
  updatedAt: string;
  participants: ConversationParticipant[];
  messages?: {
    id: string;
    content?: string | null;
    messageType: MessageType;
    senderId: string;
    createdAt: string;
    isDeleted: boolean;
  }[];
  unreadCount: number;
  isMuted: boolean;
  createdBy?: MessageUser;
}

export interface BroadcastMessage {
  id: string;
  senderId: string;
  title: string;
  content: string;
  messageType: MessageType;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  targetRoles: string[];
  targetUserIds: string[];
  targetRegions: string[];
  isEmergency: boolean;
  isActive: boolean;
  expiresAt?: string | null;
  sentCount: number;
  readCount: number;
  createdAt: string;
  updatedAt: string;
  sender: MessageUser;
  isRead: boolean;
  readAt?: string | null;
}

// Input types
export interface CreateConversationInput {
  type?: ConversationType;
  name?: string;
  description?: string;
  participantIds: string[];
  avatar?: string;
}

export interface CreateGroupInput {
  name: string;
  description?: string;
  participantIds: string[];
  avatar?: string;
}

export interface SendMessageInput {
  content?: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  attachmentSize?: number;
  attachmentType?: string;
  replyToId?: string;
  isHighPriority?: boolean;
  isEmergency?: boolean;
}

export interface SendBroadcastInput {
  title: string;
  content: string;
  messageType?: MessageType;
  attachmentUrl?: string;
  attachmentName?: string;
  targetRoles: string[];
  targetUserIds?: string[];
  targetRegions?: string[];
  isEmergency?: boolean;
  expiresAt?: string;
}

// Response types
export interface ConversationsResponse {
  conversations: Conversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MessagesResponse {
  messages: Message[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface BroadcastsResponse {
  broadcasts: BroadcastMessage[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ContactsResponse {
  contacts: MessageUser[];
  groupedContacts: Record<string, MessageUser[]>;
  totalCount: number;
}

export interface UnreadCounts {
  conversations: number;
  broadcasts: number;
  total: number;
}

// Display helpers
export const CONVERSATION_TYPE_LABELS: Record<ConversationType, string> = {
  DIRECT: 'Direct Message',
  GROUP: 'Group Chat',
  BROADCAST: 'Broadcast',
  EMERGENCY: 'Emergency',
};

export const MESSAGE_TYPE_LABELS: Record<MessageType, string> = {
  TEXT: 'Text',
  IMAGE: 'Image',
  DOCUMENT: 'Document',
  AUDIO: 'Audio',
  VIDEO: 'Video',
  LOCATION: 'Location',
  VOICE_NOTE: 'Voice Note',
  SYSTEM: 'System',
};

export const MESSAGE_TYPE_ICONS: Record<MessageType, string> = {
  TEXT: '💬',
  IMAGE: '🖼️',
  DOCUMENT: '📄',
  AUDIO: '🎵',
  VIDEO: '🎥',
  LOCATION: '📍',
  VOICE_NOTE: '🎤',
  SYSTEM: '⚙️',
};

export const ROLE_LABELS: Record<string, string> = {
  DIRECTOR: 'Managing Director',
  MANAGER: 'Manager',
  GENERAL_SUPERVISOR: 'General Supervisor',
  SUPERVISOR: 'Supervisor',
  OPERATOR: 'Operator',
  SECRETARY: 'Secretary',
};

export const ROLE_COLORS: Record<string, string> = {
  DIRECTOR: 'bg-yellow-100 text-yellow-800',
  MANAGER: 'bg-blue-100 text-blue-800',
  GENERAL_SUPERVISOR: 'bg-purple-100 text-purple-800',
  SUPERVISOR: 'bg-green-100 text-green-800',
  OPERATOR: 'bg-gray-100 text-gray-800',
  SECRETARY: 'bg-pink-100 text-pink-800',
};

// Utility functions
export const formatMessageTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  // Less than 24 hours ago - show time
  if (diff < 24 * 60 * 60 * 1000) {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  
  // Less than 7 days ago - show day name
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }
  
  // Otherwise show date
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export const formatMessageDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const messageDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  if (messageDate.getTime() === today.getTime()) {
    return 'Today';
  }
  
  if (messageDate.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }
  
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export const getConversationName = (conversation: Conversation, currentUserId: string): string => {
  if (conversation.name) {
    return conversation.name;
  }
  
  // For direct messages, show the other participant's name
  if (conversation.type === 'DIRECT') {
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
    if (otherParticipant?.user) {
      return `${otherParticipant.user.firstName} ${otherParticipant.user.lastName}`;
    }
  }
  
  return 'Unknown';
};

export const getConversationAvatar = (conversation: Conversation, currentUserId: string): string | null => {
  if (conversation.avatar) {
    return conversation.avatar;
  }
  
  // For direct messages, show the other participant's photo
  if (conversation.type === 'DIRECT') {
    const otherParticipant = conversation.participants.find(p => p.userId !== currentUserId);
    return otherParticipant?.user?.profilePhoto || null;
  }
  
  return null;
};

export const isUserOnline = (lastLogin: string | null | undefined): boolean => {
  if (!lastLogin) return false;
  const lastLoginDate = new Date(lastLogin);
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
  return lastLoginDate > fiveMinutesAgo;
};

export const truncateMessage = (content: string | null | undefined, maxLength = 50): string => {
  if (!content) return '';
  if (content.length <= maxLength) return content;
  return content.substring(0, maxLength) + '...';
};
