import { MediaItem } from "@shared/types/media";

export interface ChatMemberPreview {
  _id: string;
  publicLink?: string;
  lastSeenAt?: string;
  username: string;
  fullName: string;
  avatar: MediaItem | null;
  initials: string;
}

export interface ChatLastMessage {
  text: string | null;
  hasMedia: boolean;
  senderId: string;
  createdAt: string;
}

export interface Chat {
  _id: string;
  participants: string[];
  deletedBy: string[];
  lastMessage: ChatLastMessage | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatWithMember extends Chat {
  member: ChatMemberPreview;
  unreadCount: number;
}

export interface Message {
  _id: string;
  chatId: string;
  senderId: string;
  text: string | null;
  media: MediaItem[];
  readBy: string[];
  reactions: MessageReaction[];
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChatPayload {
  memberId: string;
}

export interface SendMessagePayload {
  text?: string;
  mediaIds?: string[];
}

export interface MessageReaction {
  userId: string;
  emoji: string;
}
