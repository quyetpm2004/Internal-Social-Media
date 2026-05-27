import type { ChatMessage } from "./chat.type";

export interface MessageNewPayload {
  conversationId: number;
  message: ChatMessage;
}

export interface MessageEditedPayload {
  conversationId: number;
  message: ChatMessage;
}

export interface MessageDeletedPayload {
  conversationId: number;
  messageId: number;
}

export interface ReadUpdatePayload {
  conversationId: number;
  userId: number;
  lastReadAt: string;
}

export interface TypingPayload {
  conversationId: number;
  userId: number;
}

export interface PresencePayload {
  userId: number;
}
