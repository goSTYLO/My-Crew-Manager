import { useEffect, useRef, useCallback } from 'react';
import { API_BASE_URL } from '../config/api';
import { Message } from '../types/chat';

interface UseNotificationWebSocketProps {
  currentUserId: number | null;
  selectedChat: number | null;
  messages: Record<number, Message[]>;
  setMessages: React.Dispatch<React.SetStateAction<Record<number, Message[]>>>;
  setContacts: React.Dispatch<React.SetStateAction<any[]>>;
  onRoomInvitation: () => void;
  onDirectRoomCreated: () => void;
}

export const useNotificationWebSocket = ({
  currentUserId,
  selectedChat,
  messages,
  setMessages,
  setContacts,
  onRoomInvitation,
  onDirectRoomCreated,
}: UseNotificationWebSocketProps) => {
  const wsRef = useRef<WebSocket | null>(null);

  const getAuthToken = () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('⚠️ No auth token found in sessionStorage. Please login first.');
    }
    return token || '';
  };

  // Handle new message from notification WebSocket
  const handleNewMessage = useCallback((roomId: number, messageData: any) => {
    const newMessage: Message = {
      id: messageData.message_id,
      sender: messageData.sender_id === currentUserId ? 'me' : 'them',
      text: messageData.content,
      time: new Date(messageData.created_at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      sender_id: messageData.sender_id,
      sender_username: messageData.sender_username,
      message_id: messageData.message_id,
      reply_to_id: messageData.reply_to_id || undefined,
      created_at: messageData.created_at,
    };
    
    // If this room is currently selected or we have messages loaded for it, add the message
    const isCurrentRoom = selectedChat === roomId;
    const hasMessagesForRoom = messages[roomId];
    
    if (isCurrentRoom || hasMessagesForRoom) {
      setMessages(prev => {
        const existingMessages = prev[roomId] || [];
        
        // Check if message already exists by message_id (real message)
        const existingRealMsgIndex = existingMessages.findIndex(msg => 
          msg.message_id === newMessage.message_id && msg.message_id && msg.message_id < 1000000000000
        );
        
        if (existingRealMsgIndex >= 0) {
          // Message already exists - update it
          const updated = [...existingMessages];
          updated[existingRealMsgIndex] = newMessage;
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
        
        // Check for optimistic message to replace
        const optimisticMsgIndex = existingMessages.findIndex(msg => 
          msg.message_id && msg.message_id > 1000000000000 &&
          msg.sender === 'me' && 
          msg.text === newMessage.text &&
          messageData.sender_id === currentUserId
        );
        
        let updatedMessages: Message[];
        
        if (optimisticMsgIndex >= 0) {
          // Replace optimistic message
          updatedMessages = [...existingMessages];
          updatedMessages[optimisticMsgIndex] = newMessage;
        } else {
          // Insert new message in correct chronological position
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
              if (existingMsg.message_id < newMessage.message_id) {
                continue;
              } else {
                insertIndex = i;
                break;
              }
            }
          }
          
          updatedMessages = [
            ...existingMessages.slice(0, insertIndex),
            newMessage,
            ...existingMessages.slice(insertIndex)
          ];
        }
        
        // Sort by created_at timestamp to ensure correct chronological order
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
    }
  }, [currentUserId, selectedChat, messages, setMessages, setContacts]);

  useEffect(() => {
    const token = getAuthToken();
    
    if (!token) {
      console.error('❌ Cannot connect notification WebSocket: No auth token');
      return;
    }

    // Use API_BASE_URL and convert http to ws, remove /api prefix
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
          // Handle new message notification - add to messages if we have the room open
          if (data.room_id && data.message) {
            handleNewMessage(data.room_id, data.message);
            
            // WebSocket will automatically send unread_count_updated when new messages arrive
            console.log('🔔 New message notification received - WebSocket will send unread_count_updated automatically');
          }
          break;
          
        case 'room_invitation':
          // Refresh rooms list
          onRoomInvitation();
          break;
          
        case 'direct_room_created':
          // Refresh rooms list
          onDirectRoomCreated();
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
          if (wsRef.current?.readyState === WebSocket.CLOSED) {
            // Reconnect by triggering useEffect again
            // This is handled by the effect dependency array
          }
        }, 5000);
      }
    };
    
    wsRef.current = ws;
    
    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [currentUserId, handleNewMessage, onRoomInvitation, onDirectRoomCreated]);

  return wsRef;
};

