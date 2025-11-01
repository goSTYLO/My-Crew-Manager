// Chat-related types

export interface Contact {
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

export interface Message {
  id: number;
  sender: 'me' | 'them';
  text: string;
  time: string;
  sender_id?: number;
  sender_username?: string;
  message_id?: number;
  reply_to_id?: number | null;
  created_at?: string; // Store original created_at for sorting
}

export interface Room {
  room_id: number;
  name: string | null;
  is_private: boolean;
  created_by_id: number;
  created_at: string;
  members_count: number;
}

export interface ApiMessage {
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

export interface UserData {
  user_id: number;
  name: string;
  email: string;
  role: string;
  profile_picture: string | null;
}

