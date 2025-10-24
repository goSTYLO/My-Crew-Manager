//chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MoreVertical, Paperclip, Smile, Phone, Video, MessageSquare, ArrowLeft, Users, X, Plus, Check } from 'lucide-react';
import Sidebar from "../../components/sidebarUser";
import TopNavbar from "../../components/topbarLayout_user";
import { useTheme } from "../../components/themeContext";

// API Configuration
const API_BASE_URL = import.meta.env.REACT_APP_API_URL || 'http://localhost:8000/api/chat';
const WS_BASE_URL = import.meta.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws/chat';

// Types
interface Contact {
  id: number;
  name: string;
  role: string;
  avatar: string;
  online: boolean;
  lastMessage: string;
  time: string;
  unread: number;
  isGroup: boolean;
  members?: number[];
}

interface Message {
  id: number;
  sender: 'me' | 'them';
  text: string;
  time: string;
  sender_id?: number;
  message_id?: number;
  reply_to_id?: number;
}

interface Room {
  room_id: number;
  name: string | null;
  is_private: boolean;
  created_by_id: number;
  created_at: string;
  members_count: number;
}

interface ApiMessage {
  message_id: number;
  room_id: number;
  sender_id: number;
  sender_username: string;
  content: string;
  message_type: string;
  reply_to_id: number | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
}

interface UserData {
  id: number;
  name: string;
  email: string;
}

