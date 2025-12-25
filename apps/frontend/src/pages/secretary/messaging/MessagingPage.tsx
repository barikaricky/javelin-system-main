import { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Megaphone,
  AlertTriangle,
  Send,
  Paperclip,
  Smile,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Check,
  CheckCheck,
  Pin,
  Trash2,
  Reply,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';
import { messagingService } from '../../../services/messagingService';
import { getImageUrl } from '../../../lib/api';
import type {
  Conversation,
  Message,
  BroadcastMessage,
  MessageUser,
} from '../../../types/messaging';
import {
  formatMessageTime,
  formatMessageDate,
  getConversationName,
  getConversationAvatar,
  isUserOnline,
  truncateMessage,
  ROLE_LABELS,
  ROLE_COLORS,
} from '../../../types/messaging';

type SidebarTab = 'chats' | 'groups' | 'broadcasts' | 'contacts';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function SecretaryMessagingPage() {
  const { user } = useAuthStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const shouldAutoScrollRef = useRef(true);

  // State
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [broadcasts, setBroadcasts] = useState<BroadcastMessage[]>([]);
  const [contacts, setContacts] = useState<MessageUser[]>([]);
  const [groupedContacts, setGroupedContacts] = useState<Record<string, MessageUser[]>>({});
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [selectedBroadcast, setSelectedBroadcast] = useState<BroadcastMessage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [showNewBroadcast, setShowNewBroadcast] = useState(false);
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [showUserInfo, setShowUserInfo] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [unreadCounts, setUnreadCounts] = useState({ conversations: 0, broadcasts: 0, total: 0 });

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);

  // New Broadcast State
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastRoles, setBroadcastRoles] = useState<string[]>([]);
  const [isEmergency, setIsEmergency] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
    loadUnreadCounts();
    
    // Poll for unread counts every 10 seconds
    const unreadInterval = setInterval(() => {
      loadUnreadCounts();
      loadConversations(); // Refresh conversation list for new messages
    }, 10000);

    return () => clearInterval(unreadInterval);
  }, []);

  // Real-time message polling when conversation is selected
  useEffect(() => {
    if (!selectedConversation) return;

    // Poll for new messages every 2 seconds for real-time feel
    const messageInterval = setInterval(() => {
      loadMessages(selectedConversation.id, false);
    }, 2000);

    return () => clearInterval(messageInterval);
  }, [selectedConversation?.id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      shouldAutoScrollRef.current = true; // Enable auto-scroll for new conversation
      loadMessages(selectedConversation.id);
      messagingService.markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  // Scroll to bottom when messages change (only if user is near bottom)
  useEffect(() => {
    if (shouldAutoScrollRef.current) {
      scrollToBottom();
    }
  }, [messages]);

  // Check if user is near bottom of messages
  const handleScroll = () => {
    if (!messagesContainerRef.current) return;
    
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    shouldAutoScrollRef.current = isNearBottom;
  };

  const loadData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadConversations(),
        loadBroadcasts(),
        loadContacts(),
      ]);
    } catch (error) {
      toast.error('Failed to load messages');
    } finally {
      setIsLoading(false);
    }
  };

  const loadConversations = async () => {
    try {
      const result = await messagingService.getConversations();
      setConversations(result.conversations);
    } catch (error) {
      console.error('Load conversations error:', error);
    }
  };

  const loadBroadcasts = async () => {
    try {
      const result = await messagingService.getBroadcasts();
      setBroadcasts(result.broadcasts);
    } catch (error) {
      console.error('Load broadcasts error:', error);
    }
  };

  const loadContacts = async () => {
    try {
      const result = await messagingService.getContacts();
      setContacts(result.contacts);
      setGroupedContacts(result.groupedContacts);
    } catch (error) {
      console.error('Load contacts error:', error);
    }
  };

  const loadMessages = async (conversationId: string, showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const result = await messagingService.getMessages(conversationId);
      setMessages(result.messages);
    } catch (error) {
      console.error('Load messages error:', error);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const loadUnreadCounts = async () => {
    try {
      const counts = await messagingService.getUnreadCounts();
      setUnreadCounts(counts);
    } catch (error) {
      console.error('Load unread counts error:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    shouldAutoScrollRef.current = true;
  };

  const handleSendMessage = async () => {
    if (!selectedConversation || (!messageInput.trim() && !replyingTo)) return;

    setIsSending(true);
    try {
      const message = await messagingService.sendMessage(selectedConversation.id, {
        content: messageInput.trim(),
        replyToId: replyingTo?.id,
      });
      
      setMessages(prev => [...prev, message]);
      setMessageInput('');
      setReplyingTo(null);
      messageInputRef.current?.focus();
      
      // Update conversation list
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleStartDirectMessage = async (contactId: string) => {
    try {
      const conversation = await messagingService.createDirectMessage(contactId);
      setSelectedConversation(conversation);
      setShowNewChat(false);
      setShowMobileChat(true);
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to start conversation');
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim() || selectedParticipants.length === 0) {
      toast.error('Please enter a group name and select participants');
      return;
    }

    try {
      const group = await messagingService.createGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim(),
        participantIds: selectedParticipants,
      });
      
      setSelectedConversation(group);
      setShowNewGroup(false);
      setNewGroupName('');
      setNewGroupDescription('');
      setSelectedParticipants([]);
      loadConversations();
      toast.success('Group created successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create group');
    }
  };

  const handleSendBroadcast = async () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim() || broadcastRoles.length === 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await messagingService.sendBroadcast({
        title: broadcastTitle.trim(),
        content: broadcastContent.trim(),
        targetRoles: broadcastRoles,
        isEmergency,
      });
      
      setShowNewBroadcast(false);
      setBroadcastTitle('');
      setBroadcastContent('');
      setBroadcastRoles([]);
      setIsEmergency(false);
      loadBroadcasts();
      toast.success('Broadcast sent successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send broadcast');
    }
  };

  const handleReaction = async (messageId: string, emoji: string) => {
    try {
      const result = await messagingService.reactToMessage(messageId, emoji);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId ? { ...m, reactions: result.reactions } : m
        )
      );
    } catch (error) {
      toast.error('Failed to react');
    }
  };

  const handleDeleteMessage = async (messageId: string, forAll = false) => {
    try {
      await messagingService.deleteMessage(messageId, forAll);
      setMessages(prev =>
        prev.map(m =>
          m.id === messageId
            ? { ...m, isDeleted: true, content: 'This message was deleted' }
            : m
        )
      );
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  // Filter conversations by search
  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const name = getConversationName(conv, user?.id || '');
    return name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const directMessages = filteredConversations.filter(c => c.type === 'DIRECT');
  const groupChats = filteredConversations.filter(c => c.type === 'GROUP');

  // Render conversation list item
  const ConversationItem = ({ conv }: { conv: Conversation }) => {
    const name = getConversationName(conv, user?.id || '');
    const avatar = getConversationAvatar(conv, user?.id || '');
    const otherParticipant = conv.type === 'DIRECT' 
      ? conv.participants.find(p => p.userId !== user?.id)?.user 
      : null;
    const isOnline = otherParticipant ? isUserOnline(otherParticipant.lastLogin) : false;
    const lastMessage = conv.messages?.[0];

    return (
      <button
        onClick={() => {
          setSelectedConversation(conv);
          setSelectedBroadcast(null);
          setShowMobileChat(true);
        }}
        className={`w-full p-3 flex items-center gap-3 hover:bg-gray-50 transition-colors rounded-lg ${
          selectedConversation?.id === conv.id ? 'bg-emerald-50' : ''
        }`}
      >
        <div className="relative flex-shrink-0">
          {avatar ? (
            <img
              src={getImageUrl(avatar)}
              alt={name}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
              conv.type === 'GROUP' ? 'bg-purple-100' : 'bg-emerald-100'
            }`}>
              {conv.type === 'GROUP' ? (
                <Users className="w-6 h-6 text-purple-600" />
              ) : (
                <span className="text-lg font-semibold text-emerald-600">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          )}
          {isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          )}
        </div>

        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900 truncate">{name}</h3>
            {lastMessage && (
              <span className="text-xs text-gray-500">
                {formatMessageTime(lastMessage.createdAt)}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-sm text-gray-500 truncate">
              {lastMessage?.isDeleted
                ? 'Message deleted'
                : truncateMessage(lastMessage?.content || conv.lastMessagePreview)}
            </p>
            {conv.unreadCount > 0 && (
              <span className="bg-emerald-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                {conv.unreadCount}
              </span>
            )}
          </div>
        </div>
      </button>
    );
  };

  // Render message
  const MessageBubble = ({ message, prevMessage }: { message: Message; prevMessage?: Message }) => {
    const isOwn = message.senderId === user?.id;
    const showDate = !prevMessage || 
      formatMessageDate(message.createdAt) !== formatMessageDate(prevMessage.createdAt);
    const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId);

    return (
      <>
        {showDate && (
          <div className="flex justify-center my-4">
            <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        )}

        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
          {!isOwn && showAvatar && (
            <img
              src={getImageUrl(message.sender.profilePhoto) || '/default-avatar.png'}
              alt={message.sender.firstName}
              className="w-8 h-8 rounded-full mr-2 flex-shrink-0"
            />
          )}
          {!isOwn && !showAvatar && <div className="w-8 mr-2" />}

          <div className={`max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
            {/* Reply Preview */}
            {message.replyTo && (
              <div className={`mb-1 p-2 rounded-lg text-xs ${
                isOwn ? 'bg-emerald-100' : 'bg-gray-100'
              }`}>
                <p className="font-medium text-gray-600">
                  {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
                </p>
                <p className="text-gray-500 truncate">{message.replyTo.content}</p>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`relative px-4 py-2 rounded-2xl ${
                message.isDeleted
                  ? 'bg-gray-100 text-gray-500 italic'
                  : isOwn
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${message.isHighPriority && !isOwn ? 'border-2 border-red-500' : ''} ${
                message.isEmergency ? 'bg-red-600 text-white' : ''
              }`}
            >
              {!isOwn && showAvatar && (
                <p className="text-xs font-medium text-emerald-600 mb-1">
                  {message.sender.firstName} {message.sender.lastName}
                </p>
              )}

              {message.isPinned && (
                <Pin className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
              )}

              <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>

              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] sm:text-xs ${
                isOwn ? 'text-emerald-200' : 'text-gray-500'
              }`}>
                <span>{new Date(message.createdAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
                {isOwn && (
                  message.status === 'READ' ? (
                    <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-300" />
                  ) : (
                    <Check className="w-3 h-3 sm:w-4 sm:h-4" />
                  )
                )}
              </div>
            </div>

            {/* Reactions */}
            {message.reactions && Object.keys(message.reactions).length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {Object.entries(message.reactions).map(([emoji, userIds]) => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(message.id, emoji)}
                    className={`text-xs sm:text-sm px-1.5 sm:px-2 py-0.5 rounded-full ${
                      userIds.includes(user?.id || '')
                        ? 'bg-emerald-100 border border-emerald-300'
                        : 'bg-gray-100'
                    }`}
                  >
                    {emoji} {userIds.length}
                  </button>
                ))}
              </div>
            )}

            {/* Message Actions */}
            <div className={`hidden md:block absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
              opacity-0 group-hover:opacity-100 transition-opacity px-2`}>
              <div className="flex items-center gap-1 bg-white rounded-lg shadow-lg border p-1">
                {EMOJI_REACTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReaction(message.id, emoji)}
                    className="hover:bg-gray-100 p-1 rounded text-sm"
                  >
                    {emoji}
                  </button>
                ))}
                <button
                  onClick={() => setReplyingTo(message)}
                  className="hover:bg-gray-100 p-1 rounded"
                >
                  <Reply className="w-4 h-4 text-gray-600" />
                </button>
                {isOwn && (
                  <button
                    onClick={() => handleDeleteMessage(message.id, true)}
                    className="hover:bg-red-100 p-1 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Secretary cannot send broadcasts, only receive them
  const SECRETARY_BROADCAST_ROLES: Record<string, string> = {};

  return (
    <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex bg-gray-100 rounded-lg md:rounded-xl overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full sm:w-80 md:w-80 lg:w-96 bg-white border-r flex flex-col shrink-0 ${
        showMobileChat ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gradient-to-r from-emerald-600 to-teal-600">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-1.5 sm:gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              <span className="hidden xs:inline">Messages</span>
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="New Message"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 sm:left-3 top-1/2 -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base bg-white/10 backdrop-blur border border-white/20 rounded-lg focus:ring-2 focus:ring-white/50 focus:border-transparent text-white placeholder-white/60"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b overflow-x-auto bg-white scrollbar-hide">
          <button
            onClick={() => setActiveTab('chats')}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'chats'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1" />
            <span className="hidden xs:inline">Chats</span>
            {unreadCounts.conversations > 0 && (
              <span className="ml-1 bg-emerald-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full">
                {unreadCounts.conversations}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'groups'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            <span className="hidden xs:inline">Groups</span>
          </button>
          <button
            onClick={() => setActiveTab('broadcasts')}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'broadcasts'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Megaphone className="w-4 h-4 inline mr-1" />
            <span className="hidden sm:inline">Broadcasts</span>
            {unreadCounts.broadcasts > 0 && (
              <span className="ml-1 bg-red-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full">
                {unreadCounts.broadcasts}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('contacts')}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'contacts'
                ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Users className="w-4 h-4 inline mr-1" />
            <span className="hidden xs:inline">Contacts</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'chats' ? (
            <div className="p-2">
              {directMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No conversations yet</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="mt-2 text-emerald-600 hover:underline"
                  >
                    Start a new chat
                  </button>
                </div>
              ) : (
                directMessages.map(conv => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))
              )}
            </div>
          ) : activeTab === 'groups' ? (
            <div className="p-2">
              <button
                onClick={() => setShowNewGroup(true)}
                className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg mb-2 border border-dashed border-gray-300"
              >
                <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                  <Plus className="w-6 h-6 text-purple-600" />
                </div>
                <span className="font-medium text-gray-700">Create New Group</span>
              </button>
              {groupChats.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No groups yet</p>
                </div>
              ) : (
                groupChats.map(conv => (
                  <ConversationItem key={conv.id} conv={conv} />
                ))
              )}
            </div>
          ) : activeTab === 'broadcasts' ? (
            <div className="p-2">
              {broadcasts.length === 0 ? (
                <div className="text-center py-8">
                  <Megaphone className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No broadcasts</p>
                </div>
              ) : (
                broadcasts.map(broadcast => (
                  <button
                    key={broadcast.id}
                    onClick={() => {
                      setSelectedBroadcast(broadcast);
                      setSelectedConversation(null);
                      setShowMobileChat(true);
                      if (!broadcast.isRead) {
                        messagingService.markBroadcastAsRead(broadcast.id);
                      }
                    }}
                    className={`w-full p-3 flex items-start gap-3 hover:bg-gray-50 rounded-lg ${
                      broadcast.isEmergency ? 'bg-red-50' : ''
                    } ${!broadcast.isRead ? 'bg-emerald-50' : ''}`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                      broadcast.isEmergency ? 'bg-red-100' : 'bg-orange-100'
                    }`}>
                      {broadcast.isEmergency ? (
                        <AlertTriangle className="w-6 h-6 text-red-600" />
                      ) : (
                        <Megaphone className="w-6 h-6 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-gray-900 truncate">{broadcast.title}</h3>
                        <span className="text-xs text-gray-500">
                          {formatMessageTime(broadcast.createdAt)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-0.5">{broadcast.content}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        From: {broadcast.sender.firstName} {broadcast.sender.lastName}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="p-2">
              {Object.entries(groupedContacts).map(([role, roleContacts]) => (
                <div key={role} className="mb-4">
                  <h3 className={`text-xs font-semibold px-3 py-2 rounded-lg mb-1 ${ROLE_COLORS[role] || 'bg-gray-100 text-gray-700'}`}>
                    {ROLE_LABELS[role] || role} ({roleContacts.length})
                  </h3>
                  {roleContacts.map(contact => (
                    <button
                      key={contact.id}
                      onClick={() => handleStartDirectMessage(contact.id)}
                      className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg"
                    >
                      <div className="relative">
                        {contact.profilePhoto ? (
                          <img
                            src={getImageUrl(contact.profilePhoto)}
                            alt={`${contact.firstName} ${contact.lastName}`}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-emerald-600">
                              {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                            </span>
                          </div>
                        )}
                        {isUserOnline(contact.lastLogin) && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 text-left">
                        <h4 className="font-medium text-gray-900">
                          {contact.firstName} {contact.lastName}
                        </h4>
                        <p className="text-xs text-gray-500">{contact.email}</p>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={`flex-1 flex flex-col bg-white ${
        !showMobileChat ? 'hidden md:flex' : 'flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* Chat Header - FIXED */}
            <div className="h-14 sm:h-16 border-b flex items-center justify-between px-3 sm:px-4 flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => {
                    setShowMobileChat(false);
                    setSelectedConversation(null);
                  }}
                  className="md:hidden p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative">
                  {getConversationAvatar(selectedConversation, user?.id || '') ? (
                    <img
                      src={getImageUrl(getConversationAvatar(selectedConversation, user?.id || '')!)}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      selectedConversation.type === 'GROUP' ? 'bg-purple-100' : 'bg-emerald-100'
                    }`}>
                      {selectedConversation.type === 'GROUP' ? (
                        <Users className="w-5 h-5 text-purple-600" />
                      ) : (
                        <span className="font-semibold text-emerald-600">
                          {getConversationName(selectedConversation, user?.id || '').charAt(0)}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">
                    {getConversationName(selectedConversation, user?.id || '')}
                  </h2>
                  <p className="text-xs text-gray-500">
                    {selectedConversation.type === 'GROUP'
                      ? `${selectedConversation.participants.length} members`
                      : selectedConversation.participants.find(p => p.userId !== user?.id)?.user?.lastLogin
                      ? isUserOnline(selectedConversation.participants.find(p => p.userId !== user?.id)?.user?.lastLogin)
                        ? 'Online'
                        : `Last seen ${formatMessageTime(selectedConversation.participants.find(p => p.userId !== user?.id)?.user?.lastLogin || '')}`
                      : 'Offline'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Phone className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <Video className="w-5 h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Info className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Messages - SCROLLABLE AREA */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-4 bg-gray-50"
            >
              {messages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  prevMessage={messages[index - 1]}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Preview */}
            {replyingTo && (
              <div className="px-4 py-2 bg-gray-100 border-t flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2">
                  <Reply className="w-4 h-4 text-gray-500" />
                  <div>
                    <p className="text-xs font-medium text-gray-600">
                      Replying to {replyingTo.sender.firstName}
                    </p>
                    <p className="text-sm text-gray-500 truncate max-w-xs">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded">
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Message Input - FIXED */}
            <div className="p-2 sm:p-3 md:p-4 border-t bg-white flex-shrink-0">
              <div className="flex items-end gap-1 sm:gap-2">
                <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 hidden sm:block">
                  <Paperclip className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative min-w-0">
                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-200 rounded-xl resize-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    style={{ maxHeight: '120px' }}
                  />
                </div>
                <button className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 hidden sm:block">
                  <Smile className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending}
                  className="p-1.5 sm:p-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </>
        ) : selectedBroadcast ? (
          <>
            {/* Broadcast Header */}
            <div className="h-16 border-b flex items-center justify-between px-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowMobileChat(false);
                    setSelectedBroadcast(null);
                  }}
                  className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  selectedBroadcast.isEmergency ? 'bg-red-100' : 'bg-orange-100'
                }`}>
                  {selectedBroadcast.isEmergency ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <Megaphone className="w-5 h-5 text-orange-600" />
                  )}
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">{selectedBroadcast.title}</h2>
                  <p className="text-xs text-gray-500">
                    {selectedBroadcast.isEmergency ? 'Emergency Broadcast' : 'Broadcast Message'}
                  </p>
                </div>
              </div>
            </div>

            {/* Broadcast Content */}
            <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
              <div className={`bg-white rounded-xl shadow-sm p-6 ${
                selectedBroadcast.isEmergency ? 'border-2 border-red-500' : ''
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  {selectedBroadcast.sender.profilePhoto ? (
                    <img
                      src={getImageUrl(selectedBroadcast.sender.profilePhoto)}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                      <span className="font-semibold text-emerald-600">
                        {selectedBroadcast.sender.firstName.charAt(0)}
                        {selectedBroadcast.sender.lastName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedBroadcast.sender.firstName} {selectedBroadcast.sender.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      {ROLE_LABELS[selectedBroadcast.sender.role]}
                    </p>
                  </div>
                  <span className="ml-auto text-sm text-gray-500">
                    {new Date(selectedBroadcast.createdAt).toLocaleString()}
                  </span>
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {selectedBroadcast.title}
                </h3>

                <p className="text-gray-700 whitespace-pre-wrap">
                  {selectedBroadcast.content}
                </p>

                <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm text-gray-500">
                  <span>
                    Sent to: {selectedBroadcast.targetRoles.map(r => ROLE_LABELS[r] || r).join(', ')}
                  </span>
                  <span>
                    {selectedBroadcast.readCount} / {selectedBroadcast.sentCount} read
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Select a conversation
              </h3>
              <p className="text-gray-500 mb-4">
                Choose a chat from the sidebar or start a new conversation
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Plus className="w-5 h-5" />
                New Message
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">New Message</h2>
              <button onClick={() => setShowNewChat(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {contacts.map(contact => (
                <button
                  key={contact.id}
                  onClick={() => handleStartDirectMessage(contact.id)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg"
                >
                  <div className="relative">
                    {contact.profilePhoto ? (
                      <img
                        src={getImageUrl(contact.profilePhoto)}
                        alt=""
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-emerald-600">
                          {contact.firstName.charAt(0)}{contact.lastName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-gray-900">
                      {contact.firstName} {contact.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[contact.role]}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal */}
      {showNewGroup && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Create Group</h2>
              <button onClick={() => setShowNewGroup(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={e => setNewGroupName(e.target.value)}
                  placeholder="Enter group name"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={e => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Select Participants ({selectedParticipants.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto border rounded-lg">
                  {contacts.map(contact => (
                    <label
                      key={contact.id}
                      className="flex items-center gap-3 p-2 hover:bg-gray-50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedParticipants.includes(contact.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedParticipants([...selectedParticipants, contact.id]);
                          } else {
                            setSelectedParticipants(selectedParticipants.filter(id => id !== contact.id));
                          }
                        }}
                        className="rounded text-emerald-600"
                      />
                      <span className="text-sm">
                        {contact.firstName} {contact.lastName}
                      </span>
                      <span className="text-xs text-gray-500 ml-auto">
                        {ROLE_LABELS[contact.role]}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowNewGroup(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedParticipants.length === 0}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
