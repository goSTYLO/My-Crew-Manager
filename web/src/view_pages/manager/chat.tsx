//chat.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Send, Search, MoreVertical, Paperclip, Smile, Phone, Video, MessageSquare, ArrowLeft, Users, X, Plus, Check } from 'lucide-react';
import Sidebar from "../../components/sidebarLayout";
import TopNavbar from "../../components/topbarLayouot";
import { useTheme } from "../../components/themeContext";
import { useChatPolling } from "../../hooks/useChatPolling";
import { API_BASE_URL } from "../../config/api";
import type { Contact, Message, Room, ApiMessage, UserData } from "../../types/chat";

const ChatApp = () => {
  const { theme } = useTheme();
  const [selectedChat, setSelectedChat] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Record<number, Message[]>>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showContactList, setShowContactList] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
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
  const [showProjectSearch, setShowProjectSearch] = useState(false);
  const [projects, setProjects] = useState<any[]>([]);
  const [projectSearchQuery, setProjectSearchQuery] = useState('');
  const [projectPage, setProjectPage] = useState(1);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const projectsPerPage = 5;
  
  const menuRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const wsNotificationRef = useRef<WebSocket | null>(null);

  // Chat polling for real-time updates - DISABLED for WebSocket testing
  const chatPolling = useChatPolling({
    roomId: selectedChat?.toString(),
    enabled: false, // Disabled to test WebSocket broadcasting
    onNewMessages: (newMessages) => {
      if (selectedChat && newMessages.length > 0) {
        // console.log(`💬 [chat] Received ${newMessages.length} new messages via polling`);
        // console.log(`💬 [chat] Current user ID: ${currentUserId}`);
        console.log(`💬 [chat] Selected chat: ${selectedChat}`);
        
        const convertedMessages: Message[] = newMessages.map((msg: ApiMessage) => {
          const isMyMessage = msg.sender_id === currentUserId;
          console.log(`💬 [chat] Message ${msg.message_id}: sender_id=${msg.sender_id} (${typeof msg.sender_id}), currentUserId=${currentUserId} (${typeof currentUserId}), isMyMessage=${isMyMessage}`);
          
          return {
            id: msg.message_id,
            sender: isMyMessage ? 'me' as const : 'them' as const,
            text: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString(),
            sender_id: msg.sender_id,
            sender_username: msg.sender_username,
            message_id: msg.message_id,
            reply_to_id: msg.reply_to_id
          };
        });
        
        // Check for duplicates before adding
        setMessages(prev => {
          const existingMessages = prev[selectedChat] || [];
          const existingIds = new Set(existingMessages.map(m => m.message_id));
          const newUniqueMessages = convertedMessages.filter(m => !existingIds.has(m.message_id));
          
          if (newUniqueMessages.length > 0) {
            console.log(`💬 [chat] Adding ${newUniqueMessages.length} new unique messages`);
            return {
              ...prev,
              [selectedChat]: [...existingMessages, ...newUniqueMessages]
            };
          }
          return prev;
        });
        
        // Scroll to bottom
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      }
    },
    onRoomUpdate: (rooms) => {
      // console.log(`💬 Received ${rooms.length} rooms via polling`);
      
      const updatedContacts = rooms.map((room: any) => ({
        id: room.room_id,
        name: room.name || 'Unnamed Room',
        role: room.is_private ? 'Private' : 'Group',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(room.name || 'Room')}&background=random`,
        online: true,
        lastMessage: 'No messages yet',
        time: '',
        unread: 0,
        isGroup: !room.is_private,
        members: []
      }));
      
      setContacts(updatedContacts);
    },
    onError: (error) => {
      console.error('💬 Chat polling error:', error);
    }
  });

  // Get auth token from sessionStorage
  const getAuthToken = () => {
    // Try different possible token storage keys
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      console.error('⚠️ No auth token found in sessionStorage. Please login first.');
    }
    return token || '';
  };

  // Get current user data
  const getCurrentUser = async () => {
    try {
      const token = getAuthToken();
      
      if (!token) {
        console.error('❌ No auth token found');
        return null;
      }
      
      const response = await fetch(`${API_BASE_URL}/user/me/`, {
        headers: {
          'Authorization': `Token ${token}`,
        },
      });
      
      if (response.ok) {
        const userData: UserData = await response.json();
        setCurrentUserId(userData.user_id);
        console.log('✅ Current user loaded:', userData.name, `(ID: ${userData.user_id})`);
        return userData;
      } else {
        const errorText = await response.text();
        console.error('❌ Failed to fetch current user:', response.status, errorText);
      }
    } catch (err) {
      console.error('❌ Failed to fetch current user:', err);
    }
    return null;
  };

  // API Helper
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const token = getAuthToken();
    
    if (!token) {
      throw new Error('No authentication token found. Please login first.');
    }

    // Ensure chat endpoints use the correct path
    const chatEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const fullUrl = `${API_BASE_URL}/chat${chatEndpoint}`;
    
    console.log('🔵 API Call:', fullUrl);
    
    const response = await fetch(fullUrl, {
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
        console.log('✅ Current user loaded, starting chat initialization...');
        await fetchRooms();
        
        // Dispatch event to refresh chat badge count after a delay
        // This allows any mark-as-read operations to complete first
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('chatOpened'));
        }, 500);
        
        console.log('💬 Chat initialized with WebSocket real-time updates');
      } else {
        setError('Please login to use chat');
      }
    };
    
    init();
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

  // Debug polling state
  useEffect(() => {
    // console.log(`💬 [chat] Polling state changed: enabled=${!!currentUserId && !!selectedChat}, currentUserId=${currentUserId}, selectedChat=${selectedChat}`);
    // console.log(`💬 [chat] Chat polling status: isPolling=${chatPolling.isPolling}, lastUpdate=${chatPolling.lastUpdate}`);
  }, [currentUserId, selectedChat, chatPolling.isPolling, chatPolling.lastUpdate]);

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

    // Use API_BASE_URL and convert http to ws, remove /api prefix
    const baseUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
    const wsUrl = `${baseUrl}/ws/chat/${roomId}/?token=${token}`;
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
            // Handle new message
            const newMessage: Message = {
              id: data.message.message_id,
              sender: data.user_id === currentUserId ? 'me' : 'them',
              text: data.message.content,
              time: new Date(data.message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              sender_id: data.user_id,
              sender_username: data.message.sender_username,
              message_id: data.message.message_id,
              reply_to_id: data.message.reply_to_id || undefined,
              created_at: data.message.created_at,
            };
            
            setMessages(prev => {
              const existingMessages = prev[roomId] || [];
              
              // Check if message already exists
              const exists = existingMessages.some(msg => msg.message_id === newMessage.message_id);
              if (exists) {
                return prev;
              }
              
              // Check for optimistic message to replace
              const optimisticIndex = existingMessages.findIndex(msg => 
                msg.message_id && msg.message_id > 1000000000000 &&
                msg.sender === 'me' && 
                msg.text === newMessage.text &&
                data.user_id === currentUserId
              );
              
              if (optimisticIndex >= 0) {
                // Replace optimistic message
                const updated = [...existingMessages];
                updated[optimisticIndex] = newMessage;
                updated.sort((a, b) => {
                  if (a.created_at && b.created_at) {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  }
                  return (a.message_id || 0) - (b.message_id || 0);
                });
                return { ...prev, [roomId]: updated };
              }
              
              // Add new message
              const updated = [...existingMessages, newMessage];
              updated.sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return (a.message_id || 0) - (b.message_id || 0);
              });
              
              return { ...prev, [roomId]: updated };
            });
            
            // Update last message in contacts
            setContacts(prev => prev.map(contact => 
              contact.id === roomId 
                ? { ...contact, lastMessage: data.message.content, time: 'Just now' }
                : contact
            ));
            
            console.log('🔔 New message received - WebSocket will send unread_count_updated automatically');
            break;
            
          case 'message_deleted':
            if (data.message_id) {
              console.log('🗑️ Message deleted via WebSocket:', data.message_id, 'deleted by:', data.deleted_by);
              
              setMessages(prev => {
                const deletedMsg = prev[roomId]?.find(msg => msg.message_id === data.message_id);
                const wasMyMessage = deletedMsg?.sender === 'me';
                const deletedByMe = currentUserId && data.deleted_by_id === currentUserId;
              
                let systemMessageText: string;
                if (deletedByMe && wasMyMessage) {
                  systemMessageText = '🗑️ You deleted this message';
                } else if (deletedByMe && !wasMyMessage) {
                  systemMessageText = '🗑️ You removed this message';
                } else if (!deletedByMe && wasMyMessage) {
                  systemMessageText = `🗑️ ${data.deleted_by || 'Owner'} removed this message`;
                } else {
                  systemMessageText = `🗑️ ${data.deleted_by || 'Owner'} removed this message`;
                }
                
                if (prev[roomId]) {
                  const filtered = prev[roomId].filter(msg => msg.message_id !== data.message_id);
                  const systemMessage: Message = {
                    id: Date.now(),
                    sender: 'them',
                    text: systemMessageText,
                    time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                    message_id: Date.now()
                  };
                  
                  const deletedIndex = prev[roomId].findIndex(msg => msg.message_id === data.message_id);
                  const updated = deletedIndex >= 0
                    ? [...filtered.slice(0, deletedIndex), systemMessage, ...filtered.slice(deletedIndex)]
                    : [...filtered, systemMessage];
                  
                  // Update contacts
                  setContacts(currentContacts => currentContacts.map(contact => {
                    if (contact.id === roomId) {
                      const lastNonSystemMsg = [...updated].reverse().find(msg => 
                        !msg.text.includes('🗑️') && !msg.text.includes('➕') && !msg.text.includes('📝') && !msg.text.includes('🖼️')
                      );
                      return {
                        ...contact,
                        lastMessage: lastNonSystemMsg ? lastNonSystemMsg.text : 'No messages yet',
                        time: lastNonSystemMsg ? lastNonSystemMsg.time : ''
                      };
                    }
                    return contact;
                  }));
                  
                  return { ...prev, [roomId]: updated };
                }
                return prev;
              });
            }
            break;
            
          case 'user_joined':
            console.log('👋 User joined:', data.user);
            if (data.user_email) {
              // Add system message
              const systemMessage: Message = {
                id: Date.now(),
                sender: 'them',
                text: `➕ ${data.user_email} was invited to the group`,
                time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
                message_id: Date.now()
              };
              
              setMessages(prev => {
                const existingMessages = prev[roomId] || [];
                const alreadyExists = existingMessages.some(msg => 
                  msg.text.includes(data.user_email) && msg.text.includes('was invited to the group')
                );
                
                if (!alreadyExists) {
                  return { ...prev, [roomId]: [...existingMessages, systemMessage] };
                }
                return prev;
              });
              
              // Refresh rooms to update member count
              fetchRooms();
            }
            break;
            
          case 'user_left':
            console.log('👋 User left:', data.user);
            break;
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error (This is normal if backend WebSocket is not configured yet):', error);
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

    // Close existing connection
    if (wsNotificationRef.current) {
      wsNotificationRef.current.close();
    }

    const baseUrl = API_BASE_URL.replace('/api', '').replace('http', 'ws');
    const wsUrl = `${baseUrl}/ws/chat/notifications/?token=${token}`;
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
        case 'new_message_notification':
          if (data.room_id && data.message) {
            const newMessage: Message = {
              id: data.message.message_id,
              sender: data.message.sender_id === currentUserId ? 'me' : 'them',
              text: data.message.content,
              time: new Date(data.message.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
              sender_id: data.message.sender_id,
              sender_username: data.message.sender_username,
              message_id: data.message.message_id,
              reply_to_id: data.message.reply_to_id || undefined,
              created_at: data.message.created_at,
            };
            
            const isCurrentRoom = selectedChat === data.room_id;
            const hasMessagesForRoom = messages[data.room_id];
            
            if (isCurrentRoom || hasMessagesForRoom) {
              setMessages(prev => {
                const existingMessages = prev[data.room_id] || [];
                const exists = existingMessages.some(msg => msg.message_id === newMessage.message_id);
                if (exists) {
                  return prev;
                }
                
                const optimisticIndex = existingMessages.findIndex(msg => 
                  msg.message_id && msg.message_id > 1000000000000 &&
                  msg.sender === 'me' && 
                  msg.text === newMessage.text &&
                  data.message.sender_id === currentUserId
                );
                
                let updated: Message[];
                if (optimisticIndex >= 0) {
                  updated = [...existingMessages];
                  updated[optimisticIndex] = newMessage;
                } else {
                  updated = [...existingMessages, newMessage];
                }
                
                updated.sort((a, b) => {
                  if (a.created_at && b.created_at) {
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                  }
                  return (a.message_id || 0) - (b.message_id || 0);
                });
                
                return { ...prev, [data.room_id]: updated };
              });
              
              setContacts(prev => prev.map(contact => 
                contact.id === data.room_id 
                  ? { ...contact, lastMessage: data.message.content, time: 'Just now' }
                  : contact
              ));
            }
            
            console.log('🔔 New message notification received - WebSocket will send unread_count_updated automatically');
          }
          break;
          
        case 'room_invitation':
          fetchRooms();
          break;
          
        case 'direct_room_created':
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

  // Connect to WebSocket when room is selected
  useEffect(() => {
    if (selectedChat && currentUserId) {
      connectRoomWebSocket(selectedChat);
    } else {
      // Close connection if no room selected
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    }
    
    // Cleanup on unmount or room change
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChat, currentUserId]);

  // Connect to notification WebSocket on mount
  useEffect(() => {
    if (currentUserId) {
      connectNotificationWebSocket();
    }
    
    // Cleanup on unmount
    return () => {
      if (wsNotificationRef.current) {
        wsNotificationRef.current.close();
        wsNotificationRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUserId]);

  // Fetch messages for a room
  const fetchMessages = async (roomId: number) => {
    try {
      console.log('📥 Fetching messages for room:', roomId);
      console.log('👤 Current user ID:', currentUserId);
      console.log('👤 Current user ID type:', typeof currentUserId);
      
      // Get existing messages to determine the highest message_id we've seen
      const existingMessages = messages[roomId] || [];
      const highestMessageId = existingMessages
        .filter(msg => msg.message_id && msg.message_id < 1000000000000)
        .reduce((max, msg) => Math.max(max, msg.message_id || 0), 0);
      
      // Build query parameters
      const queryParams = new URLSearchParams();
      
      if (highestMessageId > 0) {
        // Fetch messages after the highest ID we've seen (newer messages)
        queryParams.append('after_id', highestMessageId.toString());
        queryParams.append('limit', '200'); // Get up to 200 newer messages
        console.log(`📥 Fetching messages after ID ${highestMessageId} (incremental fetch)`);
      } else {
        // First fetch or no existing messages - fetch latest 200 messages
        // We'll need to get total count and calculate offset to get latest messages
        queryParams.append('limit', '200');
        queryParams.append('offset', '0');
        console.log(`📥 Fetching initial messages (up to 200)`);
      }
      
      const response = await apiCall(`/rooms/${roomId}/messages/?${queryParams.toString()}`);
      
      // Handle different response structures
      let msgs: ApiMessage[] = response.results || response.messages || response || [];
      
      // If this is the first fetch and we got less than total, we might be missing recent messages
      // In that case, if total_count > 200, we need to fetch from the end
      if (highestMessageId === 0 && response.total_count && response.total_count > msgs.length) {
        console.log(`📥 Total messages: ${response.total_count}, fetched: ${msgs.length}. Fetching latest messages...`);
        
        // Calculate offset to get the LAST 200 messages
        const totalCount = response.total_count;
        const latestOffset = Math.max(0, totalCount - 200);
        
        const latestResponse = await apiCall(`/rooms/${roomId}/messages/?limit=200&offset=${latestOffset}`);
        const latestMsgs: ApiMessage[] = latestResponse.results || latestResponse.messages || latestResponse || [];
        
        // Use the latest messages (most recent)
        msgs = latestMsgs;
        console.log(`📥 Fetched ${latestMsgs.length} latest messages (offset ${latestOffset})`);
      }
      
      console.log('📥 API Response structure:', response);
      console.log('📥 Extracted messages:', msgs.length);

      if (!Array.isArray(msgs)) {
        console.error('❌ Messages is not an array:', msgs);
        setError('Invalid response format from server');
        return;
      }

      // Keep optimistic messages (temporary IDs > 1000000000000) that haven't been replaced yet
      // Re-get existingMessages here since we might have updated it above
      const existingMessagesForMerge = messages[roomId] || [];
      const optimisticMessages = existingMessagesForMerge.filter(msg => 
        msg.message_id && msg.message_id > 1000000000000
      );
      
      // Create a map of existing real messages (by message_id) for quick lookup
      const existingMessagesMap = new Map<number, Message>();
      existingMessagesForMerge.forEach(msg => {
        if (msg.message_id && msg.message_id < 1000000000000) {
          existingMessagesMap.set(msg.message_id, msg);
        }
      });
      
      const formattedMessages: Message[] = msgs.map(msg => {
        // Check if this message already exists in our state (only check real messages)
        const existingMsg = existingMessagesMap.get(msg.message_id);
        
        // Always determine sender based on currentUserId comparison
        const isMyMessage = msg.sender_id === currentUserId; 
        console.log(`🔍 Message ${msg.message_id}: sender_id=${msg.sender_id} (${typeof msg.sender_id}), currentUserId=${currentUserId} (${typeof currentUserId}), isMyMessage=${isMyMessage}`);
        
        // If message exists as a real message, preserve its sender status and other properties
        let sender: 'me' | 'them';
        if (existingMsg && existingMsg.message_id && existingMsg.message_id < 1000000000000) {
          sender = existingMsg.sender;
          console.log(`♻️ Preserving existing message ${msg.message_id} as '${sender}'`);
          
          // Return existing message (preserves all properties including UI state)
          return existingMsg;
        } else {
          // For new messages, determine based on sender_id
          sender = isMyMessage ? 'me' : 'them';
          console.log(`🆕 New message ${msg.message_id}: sender_id=${msg.sender_id}, currentUserId=${currentUserId}, determined as '${sender}'`);
          
          return {
            id: msg.message_id,
            sender: sender,
            text: msg.content,
            time: new Date(msg.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            sender_id: msg.sender_id,
            sender_username: msg.sender_username,
            message_id: msg.message_id,
            reply_to_id: msg.reply_to_id || undefined,
            created_at: msg.created_at // Store for sorting
          };
        }
      });
      
      // Merge: Get existing real messages that weren't in the API response
      // If we did an incremental fetch (after_id), keep ALL existing messages
      // If we did a full fetch (latest 200), only keep messages not in the fetch
      let existingRealMessagesNotInFetch: Message[] = [];
      
      if (highestMessageId > 0) {
        // Incremental fetch: Keep ALL existing real messages (they're older than what we fetched)
        existingRealMessagesNotInFetch = existingMessagesForMerge.filter(msg => 
          msg.message_id && msg.message_id < 1000000000000
        );
        console.log(`📥 Incremental fetch: Keeping all ${existingRealMessagesNotInFetch.length} existing messages`);
      } else {
        // Full fetch: Only keep messages not in the API response (edge case - shouldn't happen often)
        existingRealMessagesNotInFetch = existingMessagesForMerge.filter(msg => {
          if (!msg.message_id || msg.message_id > 1000000000000) {
            return false; // Skip optimistic messages
          }
          // Keep if this message_id is not in the fetched messages
          return !msgs.some(apiMsg => apiMsg.message_id === msg.message_id);
        });
        console.log(`📥 Full fetch: Keeping ${existingRealMessagesNotInFetch.length} existing messages not in API response`);
      }
      
      console.log(`📥 Fetched ${formattedMessages.length} messages from API`);
      console.log(`💾 Found ${existingRealMessagesNotInFetch.length} existing messages not in fetch (likely from WebSocket)`);
      
      // Combine: fetched messages + existing messages not in fetch + optimistic messages
      const allMessages = [...formattedMessages, ...existingRealMessagesNotInFetch, ...optimisticMessages];
      
      // Remove duplicates (shouldn't happen, but safety check)
      const uniqueMessages = Array.from(
        new Map(allMessages.map(msg => [msg.message_id, msg])).values()
      );
      
      // Sort messages by created_at timestamp to ensure correct chronological order
      uniqueMessages.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        // Fallback to message_id if created_at not available
        return (a.message_id || 0) - (b.message_id || 0);
      });
      
      console.log('✅ Messages merged and sorted:', uniqueMessages.length, '(including', optimisticMessages.length, 'optimistic,', existingRealMessagesNotInFetch.length, 'from existing state)');
      setMessages(prev => ({
        ...prev,
        [roomId]: uniqueMessages
      }));
      
      // Update the last message in contacts after fetching
      if (uniqueMessages.length > 0) {
        // Find the last real message (not optimistic) for contacts
        const lastRealMsg = [...uniqueMessages].reverse().find(msg => 
          msg.message_id && msg.message_id < 1000000000000
        ) || uniqueMessages[uniqueMessages.length - 1];
        
        setContacts(prev => prev.map(contact => 
          contact.id === roomId 
            ? { ...contact, lastMessage: lastRealMsg.text, time: lastRealMsg.time }
            : contact
        ));
      }
      
      // After loading messages, mark room as read ONLY if this is the currently selected chat
      // This ensures badge updates when user views messages in an active chat
      // Don't mark as read if user navigated away or chat is not selected
      if (selectedChat === roomId) {
        console.log('📖 Messages loaded for active chat, marking room as read to update badge');
        // Small delay to ensure messages are fully rendered and user has seen them
        setTimeout(() => {
          markRoomAsRead(roomId);
        }, 150);
      } else {
        console.log('📖 Messages loaded but chat is not selected - not marking as read');
      }
    } catch (err) {
      console.error('❌ Failed to fetch messages:', err);
      setError('Failed to load messages');
    }
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

  // Refresh messages for current chat (similar to fetchBacklog in monitor_created.tsx)
  const refreshMessages = async () => {
    if (selectedChat) {
      console.log('🔄 Refreshing messages for room:', selectedChat);
      console.log('🔄 Current user ID before refresh:', currentUserId);
      
      // Force a fresh fetch of messages
      await fetchMessages(selectedChat);
      
      // Force a re-render by updating a dummy state
      setMessages(prev => ({ ...prev }));
      
      console.log('✅ Messages refreshed and UI updated');
    }
  };

  // Send message via API
  const handleSendMessage = async () => {
    if (message.trim() && selectedChat) {
      const messageText = message;
      setMessage(''); // Clear input immediately
      
      const now = new Date();
      const optimisticId = Date.now(); // Temporary ID for tracking
      
      // Optimistically add message to UI for instant feedback
      // This will be replaced by the real message when API response or WebSocket arrives
      const optimisticMessage: Message = {
        id: optimisticId,
        sender: 'me',
        text: messageText,
        time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        sender_id: currentUserId || undefined,
        message_id: optimisticId, // Temporary ID - will be replaced
        created_at: now.toISOString() // Store current time for sorting
      };
      
      // Add optimistic message at the end
      setMessages(prev => {
        const existingMessages = prev[selectedChat] || [];
        return {
          ...prev,
          [selectedChat]: [...existingMessages, optimisticMessage]
        };
      });
      
      // Update contacts list optimistically
      setContacts(prev => prev.map(contact => 
        contact.id === selectedChat 
          ? { ...contact, lastMessage: messageText, time: 'Just now' }
          : contact
      ));
      
      try {
        const response = await apiCall(`/rooms/${selectedChat}/messages/`, {
          method: 'POST',
          body: JSON.stringify({
            content: messageText,
            message_type: 'text'
          })
        });
        
        console.log('✅ Message sent successfully:', response);
        
        // Immediately replace optimistic message with real message from API response
        // This ensures the message appears correctly even if WebSocket is delayed
        if (response && response.message_id) {
          console.log('✅ API response received, replacing optimistic message:', response);
          
          const realMessage: Message = {
            id: response.message_id,
            sender: 'me',
            text: response.content || messageText,
            time: new Date(response.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
            sender_id: response.sender_id || currentUserId || undefined,
            sender_username: response.sender_username,
            message_id: response.message_id,
            reply_to_id: response.reply_to_id || undefined,
            created_at: response.created_at // Store real timestamp
          };
          
          setMessages(prev => {
            const existingMessages = prev[selectedChat] || [];
            console.log('📦 Current messages before replacement:', existingMessages.length);
            console.log('🔍 Looking for optimistic message with ID:', optimisticId);
            
            // Remove optimistic message (by matching the optimistic ID)
            const filtered = existingMessages.filter(msg => {
              const isOptimistic = msg.message_id === optimisticId;
              if (isOptimistic) {
                console.log('🗑️ Removing optimistic message:', msg.message_id, msg.text);
              }
              return !isOptimistic;
            });
            
            console.log('📦 Messages after filtering optimistic:', filtered.length);
            
            // Check if real message already exists (in case WebSocket arrived first)
            const alreadyExists = filtered.some(msg => msg.message_id === realMessage.message_id);
            
            if (!alreadyExists) {
              // Add real message
              const updated = [...filtered, realMessage];
              
              // Sort by created_at to ensure correct order
              updated.sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return (a.message_id || 0) - (b.message_id || 0);
              });
              
              console.log('✅ Final messages after replacement:', updated.length);
              return {
                ...prev,
                [selectedChat]: updated
              };
            } else {
              console.log('ℹ️ Real message already exists (WebSocket arrived first), just removing optimistic');
              // Real message already exists, just remove optimistic and sort
              filtered.sort((a, b) => {
                if (a.created_at && b.created_at) {
                  return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                }
                return (a.message_id || 0) - (b.message_id || 0);
              });
              return {
                ...prev,
                [selectedChat]: filtered
              };
            }
          });
        } else {
          console.warn('⚠️ API response missing message_id:', response);
        }
        
        // When user sends a message in the currently open chat, the backend automatically marks it as read
        // The backend updates sender's joined_at and sends unread_count_updated via WebSocket
        // We also call markRoomAsRead as backup verification to ensure badge is always correct
        if (selectedChat) {
          console.log('📝 Message sent in active chat - backend will mark as read and send badge update via WebSocket');
          
          // Small delay to ensure backend has processed the message and updated joined_at
          // This is a backup verification in case WebSocket notification is delayed
          // The backend will send unread_count_updated immediately, but we verify with API call
          setTimeout(() => {
            console.log('📝 Verifying badge count after sending message (backup verification)...');
            markRoomAsRead(selectedChat);
          }, 600);
        }
        
      } catch (err) {
        console.error('Failed to send message:', err);
        setError('Failed to send message');
        setMessage(messageText); // Restore message on error
        
        // Remove optimistic message on error
        setMessages(prev => ({
          ...prev,
          [selectedChat]: (prev[selectedChat] || []).filter(msg => msg.message_id !== optimisticId)
        }));
      }
    }
  };

  // Mark messages as read for a room
  const markRoomAsRead = async (roomId: number) => {
    try {
      const token = getAuthToken();
      if (!token) return;
      
      console.log('🔔 Marking room as read:', roomId);
      
      // Update user's joined_at timestamp to mark all current messages as read
      // This endpoint should update the membership joined_at to current time
      const response = await fetch(`${API_BASE_URL}/chat/rooms/${roomId}/mark_read/`, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Successfully marked room as read:', roomId);
        console.log('📊 Mark read response:', responseData);
        
        // Immediately update badge from API response (ensures instant update)
        // WebSocket will also send unread_count_updated for real-time sync across tabs
        if (responseData.total_unread_count !== undefined && typeof responseData.total_unread_count === 'number') {
          const newCount = Math.max(0, responseData.total_unread_count);
          console.log('🔔 Updating badge immediately from API response:', newCount);
          
          // Dispatch event immediately for instant UI update
          window.dispatchEvent(new CustomEvent('chatBadgeUpdate', { 
            detail: { unread_count: newCount },
            bubbles: true,
            cancelable: true
          }));
          
          // Backup: Verify with API fetch after a short delay (ensures accuracy)
          // This handles cases where WebSocket might be slow or not connected
          // Multiple verification attempts to ensure badge resets correctly
          setTimeout(() => {
            console.log('🔔 Verification #1: Fetching unread count from API to verify badge count...');
            window.dispatchEvent(new CustomEvent('chatBadgeRefresh', { bubbles: true }));
          }, 300);
          
          // Second verification after longer delay (catches any race conditions)
          setTimeout(() => {
            console.log('🔔 Verification #2: Second API fetch to ensure badge is correct...');
            window.dispatchEvent(new CustomEvent('chatBadgeRefresh', { bubbles: true }));
          }, 1000);
        } else {
          // Fallback: fetch from API if total_unread_count not in response or invalid
          console.log('⚠️ total_unread_count not in response or invalid, fetching from API...');
          console.log('📊 Response data:', responseData);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('chatBadgeRefresh', { bubbles: true }));
          }, 300);
        }
        
        console.log('🔔 WebSocket will also send unread_count_updated for real-time sync across tabs...');
      } else {
        const errorText = await response.text();
        console.error('⚠️ Mark read endpoint returned error:', response.status, errorText);
        // On error, don't refresh - let it update naturally when user navigates or receives new message
      }
    } catch (error) {
      console.error('❌ Failed to mark room as read:', error);
      // On error, don't refresh - let it update naturally when user navigates or receives new message
    }
  };

  // Select chat and load messages
  const handleSelectChat = (id: number) => {
    setSelectedChat(id);
    setShowContactList(false);
    setShowGroupMenu(false); // Close menu when switching chats
    
    // Always refresh messages when selecting a chat to ensure we have the latest
    // This is especially important when returning to the chat after navigating away
    console.log(`💬 Selecting chat room ${id} - refreshing messages to ensure latest data`);
    
    // Connect to WebSocket for this room
    connectRoomWebSocket(id);
    
    // Fetch messages - this will call markRoomAsRead after messages are loaded
    fetchMessages(id);
    
    // Reset unread count locally (optimistic UI update)
    setContacts(prev => prev.map(contact => 
      contact.id === id ? { ...contact, unread: 0 } : contact
    ));
    
    // Dispatch event to refresh badge count when chat is selected
    // This ensures badge is updated even if markRoomAsRead hasn't completed yet
    window.dispatchEvent(new CustomEvent('chatRoomSelected', { 
      detail: { roomId: id },
      bubbles: true 
    }));
  };

  const handleBackToContacts = () => {
    setShowContactList(true);
    setShowGroupMenu(false); // Close menu when going back
  };

  const getCurrentMessages = () => {
    return messages[selectedChat!] || [];
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

  // Create group via API
  const handleCreateGroup = async () => {
    const totalMembers = selectedMembers.length + memberEmails.length;
    
    if (groupName.trim() && totalMembers >= 2) {
      try {
        console.log('📝 Creating group:', groupName);
        console.log('Selected members:', selectedMembers.length);
        console.log('Email invites:', memberEmails);
        
        const response = await apiCall('/rooms/', {
          method: 'POST',
          body: JSON.stringify({
            name: groupName,
            is_private: false
          })
        });
        
        const newRoomId = response.room_id;
        console.log('✅ Group created:', newRoomId);
        
        // Invite members by email
        for (const email of memberEmails) {
          try {
            await apiCall(`/rooms/${newRoomId}/invite/`, {
              method: 'POST',
              body: JSON.stringify({ email })
            });
            console.log('✅ Invited:', email);
          } catch (err) {
            console.error('❌ Failed to invite:', email, err);
            // Continue inviting other members even if one fails
          }
        }
        
        // Reset form and refresh rooms
        setGroupName('');
        setSelectedMembers([]);
        setMemberEmails([]);
        setEmailInput('');
        setEmailError(null);
        setShowCreateGroup(false);
        await fetchRooms();
        
        console.log('✅ Group creation complete');
      } catch (err) {
        console.error('❌ Failed to create group:', err);
        setError('Failed to create group');
      }
    }
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
      setGroupMembers(members);
      console.log('✅ Group members loaded:', members);
    } catch (err) {
      console.error('❌ Failed to fetch group members:', err);
      setError('Failed to load group members');
    }
  };

  // Leave group
  const handleLeaveGroup = async () => {
    if (selectedChat && window.confirm('Are you sure you want to leave this group?')) {
      try {
        await apiCall(`/rooms/${selectedChat}/leave/`, {
          method: 'POST'
        });
        
        // Remove from contacts
        setContacts(prev => prev.filter(contact => contact.id !== selectedChat));
        setSelectedChat(null);
        setShowContactList(true);
        setShowGroupMenu(false);
        console.log('✅ Left group successfully');
      } catch (err) {
        console.error('❌ Failed to leave group:', err);
        setError('Failed to leave group');
      }
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

  // Add member to group
  const handleAddMember = async () => {
    if (selectedChat && addMemberEmail.trim()) {
      const email = addMemberEmail.trim().toLowerCase();
      
      // Validate email
      if (!isValidEmail(email)) {
        setAddMemberError('Please enter a valid email address');
        return;
      }
      
      try {
        await apiCall(`/rooms/${selectedChat}/invite/`, {
          method: 'POST',
          body: JSON.stringify({ email })
        });
        
        // Don't add system message here - it will be added via WebSocket user_joined event
        // This ensures real-time updates across all tabs
        
        // Refresh group members
        await fetchGroupMembers(selectedChat);
        
        setAddMemberEmail('');
        setAddMemberError(null);
        setShowAddMemberModal(false);
        setShowGroupMenu(false);
        console.log('✅ Member added successfully');
      } catch (err) {
        console.error('❌ Failed to add member:', err);
        setAddMemberError('Failed to add member. User may not exist or already in group.');
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
      
      // Correct endpoint based on backend URL pattern: rooms/<room_pk>/messages/<pk>/
      const endpoint = `${API_BASE_URL}/chat/rooms/${selectedChat}/messages/${messageId}/`;
      
      console.log('🔄 Deleting via endpoint:', endpoint);
      
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok || response.status === 204) {
        console.log('✅ Successfully deleted message:', messageId);
        
        // Remove message from local state
        setMessages(prev => ({
          ...prev,
          [selectedChat]: prev[selectedChat].filter(msg => msg.message_id !== messageId)
        }));
        
        // Update contacts list to reflect deleted message
        setContacts(prev => prev.map(contact => {
          if (contact.id === selectedChat) {
            const updatedMessages = messages[selectedChat]?.filter(msg => msg.message_id !== messageId) || [];
            const lastMsg = updatedMessages[updatedMessages.length - 1];
            return {
              ...contact,
              lastMessage: lastMsg ? lastMsg.text : 'No messages yet',
              time: lastMsg ? lastMsg.time : ''
            };
          }
          return contact;
        }));
        
        setShowDeleteConfirm(false);
        setMessageToDelete(null);
      } else {
        // Handle errors
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        
        if (response.status === 403) {
          setError(errorData.detail || 'You do not have permission to delete this message.');
        } else if (response.status === 404) {
          setError('Message not found. It may have already been deleted.');
        } else {
          setError(errorData.detail || 'Failed to delete message. Please try again.');
        }
        
        console.error('❌ Failed to delete message:', response.status, errorData);
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

  // Fetch user's projects
  const fetchUserProjects = async () => {
    setLoadingProjects(true);
    try {
      const token = getAuthToken();
      const response = await fetch(`${API_BASE_URL}/ai/projects/my-projects/`, {
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoadingProjects(false);
    }
  };

  // Handle project selection and add members
  const handleSelectProject = async (projectId: number) => {
    try {
      const token = getAuthToken();
      const response = await fetch(
        `${API_BASE_URL}/ai/project-members/?project_id=${projectId}`,
        {
          headers: {
            'Authorization': `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (response.ok) {
        const members = await response.json();
        const newEmails = members
          .map((m: any) => m.user_email.toLowerCase())
          .filter((email: string) => !memberEmails.includes(email));
        
        setMemberEmails(prev => [...prev, ...newEmails]);
        setShowProjectSearch(false);
        setProjectSearchQuery('');
        console.log(`✅ Added ${newEmails.length} members from project`);
      }
    } catch (err) {
      console.error('Failed to fetch project members:', err);
    }
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
              {/* Search and Create Group Button */}
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
                <button
                  onClick={() => setShowCreateGroup(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Create Group</span>
                </button>
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
                                  
                                  <button
                                    onClick={() => {
                                      setShowAddMemberModal(true);
                                      setShowGroupMenu(false);
                                    }}
                                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-3 ${
                                      theme === "dark" ? "hover:bg-gray-700 text-gray-300" : "hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    <Plus className="w-4 h-4" />
                                    Add Member
                                  </button>
                                  
                                  <div className={`border-t ${theme === "dark" ? "border-gray-700" : "border-gray-200"}`} />
                                  
                                  <button
                                    onClick={handleLeaveGroup}
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
                    {/* Load More Button */}
                    {chatPolling.hasMoreMessages && (
                      <div className="flex justify-center mb-4">
                        <button
                          onClick={chatPolling.loadMoreMessages}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                            theme === "dark"
                              ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          }`}
                        >
                          Load More Messages
                        </button>
                      </div>
                    )}
                    
                    
                    <div className="space-y-3 md:space-y-4">
                      {getCurrentMessages().map(msg => {
                        return (
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
                                {msg.sender === 'me' ? 'You' : (msg.sender_username || 'Member')}
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
                                    setShowMessageMenu(showMessageMenu === msg.message_id ? null : (msg.message_id || null));
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
                        );
                      })}
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

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            {/* Modal Header */}
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Create Group</h2>
              <button
                onClick={() => {
                  setShowCreateGroup(false);
                  setGroupName('');
                  setSelectedMembers([]);
                  setMemberEmails([]);
                  setEmailInput('');
                  setEmailError(null);
                  setShowProjectSearch(false);
                  setProjectSearchQuery('');
                  setProjectPage(1);
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

            {/* Modal Body */}
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Group Name Input */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Group Name
                </label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    theme === "dark"
                      ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                      : "border-gray-300"
                  }`}
                />
              </div>

              {/* Search Projects */}
              <div className="mb-3">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Add Members from Project (Minimum 2)
                </label>
                <div className="relative">
                  <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                    theme === "dark" ? "text-gray-500" : "text-gray-400"
                  }`} />
                  <input
                    type="text"
                    value={projectSearchQuery}
                    onChange={(e) => setProjectSearchQuery(e.target.value)}
                    placeholder="Search projects..."
                    className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      theme === "dark"
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                        : "border-gray-300"
                    }`}
                  />
                </div>
                <button
                  onClick={() => {
                    fetchUserProjects();
                    setShowProjectSearch(true);
                  }}
                  className="mt-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  <span className="text-sm font-medium">Browse Projects</span>
                </button>
              </div>

              {/* Selected Members Count */}
              {(selectedMembers.length > 0 || memberEmails.length > 0) && (
                <div className={`mb-3 p-2 rounded-lg ${
                  theme === "dark" ? "bg-gray-900" : "bg-blue-50"
                }`}>
                  <p className={`text-sm ${
                    theme === "dark" ? "text-gray-300" : "text-blue-700"
                  }`}>
                    {selectedMembers.length + memberEmails.length} member{selectedMembers.length + memberEmails.length > 1 ? 's' : ''} selected
                    {selectedMembers.length + memberEmails.length < 2 && (
                      <span className={`ml-2 ${
                        theme === "dark" ? "text-gray-400" : "text-blue-500"
                      }`}>
                        (Add at least {2 - (selectedMembers.length + memberEmails.length)} more)
                      </span>
                    )}
                  </p>
                </div>
              )}

              {/* Projects List */}
              {showProjectSearch && (
                <div className={`border rounded-lg overflow-hidden mb-4 ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}>
                  <div className={`px-3 py-2 border-b ${
                    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Select a Project to Add All Members
                    </p>
                  </div>
                  {loadingProjects ? (
                    <div className={`p-8 text-center ${
                      theme === "dark" ? "text-gray-400" : "text-gray-500"
                    }`}>
                      <p>Loading projects...</p>
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {projects
                        .filter(project => 
                          project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
                        )
                        .slice((projectPage - 1) * projectsPerPage, projectPage * projectsPerPage)
                        .map(project => (
                          <div
                            key={project.id}
                            className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                              theme === "dark"
                                ? "hover:bg-gray-700 border-b border-gray-700"
                                : "hover:bg-gray-50 border-b border-gray-100"
                            }`}
                          >
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-semibold">
                              <Users className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`font-medium truncate ${
                                theme === "dark" ? "text-white" : "text-gray-800"
                              }`}>{project.title}</h3>
                              <p className={`text-sm truncate ${
                                theme === "dark" ? "text-gray-400" : "text-gray-500"
                              }`}>
                                {project.member_count || 0} members
                              </p>
                            </div>
                            <button
                              onClick={() => handleSelectProject(project.id)}
                              className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                            >
                              Select
                            </button>
                          </div>
                        ))}
                      
                      {/* Pagination */}
                      {projects.filter(project => 
                        project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
                      ).length > projectsPerPage && (
                        <div className={`flex justify-between items-center p-3 border-t ${
                          theme === "dark" ? "border-gray-700" : "border-gray-200"
                        }`}>
                          <button
                            onClick={() => setProjectPage(prev => Math.max(1, prev - 1))}
                            disabled={projectPage === 1}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              projectPage === 1
                                ? theme === "dark"
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : theme === "dark"
                                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                            }`}
                          >
                            Previous
                          </button>
                          <span className={`text-sm ${
                            theme === "dark" ? "text-gray-400" : "text-gray-500"
                          }`}>
                            Page {projectPage} of {Math.ceil(projects.filter(project => 
                              project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
                            ).length / projectsPerPage)}
                          </span>
                          <button
                            onClick={() => setProjectPage(prev => prev + 1)}
                            disabled={projectPage >= Math.ceil(projects.filter(project => 
                              project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
                            ).length / projectsPerPage)}
                            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                              projectPage >= Math.ceil(projects.filter(project => 
                                project.title.toLowerCase().includes(projectSearchQuery.toLowerCase())
                              ).length / projectsPerPage)
                                ? theme === "dark"
                                  ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                                  : "bg-gray-200 text-gray-400 cursor-not-allowed"
                                : theme === "dark"
                                ? "bg-gray-600 text-gray-300 hover:bg-gray-500"
                                : "bg-gray-300 text-gray-700 hover:bg-gray-400"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Add Members by Email Section */}
              <div className="mb-4">
                <label className={`block text-sm font-medium mb-2 ${
                  theme === "dark" ? "text-gray-300" : "text-gray-700"
                }`}>
                  Or Add Members by Email
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      setEmailError(null);
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                    placeholder="Enter email address..."
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      emailError
                        ? 'border-red-500'
                        : theme === "dark"
                        ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                        : "border-gray-300"
                    }`}
                  />
                  <button
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="hidden sm:inline">Add</span>
                  </button>
                </div>
                {emailError && (
                  <p className="text-red-500 text-xs mt-1">{emailError}</p>
                )}
              </div>

              {/* Email List */}
              {memberEmails.length > 0 && (
                <div className={`border rounded-lg overflow-hidden ${
                  theme === "dark" ? "border-gray-700" : "border-gray-200"
                }`}>
                  <div className={`px-3 py-2 border-b ${
                    theme === "dark" ? "bg-gray-900 border-gray-700" : "bg-gray-50 border-gray-200"
                  }`}>
                    <p className={`text-sm font-medium ${
                      theme === "dark" ? "text-gray-300" : "text-gray-700"
                    }`}>
                      Email Invitations ({memberEmails.length})
                    </p>
                  </div>
                  <div className="max-h-40 overflow-y-auto">
                    {memberEmails.map((email, index) => (
                      <div
                        key={index}
                        className={`flex items-center justify-between px-3 py-2 ${
                          theme === "dark"
                            ? "hover:bg-gray-700 border-b border-gray-700"
                            : "hover:bg-gray-50 border-b border-gray-100"
                        }`}
                      >
                        <span className={`text-sm truncate ${
                          theme === "dark" ? "text-gray-300" : "text-gray-700"
                        }`}>
                          {email}
                        </span>
                        <button
                          onClick={() => handleRemoveEmail(email)}
                          className={`p-1 rounded transition-colors ${
                            theme === "dark"
                              ? "hover:bg-gray-600 text-gray-400 hover:text-red-400"
                              : "hover:bg-gray-200 text-gray-500 hover:text-red-500"
                          }`}
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className={`p-4 border-t ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowCreateGroup(false);
                    setGroupName('');
                    setSelectedMembers([]);
                    setMemberEmails([]);
                    setEmailInput('');
                    setEmailError(null);
                    setShowProjectSearch(false);
                    setProjectSearchQuery('');
                    setProjectPage(1);
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
                  onClick={handleCreateGroup}
                  disabled={!groupName.trim() || (selectedMembers.length + memberEmails.length) < 2}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !groupName.trim() || (selectedMembers.length + memberEmails.length) < 2
                      ? theme === "dark"
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Create Group
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
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
                      {member.email ? member.email[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-medium ${
                        theme === "dark" ? "text-white" : "text-gray-800"
                      }`}>
                        {member.nickname || member.username || 'Unknown User'}
                      </h3>
                      <p className={`text-sm ${
                        theme === "dark" ? "text-gray-400" : "text-gray-500"
                      }`}>{member.email}</p>
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
      
      {/* Edit Group Picture Modal */}
      {showEditPictureModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Edit Group Picture</h2>
              <button
                onClick={() => {
                  setShowEditPictureModal(false);
                  setSelectedFile(null);
                  setPreviewImage('');
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
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="flex flex-col items-center">
                {previewImage ? (
                  <div className="relative mb-4">
                    <img
                      src={previewImage}
                      alt="Preview"
                      className="w-32 h-32 rounded-full object-cover border-4 border-blue-500"
                    />
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        setPreviewImage('');
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`w-32 h-32 rounded-full flex flex-col items-center justify-center border-2 border-dashed cursor-pointer mb-4 transition-colors ${
                      theme === "dark"
                        ? "border-gray-600 hover:border-blue-500 bg-gray-900"
                        : "border-gray-300 hover:border-blue-500 bg-gray-50"
                    }`}
                  >
                    <svg className={`w-12 h-12 mb-2 ${theme === "dark" ? "text-gray-500" : "text-gray-400"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={`text-sm ${theme === "dark" ? "text-gray-400" : "text-gray-500"}`}>
                      Click to upload
                    </span>
                  </div>
                )}
                
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    theme === "dark"
                      ? "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  Choose Image
                </button>
                
                <p className={`text-xs mt-3 text-center ${
                  theme === "dark" ? "text-gray-400" : "text-gray-500"
                }`}>
                  Supported formats: JPG, PNG, GIF (Max 5MB)
                </p>
              </div>
            </div>
            
            <div className={`p-4 border-t ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowEditPictureModal(false);
                    setSelectedFile(null);
                    setPreviewImage('');
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
                  onClick={handleUpdateGroupPicture}
                  disabled={!selectedFile}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !selectedFile
                      ? theme === "dark"
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Save Picture
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
      
      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-lg shadow-xl ${
            theme === "dark" ? "bg-gray-800" : "bg-white"
          }`}>
            <div className={`flex items-center justify-between p-4 border-b ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <h2 className={`text-xl font-semibold ${
                theme === "dark" ? "text-white" : "text-gray-800"
              }`}>Add Member</h2>
              <button
                onClick={() => {
                  setShowAddMemberModal(false);
                  setAddMemberEmail('');
                  setAddMemberError(null);
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
                Member Email Address
              </label>
              <input
                type="email"
                value={addMemberEmail}
                onChange={(e) => {
                  setAddMemberEmail(e.target.value);
                  setAddMemberError(null);
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddMember()}
                placeholder="Enter email address..."
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  addMemberError
                    ? 'border-red-500'
                    : theme === "dark"
                    ? "bg-gray-900 border-gray-700 text-white placeholder-gray-500"
                    : "border-gray-300"
                }`}
              />
              {addMemberError && (
                <p className="text-red-500 text-xs mt-1">{addMemberError}</p>
              )}
              <p className={`text-xs mt-2 ${
                theme === "dark" ? "text-gray-400" : "text-gray-500"
              }`}>
                The user will receive an invitation to join this group.
              </p>
            </div>
            
            <div className={`p-4 border-t ${
              theme === "dark" ? "border-gray-700" : "border-gray-200"
            }`}>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowAddMemberModal(false);
                    setAddMemberEmail('');
                    setAddMemberError(null);
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
                  onClick={handleAddMember}
                  disabled={!addMemberEmail.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                    !addMemberEmail.trim()
                      ? theme === "dark"
                        ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                        : "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-blue-600 text-white hover:bg-blue-700"
                  }`}
                >
                  Add Member
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatApp;