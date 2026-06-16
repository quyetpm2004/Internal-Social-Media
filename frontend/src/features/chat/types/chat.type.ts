import type { PollSummary } from "@/types/poll.type";

export type ConversationType = "DIRECT" | "GROUP";

export type ConversationFilter = "ALL" | "UNREAD" | "GROUPS";

export type ConversationMemberRole = "MEMBER" | "ADMIN";

export type MessageContentType = "TEXT" | "IMAGE" | "FILE" | "SYSTEM" | "POLL";

export type MessageStatus = "ACTIVE" | "EDITED" | "DELETED";

export type ChatAttachmentType = "IMAGE" | "VIDEO" | "FILE";

export interface ChatUser {
  id: number;
  fullName: string;
  avatarUrl: string | null;
}

export interface MessageAttachment {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  attachmentType: ChatAttachmentType;
  fileUrl: string | null;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  contentType: MessageContentType;
  content: string;
  status: MessageStatus;
  editedAt: string | null;
  createdAt: string;
  sender: ChatUser;
  attachments: MessageAttachment[];
  poll?: PollSummary | null;
}

export interface Conversation {
  id: number;
  type: ConversationType;
  name: string;
  avatarUrl: string | null;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount: number;
  isMuted: boolean;
  counterpart: ChatUser | null;
  lastMessage: ChatMessage | null;
  memberCount: number;
}

export interface ConversationMember {
  id: number;
  role: ConversationMemberRole;
  joinedAt: string;
  lastReadAt: string | null;
  isMuted: boolean;
  user: ChatUser;
}

export interface ConversationDetail extends Conversation {
  members: ConversationMember[];
}

export interface ListConversationsResponse {
  items: Conversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListMessagesResponse {
  items: ChatMessage[];
  pagination: {
    limit: number;
    hasMore: boolean;
    nextCursor: number | null;
  };
}

export interface SharedAttachmentItem {
  id: number;
  fileName: string;
  mimeType: string;
  fileSize: number;
  attachmentType: ChatAttachmentType;
  fileUrl: string | null;
}

export interface SharedAttachmentsResponse {
  items: SharedAttachmentItem[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ReadReceiptResponse {
  conversationId: number;
  lastReadAt: string;
}

export interface MuteResponse {
  conversationId: number;
  isMuted: boolean;
}
