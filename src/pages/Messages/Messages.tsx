import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Badge,
  Chip,
  InputAdornment,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Tabs,
  Tab,
  CircularProgress,
  LinearProgress,
  Snackbar,
  ListItemSecondaryAction,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send,
  AttachFile,
  Search,
  MoreVert,
  Reply,
  Forward,
  Delete,
  Star,
  Lock,
  Check,
  CheckCircle,
  Person,
  Group,
  Folder,
  Image,
  PictureAsPdf,
  Description,
  GetApp,
  Add,
  FilterList,
  Archive,
  Unarchive,
  MarkAsUnread,
  Flag,
  Security,
  Notifications,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { messageService } from '../../services/messageService';
import { apiClient } from '../../services/apiClient';
import { UserRole } from '../../types';

// Message interfaces
interface Message {
  id: string;
  threadId: string;
  senderId: string;
  senderName: string;
  senderRole: 'admin' | 'therapist' | 'patient' | 'staff';
  receiverId: string;
  receiverName: string;
  subject: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  isArchived: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments: Attachment[];
  replyToId?: string;
  isEncrypted: boolean;
  deliveryStatus: 'sent' | 'delivered' | 'read';
  tags: string[];
}

interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  url: string;
  uploadedAt: string;
  isSecure: boolean;
}

interface Conversation {
  id: string;
  participants: Participant[];
  lastMessage: Message;
  unreadCount: number;
  isGroup: boolean;
  title?: string;
  updatedAt: string;
}

interface Participant {
  id: string;
  name: string;
  role: 'admin' | 'therapist' | 'patient' | 'staff';
  avatar?: string;
  isOnline: boolean;
  lastSeen?: string;
}

interface MessageFormData {
  receiverId: string;
  subject: string;
  content: string;
  priority: Message['priority'];
  isEncrypted: boolean;
  attachments: File[];
  tags: string[];
  scheduledSend?: Date;
}

interface ApiUser {
  id: string;
  full_name?: string;
  username?: string;
  role?: string;
  is_online?: boolean;
}



interface ThreadMessageLike {
  id: string;
  sender?: {
    id?: string;
    full_name?: string;
    username?: string;
    role?: string;
  };
  content: string;
  created_at: string;
  is_read: boolean;
  is_starred: boolean;
  priority?: Message['priority'];
  attachments?: Attachment[];
}

