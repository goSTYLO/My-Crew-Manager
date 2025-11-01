import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { Message, ApiMessage } from '../types/chat';

interface UseRoomWebSocketProps {
  roomId: number | null;
  currentUserId: number | null;
  selectedChat: number | null;
  messages: Record<number, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<number, Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<any[]>>;
  onUserJoinedCallback?: () => void;
}

export const useRoomWebSocket = ({
  roomId,
  currentUserId,
  selectedChat,
  messages,
  setMessages,
  setContacts,
  onUserJoinedCallback,
}: UseRoomWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);

  const getAuthToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('⚠️ No auth token found in sessionStorage. Please login first.');
    }
    return token || '';
  };

  // Handle new message from WebSocket
  const handleNewMessage = useCallback((roomId: number, messageData: ApiMessage, senderId: number) => {
    const newMessage: Message = {
      id: messageData.message_id,
      sender: senderId === currentUserId ? 'me' : 'them',
      text: messageData.content,
      time: new Date(messageData.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sender_id: senderId,
      sender_username: messageData.sender_username,
      message_id: messageData.message_id,
      reply_to_id: messageData.reply_to_id || undefined,
      created_at: messageData.created_at,
    };
    
    setMessages(prev => {
      const existingMessages = prev[roomId] || [];
      
      // Check if message already exists by message_id (real message)
      const existingRealMsgIndex = existingMessages.findIndex(msg => 
        msg.message_id === newMessage.message_id && msg.message_id && msg.message_id < 1000000000000
      );
      
      if (existingRealMsgIndex >= 0) {
        // Message already exists as real message - just update it (in case of WebSocket duplicate)
        const updated = [...existingMessages];
        updated[existingRealMsgIndex] = newMessage;
        // Sort to maintain order
        updated.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return (a.message_id || 0) - (b.message_id || 0);
        });
        return {
          ...prev,
          [roomId]: updated
        };
      }
      
      // Check for optimistic message to replace (temporary IDs > 1000000000000)
      const optimisticMsgIndex = existingMessages.findIndex(msg => 
        msg.message_id && msg.message_id > 1000000000000 &&
        msg.sender === 'me' && 
        msg.text === newMessage.text &&
        senderId === currentUserId
      );
      
      if (optimisticMsgIndex >= 0) {
        // Replace optimistic message with real message
        const updated = [...existingMessages];
        updated[optimisticMsgIndex] = newMessage;
        
        // Sort by created_at to ensure correct order
        updated.sort((a, b) => {
          if (a.created_at && b.created_at) {
            return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
          }
          return (a.message_id || 0) - (b.message_id || 0);
        });
        
        return {
          ...prev,
          [roomId]: updated
        };
      }
      
      // New message - insert in correct chronological position
      const newMessageTime = new Date(messageData.created_at).getTime();
      let insertIndex = existingMessages.length;
      
      for (let i = 0; i < existingMessages.length; i++) {
        const existingMsg = existingMessages[i];
        if (existingMsg.created_at) {
          const existingTime = new Date(existingMsg.created_at).getTime();
          if (existingTime < newMessageTime) {
            continue;
          } else {
            insertIndex = i;
            break;
          }
        } else if (existingMsg.message_id && newMessage.message_id) {
          // Fallback to message_id comparison
          if (existingMsg.message_id < newMessage.message_id) {
            continue;
          } else {
            insertIndex = i;
            break;
          }
        }
      }
      
      // Insert at the correct position
      const updatedMessages = [
        ...existingMessages.slice(0, insertIndex),
        newMessage,
        ...existingMessages.slice(insertIndex)
      ];
      
      // Sort by created_at to ensure correct chronological order
      updatedMessages.sort((a, b) => {
        if (a.created_at && b.created_at) {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return (a.message_id || 0) - (b.message_id || 0);
      });
      
      return {
        ...prev,
        [roomId]: updatedMessages
      };
    });
    
    // Update last message in contacts
    setContacts(prev => prev.map(contact => 
      contact.id === roomId 
        ? { ...contact, lastMessage: messageData.content, time: 'Just now' }
        : contact
    ));
  }, [currentUserId, setMessages, setContacts]);

  // Handle message deleted
  const handleMessageDeleted = useCallback((roomId: number, messageId: number, deletedBy: string, deletedById: number | null) => {
    setMessages(prev => {
      if (prev[roomId]) {
        // Find the deleted message to check who sent it
        const deletedMsg = prev[roomId].find(msg => msg.message_id === messageId);
        const wasMyMessage = deletedMsg?.sender === 'me';
        
        // Check if current user is the one who deleted (for personalized message)
        const deletedByMe = currentUserId && deletedById === currentUserId;
        
        // Filter out the deleted message
        const filteredMessages = prev[roomId].filter(msg => msg.message_id !== messageId);
        
        // Add system message showing who deleted the message
        let systemMessageText: string;
        if (deletedByMe && wasMyMessage) {
          systemMessageText = '🗑️ You deleted this message';
        } else if (deletedByMe && !wasMyMessage) {
          systemMessageText = '🗑️ You removed this message';
        } else if (!deletedByMe && wasMyMessage) {
          systemMessageText = `🗑️ ${deletedBy || 'Owner'} removed this message`;
        } else {
          systemMessageText = `🗑️ ${deletedBy || 'Owner'} removed this message`;
        }
        
        const systemMessage: Message = {
          id: Date.now(),
          sender: 'them',
          text: systemMessageText,
          time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
          message_id: Date.now()
        };
        
        // Insert system message at the position where the deleted message was
        const deletedIndex = prev[roomId].findIndex(msg => msg.message_id === messageId);
        let updatedMessages;
        if (deletedIndex >= 0) {
          updatedMessages = [
            ...filteredMessages.slice(0, deletedIndex),
            systemMessage,
            ...filteredMessages.slice(deletedIndex)
          ];
        } else {
          updatedMessages = [...filteredMessages, systemMessage];
        }
        
        // Update contacts list if the deleted message was the last one
        setContacts(currentContacts => currentContacts.map(contact => {
          if (contact.id === roomId) {
            // Don't show system messages in contacts list - find last non-system message
            const lastNonSystemMsg = [...updatedMessages].reverse().find(msg => 
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
        
        return {
          ...prev,
          [roomId]: updatedMessages
        };
      }
      return prev;
    });
  }, [currentUserId, setMessages, setContacts]);

  // Handle user joined
  const handleUserJoined = useCallback((roomId: number, userEmail: string) => {
    // Add system message if this room is selected OR we have messages loaded for it
    const shouldAddMessage = selectedChat === roomId || messages[roomId];
    
    if (shouldAddMessage) {
      const systemMessage: Message = {
        id: Date.now(),
        sender: 'them',
        text: `➕ ${userEmail} was invited to the group`,
        time: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
        message_id: Date.now()
      };
      
      setMessages(prev => {
        const existingMessages = prev[roomId] || [];
        // Check if we already have this system message to avoid duplicates
        const alreadyExists = existingMessages.some(msg => 
          msg.text.includes(userEmail) && msg.text.includes('was invited to the group')
        );
        
        if (!alreadyExists) {
          return {
            ...prev,
            [roomId]: [...existingMessages, systemMessage]
          };
        }
        return prev;
      });
    }
    
    // Refresh rooms to update member count
    if (onUserJoinedCallback) {
      onUserJoinedCallback();
    }
  }, [selectedChat, messages, setMessages, onUserJoinedCallback]);

  useEffect(() => {
    if (!roomId) {
      // Close connection if no room selected
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      return;
    }

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
            handleNewMessage(roomId, data.message, data.user_id);
            console.log('🔔 New message received - WebSocket will send unread_count_updated automatically');
            break;
            
          case 'message_deleted':
            if (data.message_id) {
              console.log('🗑️ Message deleted via WebSocket:', data.message_id, 'deleted by:', data.deleted_by);
              handleMessageDeleted(roomId, data.message_id, data.deleted_by || 'Unknown', data.deleted_by_id || null);
            }
            break;
            
          case 'user_joined':
            console.log('👋 User joined:', data.user);
            if (data.user_email) {
              handleUserJoined(roomId, data.user_email);
            }
            break;
            
          case 'user_left':
            console.log('👋 User left:', data.user);
            break;
            
          case 'typing':
            // Handle typing indicator (can be implemented later)
            break;
            
          case 'stop_typing':
            // Handle stop typing (can be implemented later)
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
      
      // Cleanup on unmount or room change
      return () => {
        if (wsRef.current) {
          wsRef.current.close();
          wsRef.current = null;
        }
      };
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      console.log('💡 Continuing without WebSocket. Messages will work via REST API.');
    }
  }, [roomId, currentUserId, selectedChat, messages, handleNewMessage, handleMessageDeleted, handleUserJoined]);

  return wsRef;
};

