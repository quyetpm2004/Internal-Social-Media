import type { Socket } from "socket.io";
import type { Server as IOServer } from "socket.io";
import type { JwtPayload } from "@/shared/utils/jwt";

export interface SocketChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  contentType: string;
  content: string;
  status: string;
  editedAt: Date | null;
  createdAt: Date;
  sender: {
    id: number;
    fullName: string;
    avatarUrl: string | null;
  };
  attachments: Array<{
    id: number;
    fileName: string;
    mimeType: string;
    fileSize: number;
    attachmentType: string;
    fileUrl: string | null;
  }>;
}

export interface MessageNewPayload {
  conversationId: number;
  message: SocketChatMessage;
}

export interface MessageEditedPayload {
  conversationId: number;
  message: SocketChatMessage;
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

export interface PresenceSnapshotPayload {
  onlineUserIds: number[];
}

export type MembersUpdatedAction = "added" | "removed" | "left";

export interface MembersUpdatedPayload {
  conversationId: number;
  action: MembersUpdatedAction;
  affectedUserIds: number[];
  actorUserId: number;
}

export interface NotificationNewPayload {
  notification: {
    id: number;
    type: string;
    postId: number | null;
    commentId: number | null;
    groupId: number | null;
    metadata: unknown;
    readAt: Date | null;
    createdAt: Date;
    actor: {
      id: number;
      fullName: string;
      avatarUrl: string | null;
    } | null;
    group: { id: number; groupName: string } | null;
    post: { id: number; snippet: string } | null;
    comment: { id: number; snippet: string } | null;
  };
}

export interface NotificationUnreadCountPayload {
  unreadCount: number;
}

export interface PollVotePayload {
  conversationId: number;
  pollId: number;
  poll: {
    id: number;
    question: string;
    allowMultiple: boolean;
    endsAt: string | null;
    status: string;
    totalVotes: number;
    options: {
      id: number;
      label: string;
      voteCount: number;
      voters: { id: number; fullName: string }[];
    }[];
    myVotes: number[];
  };
}

export interface ServerToClientEvents {
  "message:new": (payload: MessageNewPayload) => void;
  "members:updated": (payload: MembersUpdatedPayload) => void;
  "message:edited": (payload: MessageEditedPayload) => void;
  "message:deleted": (payload: MessageDeletedPayload) => void;
  "poll:vote": (payload: PollVotePayload) => void;
  "read:update": (payload: ReadUpdatePayload) => void;
  "typing:start": (payload: TypingPayload) => void;
  "typing:stop": (payload: TypingPayload) => void;
  "presence:online": (payload: PresencePayload) => void;
  "presence:offline": (payload: PresencePayload) => void;
  "presence:snapshot": (payload: PresenceSnapshotPayload) => void;
  "notification:new": (payload: NotificationNewPayload) => void;
  "notification:unread-count": (
    payload: NotificationUnreadCountPayload,
  ) => void;
}

export interface ClientToServerEvents {
  "typing:start": (payload: { conversationId: number }) => void;
  "typing:stop": (payload: { conversationId: number }) => void;
  "conversation:join": (payload: { conversationId: number }) => void;
  "conversation:leave": (payload: { conversationId: number }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  user: JwtPayload;
}

export type AppIOServer = IOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export type AppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;