interface SendMessageResponse {
  thread?: {
    id?: string;
  };
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const stringFrom = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

const booleanFrom = (value: unknown, fallback = false): boolean =>
  typeof value === 'boolean' ? value : fallback;

const toSenderRole = (value: unknown): Message['senderRole'] => {
  switch (value) {
    case 'admin':
    case 'therapist':
    case 'staff':
      return value;
    case 'patient':
    case 'client':
      return 'patient';
    default:
      return 'patient';
  }
};

const toParticipantRole = (value: unknown): Participant['role'] => {
  switch (value) {
    case 'admin':
    case 'therapist':
    case 'staff':
      return value;
    case 'patient':
    case 'client':
      return 'patient';
    default:
      return 'patient';
  }
};

const toPriority = (value: unknown): Message['priority'] => {
  switch (value) {
    case 'low':
    case 'normal':
    case 'high':
    case 'urgent':
      return value;
    default:
      return 'normal';
  }
};

const mapApiUser = (user: ApiUser): { id: string; name: string; role: string; isOnline: boolean } => ({
  id: user.id,
  name: user.full_name || user.username || 'Unknown User',
  role: user.role || 'client',
  isOnline: user.is_online || false,
});

const parseAuthUsersPayload = (payload: unknown): { users: ApiUser[]; next: string | null } => {
  if (Array.isArray(payload)) {
    const users = payload.filter((item): item is ApiUser => isRecord(item) && typeof item.id === 'string');
    return { users, next: null };
  }

  if (isRecord(payload)) {
    const rawResults = Array.isArray(payload.results) ? payload.results : [];
    const users = rawResults.filter((item): item is ApiUser => isRecord(item) && typeof item.id === 'string');
    const next = typeof payload.next === 'string' ? payload.next : null;
    return { users, next };
  }

  return { users: [], next: null };
};

const parseParticipant = (value: unknown): Participant | null => {
  if (!isRecord(value)) {
    return null;
  }

  const id = stringFrom(value.id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: stringFrom(value.full_name) || stringFrom(value.username) || 'Unknown',
    role: toParticipantRole(value.role),
    isOnline: booleanFrom(value.is_online),
  };
};

// Build a Conversation directly from the backend thread response (no per-thread message fetch)
const buildConversationFromThread = (rawThread: unknown, currentUserId: string): Conversation | null => {
  if (!isRecord(rawThread)) return null;
  const id = stringFrom(rawThread.id);
  const updatedAt = stringFrom(rawThread.updated_at);
  if (!id || !updatedAt) return null;

  const parsedParticipants = Array.isArray(rawThread.participants)
    ? (rawThread.participants as unknown[]).map(parseParticipant).filter((p): p is Participant => p !== null)
    : [];

  const rawLastMsg = isRecord(rawThread.last_message) ? rawThread.last_message : null;
  const subject = stringFrom(rawThread.subject) || 'No Subject';

  const lastMessage: Message = rawLastMsg
    ? {
        id: stringFrom(rawLastMsg.id) || `${id}-last`,
        threadId: id,
        senderId: isRecord(rawLastMsg.sender) ? stringFrom(rawLastMsg.sender.id) : '',
        senderName: isRecord(rawLastMsg.sender)
          ? stringFrom(rawLastMsg.sender.full_name) || stringFrom(rawLastMsg.sender.username)
          : '',
        senderRole: isRecord(rawLastMsg.sender) ? toSenderRole(rawLastMsg.sender.role) : 'patient',
        receiverId: parsedParticipants.find(p => p.id !== (isRecord(rawLastMsg.sender) ? rawLastMsg.sender.id : ''))?.id || '',
        receiverName: parsedParticipants.find(p => p.id !== (isRecord(rawLastMsg.sender) ? rawLastMsg.sender.id : ''))?.name || '',
        subject,
        content: stringFrom(rawLastMsg.content),
        timestamp: stringFrom(rawLastMsg.created_at) || updatedAt,
        isRead: true,
        isStarred: false,
        isArchived: false,
        priority: 'normal',
        attachments: [],
        isEncrypted: false,
        deliveryStatus: 'sent',
        tags: [],
      }
    : {
        id: `${id}-placeholder`,
        threadId: id,
        senderId: currentUserId,
        senderName: '',
        senderRole: 'patient',
        receiverId: '',
        receiverName: '',
        subject,
        content: 'No messages yet',
        timestamp: updatedAt,
        isRead: true,
        isStarred: false,
        isArchived: false,
        priority: 'normal',
        attachments: [],
        isEncrypted: false,
        deliveryStatus: 'sent',
        tags: [],
      };

  const unreadCount = typeof rawThread.unread_count === 'number' ? rawThread.unread_count : 0;

  return {
    id,
    participants: parsedParticipants,
    lastMessage,
    unreadCount,
    isGroup: parsedParticipants.length > 2,
    title: stringFrom(rawThread.subject) || undefined,
    updatedAt,
  };
};

const parseThreadMessageLike = (message: unknown): ThreadMessageLike | null => {
  if (!isRecord(message)) {
    return null;
  }

  const id = stringFrom(message.id);
  const content = stringFrom(message.content);
  const createdAt = stringFrom(message.created_at);
  if (!id || !createdAt) {
    return null;
  }

  const sender = isRecord(message.sender)
    ? {
        id: stringFrom(message.sender.id),
        full_name: stringFrom(message.sender.full_name),
        username: stringFrom(message.sender.username),
        role: stringFrom(message.sender.role),
      }
    : undefined;

  return {
    id,
    sender,
    content,
    created_at: createdAt,
    is_read: booleanFrom(message.is_read),
    is_starred: booleanFrom(message.is_starred),
    priority: toPriority(message.priority),
    attachments: Array.isArray(message.attachments) ? (message.attachments as Attachment[]) : [],
  };
};

const Messages: React.FC = () => {
  const { state } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<Array<{id: string, name: string, role: string, isOnline?: boolean}>>([]);
  
  // Load conversations from backend (not mock data)
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tabValue, setTabValue] = useState(0);

