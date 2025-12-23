import { api } from '../lib/api';
import type {
  Conversation,
  ConversationsResponse,
  Message,
  MessagesResponse,
  BroadcastMessage,
  BroadcastsResponse,
  ContactsResponse,
  UnreadCounts,
  CreateConversationInput,
  CreateGroupInput,
  SendMessageInput,
  SendBroadcastInput,
  ConversationType,
} from '../types/messaging';

const MESSAGING_API = '/messaging';

// ==================== CONVERSATIONS ====================

export const getConversations = async (
  type?: ConversationType,
  search?: string,
  page = 1,
  limit = 50
): Promise<ConversationsResponse> => {
  const params: Record<string, string> = {};
  if (type) params.type = type;
  if (search) params.search = search;
  params.page = page.toString();
  params.limit = limit.toString();

  const response = await api.get<ConversationsResponse>(`${MESSAGING_API}/conversations`, { params });
  return response.data;
};

export const getConversationById = async (conversationId: string): Promise<Conversation> => {
  const response = await api.get<{ conversation: Conversation }>(
    `${MESSAGING_API}/conversations/${conversationId}`
  );
  return response.data.conversation;
};

export const createConversation = async (data: CreateConversationInput): Promise<Conversation> => {
  const response = await api.post<{ conversation: Conversation }>(
    `${MESSAGING_API}/conversations`,
    data
  );
  return response.data.conversation;
};

export const createDirectMessage = async (participantId: string): Promise<Conversation> => {
  return createConversation({
    type: 'DIRECT',
    participantIds: [participantId],
  });
};

// ==================== GROUPS ====================

export const createGroup = async (data: CreateGroupInput): Promise<Conversation> => {
  const response = await api.post<{ group: Conversation }>(`${MESSAGING_API}/groups`, data);
  return response.data.group;
};

export const addParticipantToGroup = async (
  conversationId: string,
  participantId: string
): Promise<any> => {
  const response = await api.post(`${MESSAGING_API}/groups/${conversationId}/participants`, {
    participantId,
  });
  return response.data.participant;
};

export const removeParticipantFromGroup = async (
  conversationId: string,
  participantId: string
): Promise<void> => {
  await api.delete(`${MESSAGING_API}/groups/${conversationId}/participants/${participantId}`);
};

export const leaveGroup = async (conversationId: string): Promise<void> => {
  await api.post(`${MESSAGING_API}/groups/${conversationId}/leave`);
};

// ==================== MESSAGES ====================

export const getMessages = async (
  conversationId: string,
  page = 1,
  limit = 50,
  before?: string
): Promise<MessagesResponse> => {
  const params: Record<string, string> = {};
  params.page = page.toString();
  params.limit = limit.toString();
  if (before) params.before = before;

  const response = await api.get<MessagesResponse>(
    `${MESSAGING_API}/conversations/${conversationId}/messages`,
    { params }
  );
  return response.data;
};

export const sendMessage = async (
  conversationId: string,
  data: SendMessageInput
): Promise<Message> => {
  const response = await api.post<{ message: Message }>(
    `${MESSAGING_API}/conversations/${conversationId}/messages`,
    data
  );
  return response.data.message;
};

export const markMessagesAsRead = async (conversationId: string): Promise<void> => {
  await api.post(`${MESSAGING_API}/conversations/${conversationId}/read`);
};

export const deleteMessage = async (messageId: string, forAll = false): Promise<void> => {
  await api.delete(`${MESSAGING_API}/messages/${messageId}`, {
    params: { forAll: forAll.toString() },
  });
};

export const reactToMessage = async (
  messageId: string,
  emoji: string
): Promise<{ reactions: Record<string, string[]> }> => {
  const response = await api.post<{ reactions: Record<string, string[]> }>(
    `${MESSAGING_API}/messages/${messageId}/react`,
    { emoji }
  );
  return response.data;
};

export const pinMessage = async (messageId: string, isPinned = true): Promise<void> => {
  await api.post(`${MESSAGING_API}/messages/${messageId}/pin`, { isPinned });
};

// ==================== BROADCASTS ====================

export const getBroadcasts = async (page = 1, limit = 20): Promise<BroadcastsResponse> => {
  const params = { page: page.toString(), limit: limit.toString() };
  const response = await api.get<BroadcastsResponse>(`${MESSAGING_API}/broadcasts`, { params });
  return response.data;
};

export const sendBroadcast = async (data: SendBroadcastInput): Promise<BroadcastMessage> => {
  const response = await api.post<{ broadcast: BroadcastMessage }>(
    `${MESSAGING_API}/broadcasts`,
    data
  );
  return response.data.broadcast;
};

export const markBroadcastAsRead = async (broadcastId: string): Promise<void> => {
  await api.post(`${MESSAGING_API}/broadcasts/${broadcastId}/read`);
};

// ==================== CONTACTS ====================

export const getContacts = async (role?: string, search?: string): Promise<ContactsResponse> => {
  const params: Record<string, string> = {};
  if (role) params.role = role;
  if (search) params.search = search;

  const response = await api.get<ContactsResponse>(`${MESSAGING_API}/contacts`, { params });
  return response.data;
};

// ==================== SEARCH ====================

export const searchMessages = async (
  query: string,
  conversationId?: string,
  page = 1,
  limit = 20
): Promise<MessagesResponse> => {
  const params: Record<string, string> = { query };
  if (conversationId) params.conversationId = conversationId;
  params.page = page.toString();
  params.limit = limit.toString();

  const response = await api.get<MessagesResponse>(`${MESSAGING_API}/search`, { params });
  return response.data;
};

// ==================== UNREAD COUNTS ====================

export const getUnreadCounts = async (): Promise<UnreadCounts> => {
  const response = await api.get<UnreadCounts>(`${MESSAGING_API}/unread`);
  return response.data;
};

// Export as messagingService object for convenience
export const messagingService = {
  // Conversations
  getConversations,
  getConversationById,
  createConversation,
  createDirectMessage,

  // Groups
  createGroup,
  addParticipantToGroup,
  removeParticipantFromGroup,
  leaveGroup,

  // Messages
  getMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  reactToMessage,
  pinMessage,

  // Broadcasts
  getBroadcasts,
  sendBroadcast,
  markBroadcastAsRead,

  // Contacts
  getContacts,

  // Search
  searchMessages,

  // Unread
  getUnreadCounts,
};

export default messagingService;
