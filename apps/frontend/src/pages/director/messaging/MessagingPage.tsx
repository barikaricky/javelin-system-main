import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Search,
  Plus,
  Users,
  Megaphone,
  AlertTriangle,
  Settings,
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
  Mail,
  Briefcase,
  PhoneCall,
  Upload,
  FileText,
  Image as ImageIcon,
  FileVideo,
  Download,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../../stores/authStore';
import { messagingService } from '../../../services/messagingService';
import { callNotificationService, CallSignal, CallNotification } from '../../../services/callNotificationService';
import { getImageUrl, api } from '../../../lib/api';
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
  getOtherParticipantUser,
  isUserOnline,
  truncateMessage,
  ROLE_LABELS,
  ROLE_COLORS,
} from '../../../types/messaging';

type SidebarTab = 'chats' | 'groups' | 'broadcasts' | 'contacts';

const EMOJI_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function MessagingPage() {
  const navigate = useNavigate();
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
  
  // File upload state
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Video call state
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [videoRoomUrl, setVideoRoomUrl] = useState('');
  const [incomingCall, setIncomingCall] = useState<CallNotification | null>(null);
  const [showIncomingCallModal, setShowIncomingCallModal] = useState(false);

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
    
    // Request notification permission
    callNotificationService.requestPermission();
    
    // Start polling for call signals
    if (user?.id) {
      callNotificationService.startPolling(user.id, handleIncomingCallSignal);
    }
    
    // Listen for call accept/reject events from notifications
    const handleCallAccepted = (event: Event) => {
      const customEvent = event as CustomEvent<CallNotification>;
      handleAcceptIncomingCall(customEvent.detail);
    };
    
    const handleCallRejected = (event: Event) => {
      const customEvent = event as CustomEvent<CallNotification>;
      handleRejectIncomingCall(customEvent.detail);
    };
    
    window.addEventListener('call-accepted', handleCallAccepted);
    window.addEventListener('call-rejected', handleCallRejected);
    
    // Poll for unread counts every 10 seconds
    const unreadInterval = setInterval(() => {
      loadUnreadCounts();
      loadConversations(); // Refresh conversation list for new messages
    }, 10000);

    return () => {
      clearInterval(unreadInterval);
      callNotificationService.stopPolling();
      callNotificationService.cleanup();
      window.removeEventListener('call-accepted', handleCallAccepted);
      window.removeEventListener('call-rejected', handleCallRejected);
    };
  }, [user?.id]);

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
      scrollToBottom();
      
      // Update conversation list
      loadConversations();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to send message');
    } finally {
      setIsSending(false);
    }
  };
  
  // File upload handler
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedConversation) return;
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }
    
    setUploadingFile(true);
    setUploadProgress(0);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', selectedConversation.id);
      
      const response = await api.post('/messaging/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total 
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0;
          setUploadProgress(progress);
        },
      });
      
      // Send message with attachment
      const message = await messagingService.sendMessage(selectedConversation.id, {
        content: `📎 ${file.name}`,
        messageType: file.type.startsWith('image/') ? 'IMAGE' : 'DOCUMENT',
        attachmentUrl: response.data.url,
        attachmentName: file.name,
        attachmentSize: file.size,
        attachmentType: file.type,
      });
      
      setMessages(prev => [...prev, message]);
      toast.success('File uploaded successfully');
      scrollToBottom();
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setUploadingFile(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };
  
  // Video call handler
  const handleStartVideoCall = async () => {
    if (!selectedConversation) return;
    
    const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
    if (!otherUser) {
      toast.error('Cannot find recipient user');
      return;
    }
    
    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomName = `javelin-call-${selectedConversation.id}-${Date.now()}`;
    const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
    const videoUrl = `https://${jitsiDomain}/${roomName}`;
    
    try {
      // Send call signal to recipient
      await callNotificationService.sendCallSignal({
        type: 'call-initiated',
        callId,
        fromUserId: user?.id || '',
        toUserId: otherUser.id,
        conversationId: selectedConversation.id,
        callType: 'video',
        roomUrl: videoUrl,
      });
      
      // Send system message about call
      messagingService.sendMessage(selectedConversation.id, {
        content: `📹 Video call started`,
        messageType: 'SYSTEM',
      }).then(message => {
        setMessages(prev => [...prev, message]);
      });
      
      setVideoRoomUrl(videoUrl);
      setShowVideoModal(true);
      
      toast.success(`Starting video call with ${otherUser.firstName}`);
    } catch (error) {
      toast.error('Failed to initiate call');
      console.error('Call initiation error:', error);
    }
  };
  
  // Voice call handler
  const handleStartVoiceCall = async () => {
    if (!selectedConversation) return;
    
    const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
    if (!otherUser) {
      toast.error('Cannot find recipient user');
      return;
    }
    
    const callId = `call-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const roomName = `javelin-call-${selectedConversation.id}-${Date.now()}`;
    const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
    const videoUrl = `https://${jitsiDomain}/${roomName}#config.startWithVideoMuted=true`;
    
    try {
      // Send call signal to recipient
      await callNotificationService.sendCallSignal({
        type: 'call-initiated',
        callId,
        fromUserId: user?.id || '',
        toUserId: otherUser.id,
        conversationId: selectedConversation.id,
        callType: 'voice',
        roomUrl: videoUrl,
      });
      
      // Send system message about call
      messagingService.sendMessage(selectedConversation.id, {
        content: `📞 Voice call started`,
        messageType: 'SYSTEM',
      }).then(message => {
        setMessages(prev => [...prev, message]);
      });
      
      setVideoRoomUrl(videoUrl);
      setShowVideoModal(true);
      
      toast.success(`Starting voice call with ${otherUser.firstName}`);
    } catch (error) {
      toast.error('Failed to initiate call');
      console.error('Call initiation error:', error);
    }
  };
  
  // Handle incoming call signal
  const handleIncomingCallSignal = async (signal: CallSignal) => {
    if (signal.type === 'call-initiated') {
      // Find the conversation
      const conv = conversations.find(c => c.id === signal.conversationId);
      if (!conv) return;
      
      const caller = getOtherParticipantUser(conv, user?.id || '');
      if (!caller) return;
      
      const callNotification: CallNotification = {
        callId: signal.callId,
        callerId: signal.fromUserId,
        callerName: `${caller.firstName} ${caller.lastName}`,
        callerPhoto: caller.profilePhoto,
        conversationId: signal.conversationId,
        callType: signal.callType,
        timestamp: signal.timestamp,
      };
      
      // Show incoming call UI
      setIncomingCall(callNotification);
      setShowIncomingCallModal(true);
      
      // Show browser notification if tab is not active
      if (document.hidden) {
        await callNotificationService.showCallNotification(callNotification);
      }
      
      // Play ringtone
      toast(`Incoming ${signal.callType} call from ${callNotification.callerName}`, {
        icon: signal.callType === 'video' ? '📹' : '📞',
        duration: 30000, // 30 seconds
      });
    } else if (signal.type === 'call-accepted') {
      // Call was accepted by recipient
      toast.success('Call connected');
    } else if (signal.type === 'call-rejected') {
      // Call was rejected
      setShowVideoModal(false);
      toast.error('Call was rejected');
    } else if (signal.type === 'call-ended' || signal.type === 'call-cancelled') {
      // Call ended
      setShowVideoModal(false);
      setShowIncomingCallModal(false);
      callNotificationService.closeNotification(signal.callId);
      toast('Call ended');
    }
  };
  
  // Handle accepting incoming call
  const handleAcceptIncomingCall = async (callNotification: CallNotification) => {
    if (!incomingCall) return;
    
    try {
      // Send acceptance signal
      await callNotificationService.sendCallSignal({
        type: 'call-accepted',
        callId: incomingCall.callId,
        fromUserId: user?.id || '',
        toUserId: incomingCall.callerId,
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType,
      });
      
      // Find conversation and set as active
      const conv = conversations.find(c => c.id === incomingCall.conversationId);
      if (conv) {
        setSelectedConversation(conv);
        setShowMobileChat(true);
      }
      
      // Get room URL from the original signal or generate new one
      const roomName = `javelin-call-${incomingCall.conversationId}-${incomingCall.timestamp}`;
      const jitsiDomain = import.meta.env.VITE_JITSI_DOMAIN || 'meet.jit.si';
      const videoUrl = `https://${jitsiDomain}/${roomName}${incomingCall.callType === 'voice' ? '#config.startWithVideoMuted=true' : ''}`;
      
      setVideoRoomUrl(videoUrl);
      setShowVideoModal(true);
      setShowIncomingCallModal(false);
      
      callNotificationService.closeNotification(incomingCall.callId);
      toast.success('Joined call');
    } catch (error) {
      toast.error('Failed to accept call');
      console.error('Call accept error:', error);
    }
  };
  
  // Handle rejecting incoming call
  const handleRejectIncomingCall = async (callNotification: CallNotification) => {
    if (!incomingCall) return;
    
    try {
      // Send rejection signal
      await callNotificationService.sendCallSignal({
        type: 'call-rejected',
        callId: incomingCall.callId,
        fromUserId: user?.id || '',
        toUserId: incomingCall.callerId,
        conversationId: incomingCall.conversationId,
        callType: incomingCall.callType,
      });
      
      setShowIncomingCallModal(false);
      setIncomingCall(null);
      
      callNotificationService.closeNotification(incomingCall.callId);
      toast('Call declined');
    } catch (error) {
      toast.error('Failed to reject call');
      console.error('Call reject error:', error);
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
          selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
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
              conv.type === 'GROUP' ? 'bg-purple-100' : 'bg-blue-100'
            }`}>
              {conv.type === 'GROUP' ? (
                <Users className="w-6 h-6 text-purple-600" />
              ) : (
                <span className="text-lg font-semibold text-blue-600">
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
              <span className="bg-blue-600 text-white text-xs font-medium px-2 py-0.5 rounded-full">
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
    
    const isImageAttachment = message.messageType === 'IMAGE' && message.attachmentUrl;
    const isDocumentAttachment = message.messageType === 'DOCUMENT' && message.attachmentUrl;

    return (
      <>
        {showDate && (
          <div className="flex justify-center my-3 sm:my-4">
            <span className="bg-gray-100 text-gray-600 text-xs px-2.5 sm:px-3 py-1 rounded-full">
              {formatMessageDate(message.createdAt)}
            </span>
          </div>
        )}

        <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5 sm:mb-2 group px-1`}>
          {!isOwn && showAvatar && message.sender && (
            <img
              src={getImageUrl(message.sender?.profilePhoto) || '/default-avatar.png'}
              alt={message.sender?.firstName || 'User'}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full mr-1.5 sm:mr-2 flex-shrink-0"
            />
          )}
          {!isOwn && !showAvatar && <div className="w-7 sm:w-8 mr-1.5 sm:mr-2" />}

          <div className={`max-w-[85%] sm:max-w-[75%] md:max-w-[70%] ${isOwn ? 'order-1' : ''}`}>
            {/* Reply Preview */}
            {message.replyTo && (
              <div className={`mb-1 p-1.5 sm:p-2 rounded-lg text-xs ${
                isOwn ? 'bg-blue-100' : 'bg-gray-100'
              }`}>
                <p className="font-medium text-gray-600 truncate">
                  {message.replyTo.sender.firstName} {message.replyTo.sender.lastName}
                </p>
                <p className="text-gray-500 truncate">{message.replyTo.content}</p>
              </div>
            )}

            {/* Message Bubble */}
            <div
              className={`relative px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl ${
                message.isDeleted
                  ? 'bg-gray-100 text-gray-500 italic'
                  : isOwn
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-900'
              } ${message.isHighPriority && !isOwn ? 'border-2 border-red-500' : ''} ${
                message.isEmergency ? 'bg-red-600 text-white' : ''
              }`}
            >
              {!isOwn && showAvatar && message.sender && (
                <p className="text-xs font-medium text-blue-600 mb-1 truncate">
                  {message.sender?.firstName} {message.sender?.lastName}
                </p>
              )}

              {message.isPinned && (
                <Pin className="w-3 h-3 absolute -top-1 -right-1 text-yellow-500" />
              )}

              {/* Image Attachment */}
              {isImageAttachment && (
                <div className="mb-2">
                  <img
                    src={getImageUrl(message.attachmentUrl!)}
                    alt={message.attachmentName || 'Image'}
                    className="max-w-full rounded-lg max-h-64 sm:max-h-80 object-cover cursor-pointer"
                    onClick={() => window.open(getImageUrl(message.attachmentUrl!), '_blank')}
                  />
                </div>
              )}

              {/* Document Attachment */}
              {isDocumentAttachment && (
                <a
                  href={getImageUrl(message.attachmentUrl!)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${
                    isOwn ? 'bg-blue-500' : 'bg-gray-200'
                  }`}
                >
                  <FileText className="w-8 h-8 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{message.attachmentName}</p>
                    {message.attachmentSize && (
                      <p className="text-xs opacity-75">
                        {(message.attachmentSize / 1024).toFixed(1)} KB
                      </p>
                    )}
                  </div>
                  <Download className="w-4 h-4 flex-shrink-0" />
                </a>
              )}

              <p className="whitespace-pre-wrap break-words text-sm sm:text-base">{message.content}</p>

              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] sm:text-xs ${
                isOwn ? 'text-blue-200' : 'text-gray-500'
              }`}>
                <span>{new Date(message.createdAt).toLocaleTimeString('en-US', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}</span>
                {isOwn && (
                  message.status === 'READ' ? (
                    <CheckCheck className="w-3 h-3 sm:w-4 sm:h-4 text-blue-300" />
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
                        ? 'bg-blue-100 border border-blue-300'
                        : 'bg-gray-100'
                    }`}
                  >
                    {emoji} {userIds.length}
                  </button>
                ))}
              </div>
            )}

            {/* Message Actions - Desktop */}
            <div className={`hidden sm:block absolute top-0 ${isOwn ? 'left-0 -translate-x-full' : 'right-0 translate-x-full'} 
              opacity-0 group-hover:opacity-100 transition-opacity px-2`}>
              <div className="flex items-center gap-0.5 bg-white rounded-lg shadow-lg border p-0.5">
                {EMOJI_REACTIONS.slice(0, 4).map(emoji => (
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

  return (
    <div className="h-[calc(100vh-12rem)] sm:h-[calc(100vh-10rem)] md:h-[calc(100vh-8rem)] flex bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <div className={`w-full sm:w-80 md:w-80 lg:w-96 bg-white border-r flex flex-col shrink-0 ${
        showMobileChat ? 'hidden sm:flex' : 'flex'
      }`}>
        {/* Header */}
        <div className="p-2 sm:p-3 md:p-4 border-b bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="flex items-center justify-between mb-2 sm:mb-3 md:mb-4">
            <h1 className="text-base sm:text-lg md:text-xl font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
              Messages
            </h1>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setShowNewChat(true)}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="New Message"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </button>
              <button
                onClick={() => navigate('/director/settings')}
                className="p-1.5 sm:p-2 hover:bg-white/10 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
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
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1" />
            <span className="hidden xs:inline">Chats</span>
            {unreadCounts.conversations > 0 && (
              <span className="ml-1 bg-blue-600 text-white text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full">
                {unreadCounts.conversations}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 min-w-0 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === 'groups'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
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
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
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
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50'
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
              <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : activeTab === 'chats' ? (
            <div className="p-2">
              {directMessages.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500">No conversations yet</p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="mt-2 text-blue-600 hover:underline"
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
              {user?.role === 'DIRECTOR' || user?.role === 'MANAGER' || user?.role === 'GENERAL_SUPERVISOR' ? (
                <button
                  onClick={() => setShowNewBroadcast(true)}
                  className="w-full p-3 flex items-center gap-3 hover:bg-gray-50 rounded-lg mb-2 border border-dashed border-gray-300"
                >
                  <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                    <Megaphone className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="font-medium text-gray-700">Send Broadcast</span>
                </button>
              ) : null}
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
                    } ${!broadcast.isRead ? 'bg-blue-50' : ''}`}
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
                          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <span className="text-sm font-semibold text-blue-600">
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
      <div className={`flex-1 flex flex-col bg-white min-w-0 ${
        !showMobileChat ? 'hidden sm:flex' : 'flex'
      }`}>
        {selectedConversation ? (
          <>
            {/* Chat Header - FIXED */}
            <div className="h-14 sm:h-16 border-b flex items-center justify-between px-2 sm:px-3 md:px-4 py-2 sm:py-3 bg-white flex-shrink-0">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                <button
                  onClick={() => {
                    setShowMobileChat(false);
                    setSelectedConversation(null);
                  }}
                  className="sm:hidden p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="relative flex-shrink-0">
                  {getConversationAvatar(selectedConversation, user?.id || '') ? (
                    <img
                      src={getImageUrl(getConversationAvatar(selectedConversation, user?.id || '')!)}
                      alt=""
                      className="w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center ${
                      selectedConversation.type === 'GROUP' ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      {selectedConversation.type === 'GROUP' ? (
                        <Users className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-purple-600" />
                      ) : (
                        <span className="text-xs sm:text-sm md:text-base font-semibold text-blue-600">
                          {getConversationName(selectedConversation, user?.id || '').charAt(0)}
                        </span>
                      )}
                    </div>
                  )}
                  {selectedConversation.type === 'DIRECT' && (() => {
                    const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
                    return otherUser && isUserOnline(otherUser.lastLogin) ? (
                      <div className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-green-500 rounded-full border-2 border-white" />
                    ) : null;
                  })()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="font-semibold text-xs sm:text-sm md:text-base text-gray-900 truncate">
                    {getConversationName(selectedConversation, user?.id || '')}
                  </h2>
                  {selectedConversation.type === 'GROUP' ? (
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {selectedConversation.participants.length} members
                    </p>
                  ) : (() => {
                    const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
                    if (!otherUser) return <p className="text-[10px] sm:text-xs text-gray-500">Loading...</p>;
                    
                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2">
                        <p className="text-[10px] sm:text-xs text-gray-500 truncate">
                          {ROLE_LABELS[otherUser.role] || otherUser.role}
                        </p>
                        {isUserOnline(otherUser.lastLogin) ? (
                          <span className="text-[10px] sm:text-xs text-green-600 font-medium">● Online</span>
                        ) : otherUser.lastLogin ? (
                          <span className="text-[10px] sm:text-xs text-gray-400 hidden sm:inline">
                            Last seen {formatMessageTime(otherUser.lastLogin)}
                          </span>
                        ) : null}
                      </div>
                    );
                  })()}
                </div>
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 flex-shrink-0">
                <button
                  onClick={handleStartVoiceCall}
                  className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Start voice call"
                >
                  <Phone className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleStartVideoCall}
                  className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Start video call"
                >
                  <Video className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <button
                  onClick={() => setShowUserInfo(!showUserInfo)}
                  className={`p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-lg transition-colors ${
                    showUserInfo ? 'bg-blue-100' : ''
                  }`}
                  title="User info"
                >
                  <Info className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
              </div>
            </div>

            {/* User Info Panel */}
            {showUserInfo && selectedConversation.type === 'DIRECT' && (() => {
              const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
              if (!otherUser) return null;
              
              return (
                <div className="border-b bg-gradient-to-b from-blue-50 to-white p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="relative flex-shrink-0">
                      {otherUser.profilePhoto ? (
                        <img
                          src={getImageUrl(otherUser.profilePhoto)}
                          alt={`${otherUser.firstName} ${otherUser.lastName}`}
                          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover border-2 border-white shadow-md"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-blue-100 flex items-center justify-center border-2 border-white shadow-md">
                          <span className="text-2xl sm:text-3xl font-bold text-blue-600">
                            {otherUser.firstName.charAt(0)}{otherUser.lastName.charAt(0)}
                          </span>
                        </div>
                      )}
                      {isUserOnline(otherUser.lastLogin) && (
                        <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1">
                        {otherUser.firstName} {otherUser.lastName}
                      </h3>
                      <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Briefcase className="w-4 h-4 flex-shrink-0 text-blue-500" />
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                            ROLE_COLORS[otherUser.role] || 'bg-gray-100 text-gray-700'
                          }`}>
                            {ROLE_LABELS[otherUser.role] || otherUser.role}
                          </span>
                        </div>
                        {otherUser.email && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            <a href={`mailto:${otherUser.email}`} className="hover:text-blue-600 truncate">
                              {otherUser.email}
                            </a>
                          </div>
                        )}
                        {(otherUser as any).phone && (
                          <div className="flex items-center gap-2 text-gray-600">
                            <PhoneCall className="w-4 h-4 flex-shrink-0 text-blue-500" />
                            <a href={`tel:${(otherUser as any).phone}`} className="hover:text-blue-600">
                              {(otherUser as any).phone}
                            </a>
                          </div>
                        )}
                        {otherUser.status && (
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${
                              otherUser.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-400'
                            }`} />
                            <span className="text-gray-500 capitalize">{otherUser.status.toLowerCase()}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Messages - SCROLLABLE AREA */}
            <div 
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto p-2 sm:p-3 md:p-4 bg-gray-50"
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
              <div className="px-3 sm:px-4 py-2 bg-gray-100 border-t flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Reply className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] sm:text-xs font-medium text-gray-600">
                      Replying to {replyingTo.sender.firstName}
                    </p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">
                      {replyingTo.content}
                    </p>
                  </div>
                </div>
                <button onClick={() => setReplyingTo(null)} className="p-1 hover:bg-gray-200 rounded flex-shrink-0">
                  <X className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                </button>
              </div>
            )}

            {/* Message Input - FIXED */}
            <div className="p-2 sm:p-3 md:p-4 border-t bg-white flex-shrink-0">
              {uploadingFile && (
                <div className="mb-2 bg-blue-50 rounded-lg p-2 flex items-center gap-2">
                  <Upload className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 animate-pulse flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] sm:text-xs text-blue-600 mb-1">Uploading... {uploadProgress}%</div>
                    <div className="w-full bg-blue-200 rounded-full h-1 sm:h-1.5">
                      <div
                        className="bg-blue-600 h-1 sm:h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}
              <div className="flex items-end gap-1 sm:gap-1.5 md:gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt,.zip"
                  disabled={uploadingFile}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingFile}
                  className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors disabled:opacity-50"
                  title="Attach file"
                >
                  <Paperclip className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <div className="flex-1 relative">
                  <textarea
                    ref={messageInputRef}
                    value={messageInput}
                    onChange={e => setMessageInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    rows={1}
                    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 md:px-4 text-xs sm:text-sm md:text-base border border-gray-200 rounded-lg sm:rounded-xl resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    style={{ maxHeight: '100px' }}
                    disabled={uploadingFile}
                  />
                </div>
                <button
                  className="p-1 sm:p-1.5 md:p-2 hover:bg-gray-100 rounded-lg flex-shrink-0 transition-colors hidden sm:block"
                  title="Emoji"
                >
                  <Smile className="w-4 h-4 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-600" />
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!messageInput.trim() || isSending || uploadingFile}
                  className="p-1.5 sm:p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
                  title="Send"
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
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="font-semibold text-blue-600">
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
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
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
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">
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
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newGroupDescription}
                  onChange={e => setNewGroupDescription(e.target.value)}
                  placeholder="Enter group description"
                  rows={2}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
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
                        className="rounded text-blue-600"
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
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Broadcast Modal */}
      {showNewBroadcast && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Send Broadcast</h2>
              <button onClick={() => setShowNewBroadcast(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                  placeholder="Enter broadcast title"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea
                  value={broadcastContent}
                  onChange={e => setBroadcastContent(e.target.value)}
                  placeholder="Enter your message"
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Target Roles ({broadcastRoles.length} selected)
                </label>
                <div className="space-y-2">
                  {Object.entries(ROLE_LABELS).map(([role, label]) => (
                    <label key={role} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={broadcastRoles.includes(role)}
                        onChange={e => {
                          if (e.target.checked) {
                            setBroadcastRoles([...broadcastRoles, role]);
                          } else {
                            setBroadcastRoles(broadcastRoles.filter(r => r !== role));
                          }
                        }}
                        className="rounded text-blue-600"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isEmergency}
                    onChange={e => setIsEmergency(e.target.checked)}
                    className="rounded text-red-600"
                  />
                  <span className="text-sm font-medium text-red-600">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Mark as Emergency Alert
                  </span>
                </label>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end gap-2">
              <button
                onClick={() => setShowNewBroadcast(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBroadcast}
                disabled={!broadcastTitle.trim() || !broadcastContent.trim() || broadcastRoles.length === 0}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  isEmergency ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isEmergency ? 'Send Emergency Alert' : 'Send Broadcast'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Video Call Modal */}
      {showVideoModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-2 sm:p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[80vh] flex flex-col">
            <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gray-50">
              <h2 className="text-base sm:text-lg font-semibold">Video Call</h2>
              <button
                onClick={() => {
                  setShowVideoModal(false);
                  setVideoRoomUrl('');
                  
                  // Send call ended signal if in a call
                  if (selectedConversation) {
                    const otherUser = getOtherParticipantUser(selectedConversation, user?.id || '');
                    if (otherUser) {
                      callNotificationService.sendCallSignal({
                        type: 'call-ended',
                        callId: `call-${Date.now()}`,
                        fromUserId: user?.id || '',
                        toUserId: otherUser.id,
                        conversationId: selectedConversation.id,
                        callType: 'video',
                      }).catch(console.error);
                    }
                  }
                }}
                className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 p-2 sm:p-4">
              <iframe
                src={videoRoomUrl}
                className="w-full h-full rounded-lg border-2 border-gray-200"
                allow="camera; microphone; fullscreen; display-capture"
                title="Video Call"
              />
            </div>
            <div className="p-3 sm:p-4 border-t bg-gray-50 text-center text-xs sm:text-sm text-gray-600">
              Video call powered by Jitsi Meet (8x8)
            </div>
          </div>
        </div>
      )}
      
      {/* Incoming Call Modal */}
      {showIncomingCallModal && incomingCall && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-bounce-slow">
            <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 text-white text-center">
              <div className="mb-4">
                {incomingCall.callerPhoto ? (
                  <img
                    src={getImageUrl(incomingCall.callerPhoto)}
                    alt={incomingCall.callerName}
                    className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full mx-auto border-4 border-white shadow-lg bg-white text-blue-600 flex items-center justify-center">
                    <span className="text-3xl font-bold">
                      {incomingCall.callerName.charAt(0)}
                    </span>
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-bold mb-2">{incomingCall.callerName}</h2>
              <div className="flex items-center justify-center gap-2 text-blue-100">
                {incomingCall.callType === 'video' ? (
                  <>
                    <Video className="w-5 h-5" />
                    <span>Incoming Video Call</span>
                  </>
                ) : (
                  <>
                    <Phone className="w-5 h-5" />
                    <span>Incoming Voice Call</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="p-6 flex items-center justify-center gap-6">
              <button
                onClick={() => handleRejectIncomingCall(incomingCall)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg group-hover:scale-110 transform">
                  <X className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-600">Decline</span>
              </button>
              
              <button
                onClick={() => handleAcceptIncomingCall(incomingCall)}
                className="flex flex-col items-center gap-2 group"
              >
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center hover:bg-green-600 transition-colors shadow-lg group-hover:scale-110 transform animate-pulse">
                  <Phone className="w-8 h-8 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-600">Accept</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