  // Load users from backend when component mounts
  useEffect(() => {
    const loadUsers = async () => {
      try {
        // Role-filtered recipient list from the server
        const response: { data: { results: ApiUser[] } } = await apiClient.get('/api/messages/recipients');
        const users = (response.data?.results ?? []).map(mapApiUser);
        setAvailableUsers(users);
      } catch (error: unknown) {
        console.error('Failed to load recipients from API:', error);

        // Fallback: derive contact list from existing threads
        try {
          const threads = await messageService.getThreads();
          const uniqueUsers = new Map<string, { id: string; name: string; role: string; isOnline: boolean }>();
          threads.forEach((thread) => {
            const rawParticipants = Array.isArray(thread.participants) ? thread.participants : [];
            rawParticipants.forEach((participantValue: unknown) => {
              if (!isRecord(participantValue)) return;
              const participantId = stringFrom(participantValue.id);
              if (!participantId || uniqueUsers.has(participantId)) return;
              uniqueUsers.set(participantId, {
                id: participantId,
                name: stringFrom(participantValue.full_name) || stringFrom(participantValue.username) || 'Unknown',
                role: stringFrom(participantValue.role, 'unknown'),
                isOnline: booleanFrom(participantValue.is_online),
              });
            });
          });
          setAvailableUsers(Array.from(uniqueUsers.values()));
        } catch {
          setAvailableUsers([]);
        }
      }
    };

    if (state.user?.id) {
      void loadUsers();
    }
  }, [state.user?.id, state.user?.role]);

