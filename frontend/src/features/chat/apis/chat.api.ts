import { axiosClient } from "@/lib/axios";
import type { ApiResponse } from "@/types/api.type";
import type {
  ChatSearchHistoryItem,
  ChatSearchUsersResponse,
} from "@/features/chat/types/chat-search.type";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationFilter,
  ListConversationsResponse,
  ListMessagesResponse,
  MessageContentType,
  MuteResponse,
  ReadReceiptResponse,
  SharedAttachmentsResponse,
} from "@/features/chat/types/chat.type";

export const chatApi = {
  listConversations(
    filter: ConversationFilter = "ALL",
    page = 1,
    limit = 20,
  ) {
    return axiosClient.get<ApiResponse<ListConversationsResponse>>(
      "/chat/conversations",
      { params: { filter, page, limit } },
    );
  },

  getConversationDetail(conversationId: number | string) {
    return axiosClient.get<ApiResponse<ConversationDetail>>(
      `/chat/conversations/${conversationId}`,
    );
  },

  createDirectConversation(userId: number) {
    return axiosClient.post<ApiResponse<ConversationDetail>>(
      "/chat/conversations/direct",
      { userId },
    );
  },

  createGroupConversation(data: { name: string; memberIds: number[] }) {
    return axiosClient.post<ApiResponse<ConversationDetail>>(
      "/chat/conversations/group",
      data,
    );
  },

  listMessages(
    conversationId: number | string,
    options: { cursor?: number; limit?: number } = {},
  ) {
    return axiosClient.get<ApiResponse<ListMessagesResponse>>(
      `/chat/conversations/${conversationId}/messages`,
      { params: options },
    );
  },

  sendMessage(
    conversationId: number | string,
    data: {
      content: string;
      contentType?: MessageContentType;
      attachmentIds?: number[];
    },
  ) {
    return axiosClient.post<ApiResponse<ChatMessage>>(
      `/chat/conversations/${conversationId}/messages`,
      {
        content: data.content,
        contentType: data.contentType ?? "TEXT",
        attachmentIds: data.attachmentIds ?? [],
      },
    );
  },

  markRead(conversationId: number | string) {
    return axiosClient.post<ApiResponse<ReadReceiptResponse>>(
      `/chat/conversations/${conversationId}/read`,
    );
  },

  setMuted(conversationId: number | string, muted: boolean) {
    return axiosClient.patch<ApiResponse<MuteResponse>>(
      `/chat/conversations/${conversationId}/mute`,
      { muted },
    );
  },

  getSharedMedia(
    conversationId: number | string,
    page = 1,
    limit = 24,
  ) {
    return axiosClient.get<ApiResponse<SharedAttachmentsResponse>>(
      `/chat/conversations/${conversationId}/media`,
      { params: { page, limit } },
    );
  },

  getSharedFiles(
    conversationId: number | string,
    page = 1,
    limit = 20,
  ) {
    return axiosClient.get<ApiResponse<SharedAttachmentsResponse>>(
      `/chat/conversations/${conversationId}/files`,
      { params: { page, limit } },
    );
  },

  editMessage(messageId: number, content: string) {
    return axiosClient.patch<ApiResponse<ChatMessage>>(
      `/chat/messages/${messageId}`,
      { content },
    );
  },

  deleteMessage(messageId: number) {
    return axiosClient.delete<ApiResponse<{ messageId: number }>>(
      `/chat/messages/${messageId}`,
    );
  },

  getConversationByUser(otherUserId: number) {
    return chatApi.createDirectConversation(otherUserId);
  },

  searchUsers(q: string, page = 1, limit = 20) {
    return axiosClient.get<ApiResponse<ChatSearchUsersResponse>>(
      "/chat/search",
      { params: { q, page, limit } },
    );
  },

  getSearchHistory(limit = 10) {
    return axiosClient.get<ApiResponse<ChatSearchHistoryItem[]>>(
      "/chat/search/history",
      { params: { limit } },
    );
  },

  saveSearchHistory(targetUserId: number) {
    return axiosClient.post<ApiResponse<ChatSearchHistoryItem[]>>(
      "/chat/search/history",
      { targetUserId },
    );
  },

  deleteSearchHistoryItem(historyId: number) {
    return axiosClient.delete(`/chat/search/history/${historyId}`);
  },

  deleteGroupAvatar(conversationId: number | string) {
    return axiosClient.delete<ApiResponse<ConversationDetail>>(
      `/chat/conversations/${conversationId}/avatar`,
    );
  },

  addGroupMembers(conversationId: number | string, userIds: number[]) {
    return axiosClient.post<ApiResponse<ConversationDetail>>(
      `/chat/conversations/${conversationId}/members`,
      { userIds },
    );
  },

  leaveGroup(conversationId: number | string) {
    return axiosClient.post<ApiResponse<{ success: boolean }>>(
      `/chat/conversations/${conversationId}/leave`,
    );
  },

  removeGroupMember(conversationId: number | string, userId: number) {
    return axiosClient.delete<ApiResponse<ConversationDetail>>(
      `/chat/conversations/${conversationId}/members/${userId}`,
    );
  },
};

export type ChatApi = typeof chatApi;