const ChatApp = () => {
  const { theme } = useTheme();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactList, setShowContactList] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [searchMember, setSearchMember] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [memberEmails, setMemberEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<number | null>(null);
  const [editingGroupName, setEditingGroupName] = useState('');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [showEditPictureModal, setShowEditPictureModal] = useState(false);
  const [groupMembers, setGroupMembers] = useState<any[]>([]);
  const [newNickname, setNewNickname] = useState('');
  const [selectedGroupPicture, setSelectedGroupPicture] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>('');
  const [messageToDelete, setMessageToDelete] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMessageMenu, setShowMessageMenu] = useState<number | null>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messageMenuRef = useRef<HTMLDivElement | null>(null);
  const emojiPickerRef = useRef<HTMLDivElement | null>(null);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [addMemberEmail, setAddMemberEmail] = useState('');
  const [addMemberError, setAddMemberError] = useState<string | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const wsNotificationRef = useRef<WebSocket | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get auth token from localStorage
  const getAuthToken = () => {
    // Try different possible token storage keys
    const token = localStorage.getItem('authToken') || 
                  localStorage.getItem('token') || 
                  localStorage.getItem('auth_token') ||
                  sessionStorage.getItem('authToken') ||
                  sessionStorage.getItem('token');
    
    if (!token) {
      console.error('⚠️ No auth token found in localStorage. Please login first.');
    }
    return token || '';
  };

  // Get current user data
  const getCurrentUser = async () => {
    try {
      const token = getAuthToken();
      const response = await fetch('http://localhost:8000/api/user/me/', {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const userData: UserData = await response.json();
        setCurrentUserId(userData.id);
        console.log('✅ Current user loaded:', userData);
        return userData;
      }
    } catch (err) {
      console.error('Failed to fetch current user:', err);
    }
    return null;
  };

  // API Helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    console.log('🔵 API Call:', `${API_BASE_URL}${endpoint}`);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error:', response.status, errorText);
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('✅ API Response:', data);
    return data;
  };

  // Fetch rooms on mount
  useEffect(() => {
    const init = async () => {
      const user = await getCurrentUser();
      if (user) {
        await fetchRooms();
        
        // Temporarily disable WebSocket for testing
        // Uncomment when Django Channels + Redis is configured
        // connectNotificationWebSocket();
        
        console.log('⚠️ WebSocket notifications disabled. Enable after configuring Django Channels + Redis');
      } else {
        setError('Please login to use chat');
      }
    };
    
    init();
    
    return () => {
      if (wsNotificationRef.current) {
        wsNotificationRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowGroupMenu(false);
      }
      if (messageMenuRef.current && !messageMenuRef.current.contains(event.target as Node)) {
        setShowMessageMenu(null);
      }
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
        setShowEmojiPicker(false);
      }
    };

    if (showGroupMenu || showMessageMenu !== null || showEmojiPicker) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showGroupMenu, showMessageMenu, showEmojiPicker]);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedChat]);

  // Fetch rooms from API
  const fetchRooms = async () => {
    try {
      setLoading(true);
      const rooms: Room[] = await apiCall('/rooms/');
      
      // Convert rooms to contacts format
      const contactsList: Contact[] = rooms.map(room => {
        // Check if we already have this room with messages
        const existingContact = contacts.find(c => c.id === room.room_id);
        const existingMessages = messages[room.room_id];
        
        let lastMessage = 'No messages yet';
        let lastTime = new Date(room.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
        
        // If we have messages, use the last message
        if (existingMessages && existingMessages.length > 0) {
          const lastMsg = existingMessages[existingMessages.length - 1];
          lastMessage = lastMsg.text;
          lastTime = lastMsg.time;
        } else if (existingContact && existingContact.lastMessage !== 'No messages yet') {
          // Keep existing last message if available
          lastMessage = existingContact.lastMessage;
          lastTime = existingContact.time;
        }
        
        return {
          id: room.room_id,
          name: room.name || `Room ${room.room_id}`,
          role: room.is_private ? 'Private' : `${room.members_count} members`,
          avatar: room.is_private ? 'DM' : 'GP',
          online: false,
          lastMessage: lastMessage,
          time: lastTime,
          unread: existingContact?.unread || 0,
          isGroup: !room.is_private,
          members: []
        };
      });
      
      setContacts(contactsList);
    } catch (err) {
      setError('Failed to fetch rooms');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    try {
      console.log('📥 Fetching messages for room:', roomId);
      console.log('👤 Current user ID:', currentUserId);
      const msgs: ApiMessage[] = await apiCall(`/rooms/${roomId}/messages/`);
      
      // Check if we already have messages for this room to preserve sender status
      const existingMessages = messages[roomId];
      
      const formattedMessages: Message[] = msgs.map(msg => {
        // Check if this message already exists in our state
        const existingMsg = existingMessages?.find(m => m.message_id === msg.message_id);
        
        // Always determine sender based on currentUserId comparison
        // This ensures YOUR messages (where sender_id matches currentUserId) always appear on the right
        const isMyMessage = msg.sender_id === currentUserId;
        
        // If message exists, preserve its sender status ONLY if it was 'me'
        // This prevents your own messages from moving to the left
        let sender: 'me' | 'them';
        if (existingMsg && existingMsg.sender === 'me') {
          sender = 'me';
          console.log(`♻️ Preserving YOUR message ${msg.message_id} on the right`);
        } else {
          // For all other cases, determine based on sender_id
          sender = isMyMessage ? 'me' : 'them';
          console.log(`🆕 Message ${msg.message_id}: sender_id=${msg.sender_id}, currentUserId=${currentUserId}, positioned as '${sender}'`);
        }
        
        return {
          id: msg.message_id,
          sender: sender,
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sender_id: msg.sender_id,
          message_id: msg.message_id,
          reply_to_id: msg.reply_to_id || undefined
        };
      });
      
      console.log('✅ Messages formatted:', formattedMessages.length);
      setMessages(prev => ({
        ...prev,
        [roomId]: formattedMessages
      }));
      
      // Update the last message in contacts after fetching
      if (formattedMessages.length > 0) {
        const lastMsg = formattedMessages[formattedMessages.length - 1];
        setContacts(prev => prev.map(contact => 
          contact.id === roomId 
            ? { ...contact, lastMessage: lastMsg.text, time: lastMsg.time }
            : contact
        ));
      }
    } catch (err) {
      console.error('❌ Failed to fetch messages:', err);
      setError('Failed to load messages');
    }
  };

  // Connect to WebSocket for a specific room
  const connectRoomWebSocket = (roomId: number) => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ Cannot connect WebSocket: No auth token');
      return;
    }

    // Close existing connection
    if (wsRef.current) {
      wsRef.current.close();
    }

    const wsUrl = `${WS_BASE_URL}/${roomId}/?token=${token}`;
    console.log('🔌 Attempting WebSocket connection:', wsUrl);
    
    try {
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected for room:', roomId);
      };
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log('📨 WebSocket message received:', data);
        
        switch (data.type) {
          case 'chat_message':
            handleNewMessage(roomId, data.message, data.user_id);
            break;
          case 'user_joined':
            console.log('👋 User joined:', data.user);
            break;
          case 'user_left':
            console.log('👋 User left:', data.user);
            break;
          case 'typing':
            // Handle typing indicator
            break;
          case 'stop_typing':
            // Handle stop typing
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error (This is normal if backend WebSocket is not configured yet):', error);
        console.log('💡 Messages will still work via REST API polling');
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected from room:', roomId);
        if (event.code === 1006) {
          console.log('⚠️ WebSocket closed abnormally. Backend WebSocket may not be configured.');
          console.log('💡 Configure Django Channels + Redis for real-time features');
        }
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      console.log('💡 Continuing without WebSocket. Messages will work via REST API.');
    }
  };

  // Connect to notification WebSocket
  const connectNotificationWebSocket = () => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ Cannot connect notification WebSocket: No auth token');
      return;
    }

    // According to routing.py: ws/chat/notifications/
    const wsUrl = `ws://localhost:8000/ws/chat/notifications/?token=${token}`;
    console.log('🔔 Connecting to notification WebSocket:', wsUrl);
    
    const ws = new WebSocket(wsUrl);
    
    ws.onopen = () => {
      console.log('✅ Notification WebSocket connected');
    };
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log('🔔 Notification received:', data);
      
      switch (data.type) {
        case 'new_message':
          // Update unread count for the room
          updateUnreadCount(data.room_id);
          break;
        case 'room_invitation':
          // Refresh rooms list
          fetchRooms();
          break;
        case 'direct_room_created':
          // Refresh rooms list
          fetchRooms();
          break;
      }
    };
    
    ws.onerror = (error) => {
      console.error('❌ Notification WebSocket error:', error);
      console.error('Make sure Django Channels and Redis are running');
      console.error('Check asgi.py routing configuration');
    };
    
    ws.onclose = (event) => {
      console.log('🔔 Notification WebSocket disconnected. Code:', event.code, 'Reason:', event.reason);
      
      // Auto-reconnect after 5 seconds if not manually closed
      if (event.code !== 1000) {
        console.log('🔄 Attempting to reconnect in 5 seconds...');
        setTimeout(() => {
          if (wsNotificationRef.current?.readyState === WebSocket.CLOSED) {
            connectNotificationWebSocket();
          }
        }, 5000);
      }
    };
    
    wsNotificationRef.current = ws;
  };

  // Handle new message from WebSocket
  const handleNewMessage = (roomId: number, messageData: ApiMessage, senderId: number) => {
    // Use the stored currentUserId to determine if message is from current user
    const newMessage: Message = {
      id: messageData.message_id,
      sender: senderId === currentUserId ? 'me' : 'them',
      text: messageData.content,
      time: new Date(messageData.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sender_id: senderId,
      message_id: messageData.message_id
    };
    
    setMessages(prev => ({
      ...prev,
      [roomId]: [...(prev[roomId] || []), newMessage]
    }));
    
    // Update last message in contacts
    setContacts(prev => prev.map(contact => 
      contact.id === roomId 
        ? { ...contact, lastMessage: messageData.content, time: 'Just now' }
        : contact
    ));
  };

  // Update unread count
  const updateUnreadCount = (roomId: number) => {
    if (selectedChat !== roomId) {
      setContacts(prev => prev.map(contact => 
        contact.id === roomId 
          ? { ...contact, unread: contact.unread + 1 }
          : contact
      ));
    }
  };

  // Send message via API
  const handleSendMessage = async () => {
    if (message.trim() && selectedChat) {
      const messageText = message;
      setMessage(''); // Clear input immediately
      
      try {
        const response = await apiCall(`/rooms/${selectedChat}/messages/`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageText,
            message_type: 'text'
          })
        });
        
        // Immediately display the message on the right side using stored currentUserId
        const newMessage: Message = {
          id: response.message_id || Date.now(),
          sender: 'me', // Always 'me' for sent messages
          text: messageText,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          sender_id: currentUserId || undefined,
          message_id: response.message_id
        };
        
        setMessages(prev => ({
          ...prev,
          [selectedChat]: [...(prev[selectedChat] || []), newMessage]
        }));
        
        // Update last message in contacts
        setContacts(prev => prev.map(contact => 
          contact.id === selectedChat 
            ? { ...contact, lastMessage: messageText, time: 'Just now' }
            : contact
        ));
        
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message');
        setMessage(messageText); // Restore message on error
      }
    }
  };

  // Select chat and load messages
  const handleSelectChat = (id: number) => {
    setSelectedChat(id);
    setShowContactList(false);
    setShowGroupMenu(false); // Close menu when switching chats
    
    // Close existing WebSocket
    if (wsRef.current) {
      wsRef.current.close();
    }
    
    // Fetch messages and connect WebSocket
    fetchMessages(id);
    connectRoomWebSocket(id);
    
    // Reset unread count
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, unread: 0 } : contact
    ));
  };

  const handleBackToContacts = () => {
    setShowContactList(true);
    setShowGroupMenu(false); // Close menu when going back
  };

  const getCurrentMessages = () => {
    return messages[selectedChat!] || [];
  };

  // Fetch available members for group creation
  const [availableMembers, setAvailableMembers] = useState<Contact[]>([]);

  useEffect(() => {
    // In a real app, you'd fetch all users from an endpoint
    // For now, we'll use existing contacts as available members
    setAvailableMembers(contacts.filter(c => !c.isGroup));
  }, [contacts]);

  const filteredMembers = availableMembers.filter(member =>
    member.name.toLowerCase().includes(searchMember.toLowerCase()) ||
    member.role.toLowerCase().includes(searchMember.toLowerCase())
  );

  const toggleMemberSelection = (memberId: number) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Validate email format
  const isValidEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add email to the list
  const handleAddEmail = () => {
    const email = emailInput.trim().toLowerCase();
    
    if (!email) {
      setEmailError('Please enter an email address');
      return;
    }
    
    if (!isValidEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    if (memberEmails.includes(email)) {
      setEmailError('This email is already added');
      return;
    }
    
    setMemberEmails(prev => [...prev, email]);
    setEmailInput('');
    setEmailError(null);
    console.log('✅ Email added:', email);
  };

  // Remove email from the list
  const handleRemoveEmail = (email: string) => {
    setMemberEmails(prev => prev.filter(e => e !== email));
    console.log('🗑️ Email removed:', email);
  };

  // Update group name
  const handleUpdateGroupName = async () => {
    if (editingGroupId && editingGroupName.trim()) {
      try {
        const oldName = contacts.find(c => c.id === editingGroupId)?.name;
        
        await apiCall(`/rooms/${editingGroupId}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            name: editingGroupName
          })
        });
        
        // Update local state
        setContacts(prev => prev.map(contact => 
          contact.id === editingGroupId 
            ? { ...contact, name: editingGroupName }
            : contact
        ));
        
        // Add system message to chat
        if (selectedChat === editingGroupId) {
          const systemMessage: Message = {
            id: Date.now(),
            sender: 'them',
            text: `📝 Group name changed from "${oldName}" to "${editingGroupName}"`,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            message_id: Date.now()
          };
          
          setMessages(prev => ({
            ...prev,
            [editingGroupId]: [...(prev[editingGroupId] || []), systemMessage]
          }));
        }
        
        setEditingGroupId(null);
        setEditingGroupName('');
        setShowGroupMenu(false);
        console.log('✅ Group name updated');
      } catch (err) {
        console.error('❌ Failed to update group name:', err);
        setError('Failed to update group name');
      }
    }
  };

  // Fetch group members
  const fetchGroupMembers = async (roomId: number) => {
    try {
      const members = await apiCall(`/rooms/${roomId}/members/`);
      console.log('✅ Group members loaded:', members);
      console.log('📊 First member structure:', members[0]); // Debug: see the exact structure
      console.log('📊 All member keys:', members.map((m: any) => Object.keys(m))); // Debug: see all keys
      setGroupMembers(members);
    } catch (err) {
      console.error('❌ Failed to fetch group members:', err);
      setError('Failed to load group members');
    }
  };


  // Update nickname
  const handleUpdateNickname = async () => {
    if (selectedChat && newNickname.trim()) {
      try {
        await apiCall(`/rooms/${selectedChat}/nickname/`, {
          method: 'POST',
          body: JSON.stringify({
            nickname: newNickname
          })
        });
        
        // Add system message to chat
        const systemMessage: Message = {
          id: Date.now(),
          sender: 'them',
          text: `✏️ You changed your nickname to "${newNickname}"`,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          message_id: Date.now()
        };
        
        setMessages(prev => ({
          ...prev,
          [selectedChat]: [...(prev[selectedChat] || []), systemMessage]
        }));
        
        console.log('✅ Nickname updated');
        setShowNicknameModal(false);
        setNewNickname('');
        setShowGroupMenu(false);
      } catch (err) {
        console.error('❌ Failed to update nickname:', err);
        setError('Failed to update nickname');
      }
    }
  };

  // Update group picture
  const handleUpdateGroupPicture = async () => {
    if (selectedChat && selectedFile) {
      try {
        const formData = new FormData();
        formData.append('picture', selectedFile);
        
        const token = getAuthToken();
        const response = await fetch(`${API_BASE_URL}/rooms/${selectedChat}/`, {
          method: 'PATCH',
          headers: {
            'Authorization': `Token ${token}`,
          },
          body: formData
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Update local state with new picture URL
          setContacts(prev => prev.map(contact => 
            contact.id === selectedChat 
              ? { ...contact, avatar: data.picture || contact.avatar }
              : contact
          ));
          
          // Add system message to chat
          const systemMessage: Message = {
            id: Date.now(),
            sender: 'them',
            text: `🖼️ Group picture was updated`,
            time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            message_id: Date.now()
          };
          
          setMessages(prev => ({
            ...prev,
            [selectedChat]: [...(prev[selectedChat] || []), systemMessage]
          }));
          
          setShowEditPictureModal(false);
          setSelectedFile(null);
          setPreviewImage('');
          setShowGroupMenu(false);
          console.log('✅ Group picture updated');
        } else {
          const errorText = await response.text();
          console.error('❌ Failed to update picture:', response.status, errorText);
          throw new Error('Failed to update picture');
        }
      } catch (err) {
        console.error('❌ Failed to update group picture:', err);
        setError('Failed to update group picture');
      }
    }
  };


  // Handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if file is an image
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }
      
      setSelectedFile(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Delete message
  const handleDeleteMessage = async (messageId: number) => {
    if (!selectedChat) return;
    
    try {
      const token = getAuthToken();
      
      console.log('🗑️ Attempting to delete message:', messageId, 'from room:', selectedChat);
      
      // Try multiple endpoint formats based on common Django REST patterns
      const endpoints = [
        `http://localhost:8000/api/chat/messages/${messageId}/`,
        `${API_BASE_URL}/rooms/${selectedChat}/messages/${messageId}/delete/`,
        `${API_BASE_URL}/messages/${messageId}/delete/`,
        `${API_BASE_URL}/rooms/${selectedChat}/messages/${messageId}/`,
        `http://localhost:8000/api/messages/${messageId}/`,
      ];
      
      let success = false;
      let lastError = null;
      
      for (const endpoint of endpoints) {
        try {
          console.log('🔄 Trying endpoint:', endpoint);
          
          const response = await fetch(endpoint, {
            method: endpoint.includes('/delete/') ? 'POST' : 'DELETE',
            headers: {
              'Authorization': `Token ${token}`,
              'Content-Type': 'application/json',
            },
          });
          
          if (response.ok || response.status === 204) {
            console.log('✅ Successfully deleted with endpoint:', endpoint);
            success = true;
            break;
          } else if (response.status !== 404) {
            // If it's not 404, this might be the right endpoint with different error
            const errorData = await response.json().catch(() => ({}));
            lastError = errorData;
            console.log('⚠️ Got non-404 error, might be permission issue:', response.status, errorData);
          }
        } catch (err) {
          console.log('❌ Endpoint failed:', endpoint, err);
        }
      }
      
      if (success) {
        // Remove message from local state
        setMessages(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat].filter(msg => msg.message_id !== messageId)
        }));
        
        setShowDeleteConfirm(false);
        setMessageToDelete(null);
        console.log('✅ Message deleted successfully');
      } else {
        console.error('❌ All endpoints failed. Last error:', lastError);
        setError(
          lastError?.detail || 
          'Failed to delete message. Please check your Django backend URLs configuration. ' +
          'Expected endpoints: /api/chat/messages/{id}/ or /api/chat/rooms/{room_id}/messages/{message_id}/'
        );
        setShowDeleteConfirm(false);
      }
    } catch (err) {
      console.error('❌ Failed to delete message:', err);
      setError('Failed to delete message. Please check console for endpoint details.');
      setShowDeleteConfirm(false);
    }
  };

  // Emoji data
  const emojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '🥴', '😵', '🤯', '🤠', '🥳', '😎', '🤓',
    '🧐', '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺',
    '😦', '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣',
    '😞', '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '😈',
    '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤏', '✌️', '🤞', '🤟',
    '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎',
    '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '🔥',
    '✨', '🌟', '💫', '⭐', '🌈', '☀️', '🌙', '⚡', '☁️', '🌸'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    setMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const selectedContact = contacts.find(c => c.id === selectedChat);

  // Filter contacts based on search query
  const filteredContacts = contacts.filter(contact =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className={`min-h-screen flex flex-col ${theme === "dark" ? "bg-gray-900" : "bg-gray-50"}`}>
      {/* Top Navbar */}
      <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        {/* Chat Interface */}
        <div className={`flex-1 mt-[70px] rounded-none md:rounded-lg shadow-none md:shadow-lg overflow-hidden flex flex-col h-[calc(100vh-70px)] ${
          theme === "dark" ? "bg-gray-800" : "bg-white"
        }`}>
          {error && (
            <div className="bg-red-500 text-white px-4 py-2 text-sm">
              {error}
              <button onClick={() => setError(null)} className="ml-2 underline">Dismiss</button>
            </div>
          )}
          
          <div className="flex h-full">
            {/* Contacts Sidebar */}
            <div className={`${showContactList ? 'flex' : 'hidden'} md:flex w-full md:w-80 flex-col ${
              theme === "dark" ? "border-r border-gray-700" : "border-r border-gray-200"
            }`}>
              {/* Search Button */}
              <div className={`p-4 ${theme === "dark" ? "border-b border-gray-700" : "border-b border-gray-200"}`}>
                <div className="relative mb-3">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`} />
                  <input
                    type="text"
                    placeholder="Search conversations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === "dark" 
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500" 
                        : "border-gray-300"
                    }`}
                  />
                </div>
                
              </div>

              {/* Contact List */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="p-4 text-center text-gray-500">Loading...</div>
                ) : filteredContacts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    {searchQuery ? 'No conversations found' : 'No conversations yet'}
                  </div>
                ) : (
                  filteredContacts.map(contact => (
                    <div
                      key={contact.id}
                      onClick={() => handleSelectChat(contact.id)}
                      className={`p-4 cursor-pointer transition-colors ${
                        theme === "dark" 
                          ? `border-b border-gray-700 hover:bg-gray-700 ${selectedChat === contact.id ? 'bg-gray-700' : ''}`
                          : `border-b border-gray-100 hover:bg-gray-50 ${selectedChat === contact.id ? 'bg-blue-50' : ''}`
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold ${
                            contact.isGroup 
                              ? 'bg-gradient-to-br from-green-500 to-teal-600' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {contact.isGroup ? <Users className="w-6 h-6" /> : contact.avatar}
                          </div>
                          {contact.online && !contact.isGroup && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                              theme === "dark" ? "border-2 border-gray-800" : "border-2 border-white"
                            }`}></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className={`font-semibold truncate ${
                              theme === "dark" ? "text-white" : "text-gray-800"
                            }`}>{contact.name}</h3>
                            <span className={`text-xs ${
                              theme === "dark" ? "text-gray-400" : "text-gray-500"
                            }`}>{contact.time}</span>
                          </div>
                          <p className={`text-sm truncate ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>{contact.role}</p>
                          <p className={`text-sm truncate mt-1 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`}>{contact.lastMessage}</p>
                        </div>
                        {contact.unread > 0 && (
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                            {contact.unread}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`${!showContactList || selectedChat ? 'flex' : 'hidden'} md:flex flex-1 flex-col w-full md:w-auto`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className={`p-4 ${
                    theme === "dark" 
                      ? "border-b border-gray-700 bg-gray-800" 
                      : "border-b border-gray-200 bg-white"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <button 
                          onClick={handleBackToContacts}
                          className={`md:hidden p-2 rounded-lg transition-colors ${
                            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                        >
                          <ArrowLeft className={`w-5 h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        <div className="relative flex-shrink-0">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                            selectedContact?.isGroup 
                              ? 'bg-gradient-to-br from-green-500 to-teal-600' 
                              : 'bg-gradient-to-br from-blue-500 to-purple-600'
                          }`}>
                            {selectedContact?.isGroup ? <Users className="w-5 h-5" /> : selectedContact?.avatar}
                          </div>
                          {selectedContact?.online && !selectedContact?.isGroup && (
                            <div className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${
                              theme === "dark" ? "border-2 border-gray-800" : "border-2 border-white"
                            }`}></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          {editingGroupId === selectedChat ? (
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={editingGroupName}
                                onChange={(e) => setEditingGroupName(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleUpdateGroupName()}
                                className={`px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm ${
                                  theme === "dark"
                                    ? "bg-gray-900 border-gray-700 text-white"
                                    : "border-gray-300"
                                }`}
                                autoFocus
                              />
                              <button
                                onClick={handleUpdateGroupName}
                                className="p-1 text-green-600 hover:text-green-700"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingGroupId(null);
                                  setEditingGroupName('');
                                }}
                                className="p-1 text-red-600 hover:text-red-700"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2">
                                <h2 className={`font-semibold truncate ${
                                  theme === "dark" ? "text-white" : "text-gray-800"
                                }`}>{selectedContact?.name}</h2>
                                {selectedContact?.isGroup && (
                                  <button
                                    onClick={() => {
                                      setEditingGroupId(selectedChat);
                                      setEditingGroupName(selectedContact.name);
                                    }}
                                    className={`p-1 rounded transition-colors ${
                                      theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                                    }`}
                                  >
                                    <svg className={`w-3 h-3 ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </button>
                                )}
                              </div>
                              <p className={`text-sm truncate ${
                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                              }`}>{selectedContact?.role}</p>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 md:gap-2">
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}>
                          <Phone className={`w-4 h-4 md:w-5 md:h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        <button className={`p-2 rounded-lg transition-colors ${
                          theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                        }`}>
                          <Video className={`w-4 h-4 md:w-5 md:h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        {selectedContact?.isGroup && (
                          <div className="relative" ref={menuRef}>
                            <button 
                              onClick={() => setShowGroupMenu(!showGroupMenu)}
                              className={`p-2 rounded-lg transition-colors ${
                                theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                              }`}
                            >
                              <MoreVertical className={`w-4 h-4 md:w-5 md:h-5 ${
                                theme === "dark" ? "text-gray-300" : "text-gray-600"
                              }`} />
                            </button>
                            
                            {/* Group Menu Dropdown */}
                            {showGroupMenu && (
                              <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg z-50 ${
                                theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                              }`}>
                                <div className="py-1">
                                  <button
                                    onClick={() => {
                                      setEditingGroupId(selectedChat);
                                      setEditingGroupName(selectedContact.name);
                                      setShowGroupMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
                                      theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                    Change Group Name
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setShowEditPictureModal(true);
                                      setShowGroupMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
                                      theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Edit Group Picture
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      fetchGroupMembers(selectedChat!);
                                      setShowMembersModal(true);
                                      setShowGroupMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
                                      theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <Users className="w-4 h-4" />
                                    View Members
                                  </button>
                                  
                                  <button
                                    onClick={() => {
                                      setShowNicknameModal(true);
                                      setShowGroupMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
                                      theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                    Set Nickname
                                  </button>
                                  
                                  <div className={`border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                                  
                                  <button
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 text-red-500 hover:bg-red-50 ${
                                      theme === "dark" ? "hover:bg-red-900/20" : ""
                                    }`}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Leave Group
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        {!selectedContact?.isGroup && (
                          <button className={`p-2 rounded-lg transition-colors ${
                            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}>
                            <MoreVertical className={`w-4 h-4 md:w-5 md:h-5 ${
                              theme === "dark" ? "text-gray-300" : "text-gray-600"
                            }`} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className={`flex-1 overflow-y-auto p-3 md:p-4 ${
                    theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                  }`}>
                    <div className="space-y-3 md:space-y-4">
                      {getCurrentMessages().map(msg => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'} group`}
                        >
                          <div className={`flex items-start gap-2 ${msg.sender === 'me' ? 'flex-row-reverse' : 'flex-row'}`}>
                            {/* Message Bubble */}
                            <div className={`flex flex-col ${msg.sender === 'me' ? 'items-end' : 'items-start'}`}>
                              {/* Sender Label */}
                              <span className={`text-xs font-medium mb-1 px-1 ${
                                msg.sender === 'me'
                                  ? theme === "dark" ? "text-blue-400" : "text-blue-600"
                                  : theme === "dark" ? "text-gray-400" : "text-gray-600"
                              }`}>
                                {msg.sender === 'me' ? 'You' : 'Member'}
                              </span>
                              
                              <div
                                className={`max-w-[85%] md:max-w-md px-3 md:px-4 py-2 rounded-lg ${
                                  msg.sender === 'me'
                                    ? 'bg-blue-600 text-white'
                                    : theme === "dark"
                                    ? 'bg-gray-800 text-gray-100 border border-gray-700'
                                    : 'bg-white text-gray-800 border border-gray-200'
                                }`}
                              >
                                <p className="text-sm break-words">{msg.text}</p>
                                <p
                                  className={`text-xs mt-1 ${
                                    msg.sender === 'me' 
                                      ? 'text-blue-200' 
                                      : theme === "dark"
                                      ? 'text-gray-400'
                                      : 'text-gray-500'
                                  }`}
                                >
                                  {msg.time}
                                </p>
                              </div>
                            </div>
                            
                            {/* 3-Dots Menu - For ALL messages (both 'me' and 'them') */}
                            {msg.message_id && (
                              <div className="relative opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" ref={showMessageMenu === msg.message_id ? messageMenuRef : null}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowMessageMenu(showMessageMenu === msg.message_id ? null : msg.message_id);
                                  }}
                                  className={`p-1.5 rounded-lg ${
                                    theme === "dark" ? "hover:bg-gray-700 text-gray-400" : "hover:bg-gray-200 text-gray-500"
                                  }`}
                                  title="Message options"
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                
                                {/* Message Menu Dropdown */}
                                {showMessageMenu === msg.message_id && (
                                  <div className={`absolute ${msg.sender === 'me' ? 'right-0' : 'left-0'} mt-1 w-44 rounded-lg shadow-xl z-50 ${
                                    theme === "dark" ? "bg-gray-800 border border-gray-700" : "bg-white border border-gray-200"
                                  }`}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setMessageToDelete(msg.message_id!);
                                        setShowDeleteConfirm(true);
                                        setShowMessageMenu(null);
                                      }}
                                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center gap-3 text-red-500 rounded-lg ${
                                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-red-50"
                                      }`}
                                    >
                                      <X className="w-4 h-4" />
                                      Delete Message
                                    </button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className={`p-3 md:p-4 ${
                    theme === "dark"
                      ? "bg-gray-800 border-t border-gray-700"
                      : "bg-white border-t border-gray-200"
                  }`}>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button className={`p-2 rounded-lg transition-colors ${
                        theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                      }`}>
                        <Paperclip className={`w-4 h-4 md:w-5 md:h-5 ${
                          theme === "dark" ? "text-gray-300" : "text-gray-600"
                        }`} />
                      </button>
                      <div className="relative">
                        <button 
                          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                          className={`p-2 rounded-lg transition-colors hidden sm:block ${
                            theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                          }`}
                        >
                          <Smile className={`w-5 h-5 ${
                            theme === "dark" ? "text-gray-300" : "text-gray-600"
                          }`} />
                        </button>
                        
                        {/* Emoji Picker */}
                        {showEmojiPicker && (
                          <div 
                            ref={emojiPickerRef}
                            className={`absolute bottom-full left-0 mb-2 w-80 max-h-80 overflow-y-auto rounded-lg shadow-2xl border z-50 ${
                              theme === "dark" 
                                ? "bg-gray-800 border-gray-700" 
                                : "bg-white border-gray-200"
                            }`}
                          >
                            <div className={`p-3 border-b sticky top-0 ${
                              theme === "dark" 
                                ? "bg-gray-800 border-gray-700" 
                                : "bg-white border-gray-200"
                            }`}>
                              <h3 className={`text-sm font-semibold ${
                                theme === "dark" ? "text-white" : "text-gray-800"
                              }`}>Select Emoji</h3>
                            </div>
                            <div className="p-2 grid grid-cols-8 gap-1">
                              {emojis.map((emoji, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleEmojiSelect(emoji)}
                                  className={`text-2xl p-2 rounded hover:scale-110 transition-transform ${
                                    theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                                  }`}
                                  title={emoji}
                                >
                                  {emoji}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className={`flex-1 px-3 md:px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm md:text-base ${
                          theme === "dark"
                            ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        onClick={handleSendMessage}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Send className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className={`flex-1 flex items-center justify-center ${
                  theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                }`}>
                  <div className="text-center px-4">
                    <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                      theme === "dark" ? "bg-gray-800" : "bg-gray-200"
                    }`}>
                      <MessageSquare className={`w-8 h-8 md:w-10 md:h-10 ${
                        theme === "dark" ? "text-gray-600" : "text-gray-400"
                      }`} />
                    </div>
                    <h3 className={`text-lg md:text-xl font-semibold mb-2 ${
                      theme === "dark" ? "text-gray-200" : "text-gray-700"
                    }`}>Select a conversation</h3>
                    <p className={`text-sm md:text-base ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>Choose a team member to start chatting</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* View Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Group Members</h2>
              <button
                onClick={() => setShowMembersModal(false)}
                className={`p-1 rounded-lg transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <X className={`w-5 h-5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`} />
              </button>
            </div>
            
            <div className="p-4 max-h-96 overflow-y-auto">
              {groupMembers.length > 0 ? (
                groupMembers.map((member, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg mb-2 ${
                      theme === "dark" ? "bg-gray-900" : "bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {(member.user?.email || member.email) ? (member.user?.email || member.email)[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-medium truncate ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}>
                        {member.nickname || member.user?.username || member.username || (member.user?.email || member.email) || 'Unknown User'}
                      </h3>
                      <p className={`text-sm truncate ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>{member.user?.email || member.email || 'No email'}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className={`text-center py-8 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>No members found</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Set Nickname Modal */}
      {showNicknameModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Set Nickname</h2>
              <button
                onClick={() => {
                  setShowNicknameModal(false);
                  setNewNickname('');
                }}
                className={`p-1 rounded-lg transition-colors ${
                  theme === "dark" ? "hover:bg-gray-700" : "hover:bg-gray-100"
                }`}
              >
                <X className={`w-5 h-5 ${
                  theme === "dark" ? "text-gray-400" : "text-gray-600"
                }`} />
              </button>
            </div>
            
            <div className="p-4">
              <label className={`block text-sm font-medium mb-2 ${
                theme === "dark" ? "text-gray-300" : "text-gray-700"
              }`}>
                Your Nickname in this Group
              </label>
              <input
                type="text"
                value={newNickname}
                onChange={(e) => setNewNickname(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleUpdateNickname()}
                placeholder="Enter your nickname..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  theme === "dark"
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                    : "border-gray-300"
                }`}
              />
            </div>
            
            <div className={`p-4 border-t ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowNicknameModal(false);
                    setNewNickname('');
                  }}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateNickname}
                  disabled={!newNickname.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !newNickname.trim()
                      ? theme === "dark"
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      
      {/* Delete Message Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-sm rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className="p-6">
              <h3 className={`text-lg font-semibold mb-2 ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Delete Message?</h3>
              <p className={`text-sm ${
                theme === "dark" ? "text-gray-400" : "text-gray-600"
              }`}>
                This message will be permanently deleted. This action cannot be undone.
              </p>
            </div>
            <div className={`p-4 border-t flex gap-3 ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setMessageToDelete(null);
                }}
                className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                  theme === "dark"
                    ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => messageToDelete && handleDeleteMessage(messageToDelete)}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;