  // Load conversations (thread list only — messages fetched lazily on click)
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setIsLoadingMessages(true);
        const rawThreads = await messageService.getThreads();
        const loaded = (Array.isArray(rawThreads) ? rawThreads : [])
          .map((t) => buildConversationFromThread(t, state.user?.id ?? ''))
          .filter((c): c is Conversation => c !== null);
        loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        setConversations(loaded);
        setMessages([]); // messages are loaded lazily per thread
      } catch (error) {
        console.error('Failed to load threads:', error);
        setConversations([]);
      } finally {
        setIsLoadingMessages(false);
      }
    };

    if (state.user?.id) {
      void loadConversations();
    }
  }, [state.user?.id]);

  // Update conversations when user changes
  useEffect(() => {
    // All data now comes from backend API calls
  }, [state.user?.id, state.user?.role]);

  // Filter messages based on active tab
  const getFilteredMessages = () => {
    switch (tabValue) {
      case 1: // Unread
        return messages.filter(m => !m.isRead);
      case 2: // Starred
        return messages.filter(m => m.isStarred);
      case 3: // Archived
        return messages.filter(m => m.isArchived);
      default: // All
        return messages.filter(m => !m.isArchived); // Don't show archived in "All"
    }
  };

  getFilteredMessages();
  
  // Dialog states
  const [composeDialogOpen, setComposeDialogOpen] = useState(false);
  const [messageMenuAnchor, setMessageMenuAnchor] = useState<null | HTMLElement>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Form states
  const [formData, setFormData] = useState<MessageFormData>({
    receiverId: '',
    subject: '',
    content: '',
    priority: 'normal',
    isEncrypted: true,
    attachments: [],
    tags: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [quickReply, setQuickReply] = useState('');
  const [isSendingQuickReply, setIsSendingQuickReply] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);

  // Handle conversation selection — lazy-load messages for the clicked thread
  const handleConversationSelect = async (conversationId: string) => {
    setSelectedConversation(conversationId);
    // Optimistically clear unread badge
    setConversations(prev => prev.map(c =>
      c.id === conversationId ? { ...c, unreadCount: 0 } : c
    ));
    try {
      const conv = conversations.find(c => c.id === conversationId);
      const participants = conv?.participants ?? [];
      const rawMsgs = await messageService.getMessages(conversationId);
      const converted: Message[] = (Array.isArray(rawMsgs) ? rawMsgs : [])
        .map(parseThreadMessageLike)
        .filter((m): m is ThreadMessageLike => m !== null)
        .map((msg) => {
          const senderId = stringFrom(msg.sender?.id);
          const other = participants.find(p => p.id !== senderId);
          return {
            id: msg.id,
            threadId: conversationId,
            senderId,
            senderName: stringFrom(msg.sender?.full_name) || stringFrom(msg.sender?.username),
            senderRole: toSenderRole(msg.sender?.role),
            receiverId: other?.id || '',
            receiverName: other?.name || '',
            subject: conv?.title || 'No Subject',
            content: msg.content,
            timestamp: msg.created_at,
            isRead: msg.is_read,
            isStarred: msg.is_starred,
            isArchived: false,
            priority: toPriority(msg.priority),
            attachments: msg.attachments || [],
            isEncrypted: false,
            deliveryStatus: 'sent' as Message['deliveryStatus'],
            tags: [],
          };
        });
      setMessages(prev => [...prev.filter(m => m.threadId !== conversationId), ...converted]);
    } catch (err) {
      console.error('Failed to load thread messages:', err);
    }
  };

  // Reload thread list, then refresh messages for whichever thread is open
  const reloadConversations = async () => {
    try {
      const rawThreads = await messageService.getThreads();
      const loaded = (Array.isArray(rawThreads) ? rawThreads : [])
        .map((t) => buildConversationFromThread(t, state.user?.id ?? ''))
        .filter((c): c is Conversation => c !== null);
      loaded.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setConversations(loaded);

      // Refresh messages for the currently open thread
      if (selectedConversation) {
        const conv = loaded.find(c => c.id === selectedConversation);
        const participants = conv?.participants ?? [];
        const rawMsgs = await messageService.getMessages(selectedConversation);
        const converted: Message[] = (Array.isArray(rawMsgs) ? rawMsgs : [])
          .map(parseThreadMessageLike)
          .filter((m): m is ThreadMessageLike => m !== null)
          .map((msg) => {
            const senderId = stringFrom(msg.sender?.id);
            const other = participants.find(p => p.id !== senderId);
            return {
              id: msg.id,
              threadId: selectedConversation,
              senderId,
              senderName: stringFrom(msg.sender?.full_name) || stringFrom(msg.sender?.username),
              senderRole: toSenderRole(msg.sender?.role),
              receiverId: other?.id || '',
              receiverName: other?.name || '',
              subject: conv?.title || 'No Subject',
              content: msg.content,
              timestamp: msg.created_at,
              isRead: msg.is_read,
              isStarred: msg.is_starred,
              isArchived: false,
              priority: toPriority(msg.priority),
              attachments: msg.attachments || [],
              isEncrypted: false,
              deliveryStatus: 'sent' as Message['deliveryStatus'],
              tags: [],
            };
          });
        setMessages(prev => [...prev.filter(m => m.threadId !== selectedConversation), ...converted]);
      }
    } catch (error) {
      console.error('Failed to reload conversations:', error);
    }
  };

  // Filter available recipients - exclude current user from the list
  const availableRecipients = availableUsers.filter(u => u.id !== state.user?.id);

  // Filter conversations based on active tab
  const getFilteredConversations = () => {
    switch (tabValue) {
      case 1: // Unread - show conversations with unread messages
        return conversations.filter(c => c.unreadCount > 0);
      case 2: // Sent - show conversations where user has sent messages
        return conversations.filter(c => 
          messages.some(m => m.threadId === c.id && m.senderId === state.user?.id)
        );
      case 3: // Starred - show conversations with starred messages
        return conversations.filter(c => 
          messages.some(m => m.threadId === c.id && m.isStarred)
        );
      case 4: // Archived - show conversations with archived messages
        return conversations.filter(c => 
          messages.some(m => m.threadId === c.id && m.isArchived)
        );
      default: // All - show all non-archived conversations
        return conversations.filter(c => 
          !messages.some(m => m.threadId === c.id && m.isArchived) || 
          messages.filter(m => m.threadId === c.id).every(m => !m.isArchived)
        );
    }
  };

  const filteredConversations = getFilteredConversations();

  const selectedMessages = selectedConversation 
    ? messages.filter(m => m.threadId === selectedConversation).sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    : [];

  // Scroll to bottom of messages
  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMessages]);

  // Form validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.receiverId) errors.receiverId = 'Recipient is required';
    if (!formData.subject.trim()) errors.subject = 'Subject is required';
    if (!formData.content.trim()) errors.content = 'Message content is required';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle quick reply
  const handleQuickReply = async () => {
    if (!quickReply.trim() || !selectedConversation) return;

    setIsSendingQuickReply(true);

    try {
      // Find the conversation to get recipient
      const conversation = conversations.find(c => c.id === selectedConversation);
      if (!conversation) return;

      // Get recipient (the other participant in the conversation)
      const recipient = conversation.participants.find(p => p.id !== state.user?.id);
      if (!recipient) return;

      // Send message
      await messageService.sendMessage({
        recipient_ids: [recipient.id],
        content: quickReply,
        priority: 'normal',
      });

      // Clear quick reply input
      setQuickReply('');

      // Reload conversations to show the new message
      await reloadConversations();
      
      // Keep the conversation selected to see the new message
      setSelectedConversation(selectedConversation);

      setSnackbarMessage('Reply sent successfully!');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to send quick reply:', error);
      setSnackbarMessage('Failed to send reply. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsSendingQuickReply(false);
    }
  };

  // Handle send message
  const handleSendMessage = async () => {
    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // Call backend API to send message
      const response = await messageService.sendMessage({
        recipient_ids: [formData.receiverId],
        subject: formData.subject,
        content: formData.content,
        priority: formData.priority,
      });

      const apiResponse = response as SendMessageResponse;

      // Reload conversations and messages to get the updated data from backend
      await reloadConversations();
      
      // Select the conversation that was just created/updated
      if (apiResponse.thread?.id) {
        console.log('Selecting conversation:', apiResponse.thread.id);
        setSelectedConversation(apiResponse.thread.id);
      }
      
      handleCloseCompose();
      setSnackbarMessage('Message sent successfully!');
      setSnackbarOpen(true);

    } catch (error) {
      console.error('Failed to send message:', error);
      setSnackbarMessage('Failed to send message. Please try again.');
      setSnackbarOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  // Dialog handlers
  const handleOpenCompose = () => {
    setFormData({
      receiverId: '',
      subject: '',
      content: '',
      priority: 'normal',
      isEncrypted: true,
      attachments: [],
      tags: [],
    });
    setFormErrors({});
    setComposeDialogOpen(true);
  };

  const handleCloseCompose = () => {
    setComposeDialogOpen(false);
    setFormErrors({});
  };

  // File handling
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({ ...prev, attachments: [...prev.attachments, ...files] }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  // Menu handlers
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, messageId: string) => {
    setMessageMenuAnchor(event.currentTarget);
    setSelectedMessageId(messageId);
  };

  const handleMenuClose = () => {
    setMessageMenuAnchor(null);
    setSelectedMessageId(null);
  };

  // Message actions
  const toggleStar = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isStarred: !msg.isStarred } : msg
    ));
    handleMenuClose();
  };

  const toggleArchive = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isArchived: !msg.isArchived } : msg
    ));
    handleMenuClose();
  };

  const markAsRead = (messageId: string) => {
    setMessages(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, isRead: true } : msg
    ));
    handleMenuClose();
  };

  const deleteMessage = (messageId: string) => {
    setMessages(prev => prev.filter(msg => msg.id !== messageId));
    handleMenuClose();
    setSnackbarMessage('Message deleted');
    setSnackbarOpen(true);
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'low': return 'info';
      default: return 'default';
    }
  };

  const getDeliveryIcon = (status: Message['deliveryStatus']) => {
    switch (status) {
      case 'sent': return <Check fontSize="small" />;
      case 'delivered': return <CheckCircle fontSize="small" color="primary" />;
      case 'read': return <CheckCircle fontSize="small" color="success" />;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    return Math.round(bytes / 1048576) + ' MB';
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) return <Image />;
    if (fileType === 'application/pdf') return <PictureAsPdf />;
    return <Description />;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, justifyContent: 'space-between', alignItems: { xs: 'stretch', sm: 'center' }, gap: 1.5, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Lock color="primary" />
          <Typography variant="h4" component="h1">
            Secure Messaging
          </Typography>
          <Chip 
            label="HIPAA Compliant" 
            color="success" 
            size="small" 
            icon={<Security />}
          />
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Add />}
          onClick={handleOpenCompose}
          fullWidth={isMobile}
        >
          Compose Message
        </Button>
      </Box>

      {/* Role-based Messaging Info */}
      <Paper sx={{ p: 2, mb: 2, bgcolor: 'info.light' }}>
        <Typography variant="body2">
          {state.user?.role === UserRole.ADMIN && (
            <>
              <strong>Admin Messaging:</strong> You can send secure messages to all therapists, patients, and staff members.
            </>
          )}
          {state.user?.role === UserRole.THERAPIST && (
            <>
              <strong>Therapist Messaging:</strong> You can send secure messages to your assigned patients, administrators, and staff members.
            </>
          )}
          {state.user?.role === UserRole.CLIENT && (
            <>
              <strong>Patient Messaging:</strong> You can send secure messages to your assigned therapist and administrators.
            </>
          )}
          {state.user?.role === UserRole.STAFF && (
            <>
              <strong>Staff Messaging:</strong> You can send secure messages to administrators and therapists.
            </>
          )}
        </Typography>
      </Paper>

      {/* Search and Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, width: '100%' }}
          />
          <IconButton color="primary">
            <FilterList />
          </IconButton>
        </Box>
        
        <Tabs
          value={tabValue}
          onChange={(_event: React.SyntheticEvent, newValue: number) => setTabValue(newValue)}
          sx={{ mt: 2 }}
          variant={isMobile ? 'scrollable' : 'standard'}
          scrollButtons={isMobile ? 'auto' : false}
          allowScrollButtonsMobile
        >
          <Tab 
            label={`All (${conversations.filter(c => 
              !messages.some(m => m.threadId === c.id && m.isArchived) || 
              messages.filter(m => m.threadId === c.id).every(m => !m.isArchived)
            ).length})`} 
            icon={<Folder />} 
            iconPosition="start"
          />
          <Tab 
            label={`Unread (${conversations.filter(c => c.unreadCount > 0).length})`} 
            icon={<Badge badgeContent={conversations.filter(c => c.unreadCount > 0).length} color="error"><Notifications /></Badge>} 
            iconPosition="start"
          />
          <Tab 
            label={`Sent (${conversations.filter(c => 
              messages.some(m => m.threadId === c.id && m.senderId === state.user?.id)
            ).length})`} 
            icon={<Send />} 
            iconPosition="start"
          />
          <Tab 
            label={`Starred (${conversations.filter(c => 
              messages.some(m => m.threadId === c.id && m.isStarred)
            ).length})`} 
            icon={<Star />} 
            iconPosition="start"
          />
          <Tab 
            label={`Archived (${conversations.filter(c => 
              messages.some(m => m.threadId === c.id && m.isArchived)
            ).length})`} 
            icon={<Archive />} 
            iconPosition="start"
          />
        </Tabs>
      </Paper>

      <Grid container spacing={3}>
        {/* Conversations List */}
        {(!isMobile || !selectedConversation) && (
        <Grid item xs={12} md={4}>
          <Paper>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Conversations</Typography>
            </Box>
            <List sx={{ maxHeight: 600, overflow: 'auto' }}>
              {filteredConversations.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography color="text.secondary">
                    {tabValue === 1 ? 'No unread conversations' : 
                     tabValue === 2 ? 'No sent conversations' :
                     tabValue === 3 ? 'No starred conversations' :
                     tabValue === 4 ? 'No archived conversations' :
                     'No conversations yet'}
                  </Typography>
                  <Button 
                    variant="text" 
                    startIcon={<Add />} 
                    onClick={handleOpenCompose}
                    sx={{ mt: 1 }}
                  >
                    Start a conversation
                  </Button>
                </Box>
              ) : (
                isMobile ? (
                  <Box sx={{ p: 1.5, display: 'grid', gap: 1.25 }}>
                    {filteredConversations.map((conversation) => (
                      <Card
                        key={conversation.id}
                        variant="outlined"
                        sx={{
                          borderColor: selectedConversation === conversation.id ? 'primary.main' : undefined,
                          cursor: 'pointer'
                        }}
                        onClick={() => handleConversationSelect(conversation.id)}
                      >
                        <CardContent sx={{ pb: '16px !important' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Badge
                                badgeContent={conversation.unreadCount}
                                color="error"
                                invisible={conversation.unreadCount === 0}
                              >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {conversation.isGroup ? <Group /> : <Person />}
                                </Avatar>
                              </Badge>
                              <Box>
                                <Typography variant="subtitle2">
                                  {conversation.title || conversation.participants
                                    .filter(p => p.id !== state.user?.id)
                                    .map(p => p.name)
                                    .join(', ')
                                  }
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(conversation.lastMessage.timestamp).toLocaleString()}
                                </Typography>
                              </Box>
                            </Box>
                            {conversation.lastMessage.isEncrypted && <Lock fontSize="small" color="primary" />}
                          </Box>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                            {conversation.lastMessage.content}
                          </Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                ) : (
                  filteredConversations.map((conversation) => (
                  <ListItem
                    key={conversation.id}
                    button
                    selected={selectedConversation === conversation.id}
                    onClick={() => handleConversationSelect(conversation.id)}
                  >
                    <ListItemAvatar>
                      <Badge 
                        badgeContent={conversation.unreadCount} 
                        color="error"
                        invisible={conversation.unreadCount === 0}
                      >
                        <Avatar>
                          {conversation.isGroup ? <Group /> : <Person />}
                        </Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {conversation.title || conversation.participants
                            .filter(p => p.id !== state.user?.id)
                            .map(p => p.name)
                            .join(', ')
                          }
                          {conversation.lastMessage.priority === 'urgent' && (
                            <Flag color="error" fontSize="small" />
                          )}
                        </span>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" noWrap component="span" display="block">
                            {conversation.lastMessage.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" component="span" display="block">
                            {new Date(conversation.lastMessage.timestamp).toLocaleString()}
                          </Typography>
                        </>
                      }
                    />
                    <ListItemSecondaryAction>
                      {conversation.lastMessage.isEncrypted && (
                        <Lock fontSize="small" color="primary" />
                      )}
                    </ListItemSecondaryAction>
                  </ListItem>
                ))
                )
              )}
            </List>
          </Paper>
        </Grid>
        )}

        {/* Message Thread */}
        {(!isMobile || selectedConversation) && (
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 600, display: 'flex', flexDirection: 'column' }}>
            {selectedConversation ? (
              <>
                {/* Thread Header */}
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  {isMobile && (
                    <Button size="small" onClick={() => setSelectedConversation(null)} sx={{ mb: 1 }}>
                      Back to conversations
                    </Button>
                  )}
                  <Typography variant="h6">
                    {conversations.find(c => c.id === selectedConversation)?.title ||
                     conversations.find(c => c.id === selectedConversation)?.participants
                       .filter(p => p.id !== state.user?.id)
                       .map(p => p.name)
                       .join(', ')
                    }
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                    {conversations.find(c => c.id === selectedConversation)?.participants.map(p => (
                      <Chip 
                        key={p.id}
                        label={p.name}
                        size="small"
                        avatar={<Avatar>{p.name.charAt(0)}</Avatar>}
                        color={p.isOnline ? 'success' : 'default'}
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>

                {/* Messages */}
                <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                  {selectedMessages.map((message) => (
                    <Box key={message.id} sx={{ mb: 3 }}>
                      <Card 
                        variant="outlined"
                        sx={{ 
                          ml: message.senderId === state.user?.id ? (isMobile ? 0 : 4) : 0,
                          mr: message.senderId === state.user?.id ? 0 : (isMobile ? 0 : 4),
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                            <Box>
                              <Typography variant="subtitle2" color="primary">
                                {message.senderName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {new Date(message.timestamp).toLocaleString()}
                              </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {message.priority !== 'normal' && (
                                <Chip 
                                  label={message.priority}
                                  size="small"
                                  color={getPriorityColor(message.priority)}
                                />
                              )}
                              {message.isEncrypted && <Lock fontSize="small" color="primary" />}
                              {getDeliveryIcon(message.deliveryStatus)}
                              <IconButton 
                                size="small"
                                onClick={(e) => handleMenuOpen(e, message.id)}
                              >
                                <MoreVert />
                              </IconButton>
                            </Box>
                          </Box>
                          
                          <Typography variant="body1" sx={{ mb: 2, color: 'text.primary' }}>
                            {message.content}
                          </Typography>

                          {/* Attachments */}
                          {message.attachments.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Attachments:
                              </Typography>
                              {message.attachments.map((attachment) => (
                                <Chip
                                  key={attachment.id}
                                  icon={getFileIcon(attachment.fileType)}
                                  label={`${attachment.fileName} (${formatFileSize(attachment.fileSize)})`}
                                  onClick={() => {/* Handle download */}}
                                  onDelete={() => {/* Handle remove */}}
                                  deleteIcon={<GetApp />}
                                  sx={{ mr: 1, mb: 1 }}
                                />
                              ))}
                            </Box>
                          )}

                          {/* Tags */}
                          {message.tags.length > 0 && (
                            <Box sx={{ mt: 2 }}>
                              {message.tags.map((tag) => (
                                <Chip 
                                  key={tag}
                                  label={tag}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mr: 0.5 }}
                                />
                              ))}
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </Box>
                  ))}
                  <div ref={messageEndRef} />
                </Box>

                {/* Quick Reply */}
                <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider' }}>
                  <TextField
                    placeholder="Type a quick reply..."
                    fullWidth
                    multiline
                    rows={2}
                    value={quickReply}
                    onChange={(e) => setQuickReply(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        void handleQuickReply();
                      }
                    }}
                    disabled={isSendingQuickReply}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton 
                            color="primary"
                            onClick={() => {
                              void handleQuickReply();
                            }}
                            disabled={!quickReply.trim() || isSendingQuickReply}
                          >
                            {isSendingQuickReply ? <CircularProgress size={20} /> : <Send />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </>
            ) : (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                height: '100%',
                flexDirection: 'column',
                gap: 2
              }}>
                <Typography variant="h6" color="text.secondary">
                  Select a conversation to view messages
                </Typography>
                <Button variant="outlined" onClick={handleOpenCompose}>
                  Start New Conversation
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
        )}
      </Grid>

      {/* Message Actions Menu */}
      <Menu
        anchorEl={messageMenuAnchor}
        open={Boolean(messageMenuAnchor)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => toggleStar(selectedMessageId!)}>
          <Star sx={{ mr: 1 }} />
          {messages.find(m => m.id === selectedMessageId)?.isStarred ? 'Unstar' : 'Star'}
        </MenuItem>
        <MenuItem onClick={() => markAsRead(selectedMessageId!)}>
          <MarkAsUnread sx={{ mr: 1 }} />
          Mark as Read
        </MenuItem>
        <MenuItem>
          <Reply sx={{ mr: 1 }} />
          Reply
        </MenuItem>
        <MenuItem>
          <Forward sx={{ mr: 1 }} />
          Forward
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => toggleArchive(selectedMessageId!)}>
          {messages.find(m => m.id === selectedMessageId)?.isArchived ? (
            <><Unarchive sx={{ mr: 1 }} />Unarchive</>
          ) : (
            <><Archive sx={{ mr: 1 }} />Archive</>
          )}
        </MenuItem>
        <MenuItem onClick={() => deleteMessage(selectedMessageId!)} sx={{ color: 'error.main' }}>
          <Delete sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>

      {/* Compose Message Dialog */}
      <Dialog 
        open={composeDialogOpen} 
        onClose={handleCloseCompose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Lock color="primary" />
            Compose Secure Message
          </Box>
        </DialogTitle>
        <DialogContent>
          {/* Role-based recipient info */}
          {availableRecipients.length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error" gutterBottom variant="h6">
                {isLoadingMessages ? 'Loading available recipients...' : 'No Recipients Available'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {availableUsers.length === 0 
                  ? 'Unable to load users from the system. Please check your connection and try again.'
                  : 'All available users have been filtered out. This might be a configuration issue.'
                }
              </Typography>
              {!isLoadingMessages && (
                <Button 
                  variant="outlined" 
                  onClick={() => window.location.reload()}
                  sx={{ mt: 1 }}
                >
                  Reload Page
                </Button>
              )}
              <Typography variant="caption" display="block" sx={{ mt: 2, color: 'text.disabled' }}>
                Debug: {availableUsers.length} users loaded, {availableRecipients.length} available after filtering
              </Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ mb: 2, mt: 1, p: 1.5, bgcolor: 'info.light', borderRadius: 1 }}>
                <Typography variant="caption" display="block">
                  <strong>Available Recipients ({availableRecipients.length}):</strong>{' '}
                  {state.user?.role === UserRole.ADMIN && 'All users in the system'}
                  {state.user?.role === UserRole.THERAPIST && 'Your assigned patients, admins, and staff'}
                  {state.user?.role === UserRole.CLIENT && 'Your therapist and admins'}
                  {state.user?.role === UserRole.STAFF && 'Admins and therapists'}
                </Typography>
              </Box>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <FormControl fullWidth error={!!formErrors.receiverId}>
                    <InputLabel>Recipient</InputLabel>
                    <Select
                      value={formData.receiverId}
                      label="Recipient"
                      onChange={(e) => setFormData(prev => ({ ...prev, receiverId: e.target.value }))}
                    >
                      {availableRecipients.length === 0 ? (
                        <MenuItem disabled>No available recipients</MenuItem>
                      ) : (
                        availableRecipients.map((user) => (
                          <MenuItem key={user.id} value={user.id}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Avatar sx={{ width: 24, height: 24 }}>
                                {user.name.charAt(0)}
                              </Avatar>
                              {user.name} ({user.role})
                              {user.isOnline && (
                                <Chip label="Online" size="small" color="success" />
                              )}
                            </Box>
                          </MenuItem>
                        ))
                      )}
                    </Select>
                  </FormControl>
                </Grid>

            <Grid item xs={12} sm={8}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                error={!!formErrors.subject}
                helperText={formErrors.subject}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={formData.priority}
                  label="Priority"
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as Message['priority'] }))}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="normal">Normal</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={6}
                label="Message"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                error={!!formErrors.content}
                helperText={formErrors.content}
                placeholder="Type your secure message here..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Button
                  variant="outlined"
                  startIcon={<AttachFile />}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Attach Files
                </Button>
                <Chip 
                  icon={<Lock />}
                  label="End-to-End Encrypted"
                  color="success"
                  size="small"
                />
              </Box>

              {/* Attachments */}
              {formData.attachments.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Attachments:
                  </Typography>
                  {formData.attachments.map((file, index) => (
                    <Chip
                      key={index}
                      label={`${file.name} (${formatFileSize(file.size)})`}
                      onDelete={() => removeAttachment(index)}
                      sx={{ mr: 1, mb: 1 }}
                    />
                  ))}
                </Box>
              )}

              <input
                ref={fileInputRef}
                type="file"
                multiple
                hidden
                onChange={handleFileSelect}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
            </Grid>
          </Grid>
          </>
          )}

          {isLoading && <LinearProgress sx={{ mt: 2 }} />}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCompose}>Cancel</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              void handleSendMessage();
            }}
            disabled={isLoading || !formData.receiverId || !formData.subject || !formData.content}
            startIcon={isLoading ? <CircularProgress size={20} /> : <Send />}
          >
            {isLoading ? 'Sending...' : 'Send Message'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default Messages;