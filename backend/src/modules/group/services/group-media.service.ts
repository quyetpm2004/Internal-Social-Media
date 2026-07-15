import {
  AttachmentType,
  GroupType,
  MediaStatus,
  PostStatus,
  PostVisibility,
} from "@prisma/client";
import { getFileUrl } from "@/modules/file/file.service";
import {
  getGroupViewerContext,
  maskUserForGroupDisplay,
  shouldHideAnonymousAuthor,
} from "@/shared/utils/group-anonymous";
import type { GroupAttachmentCategory } from "@/modules/group/group.types";
import * as groupRepo from "@/modules/group/group.repository";
import {
  checkGroupExists,
  checkIsGroupMember,
} from "@/modules/group/services/group-access.service";

const GROUP_ATTACHMENT_TYPES: Record<
  GroupAttachmentCategory,
  AttachmentType[]
> = {
  media: [AttachmentType.IMAGE, AttachmentType.VIDEO],
  file: [AttachmentType.FILE],
};

export const getGroupAttachments = async (
  groupId: number,
  userId: number,
  category: GroupAttachmentCategory,
  page: number = 1,
  limit: number = 20,
  search?: string,
) => {
  const group = await checkGroupExists(groupId);

  if (group.groupType === GroupType.PRIVATE) {
    await checkIsGroupMember(groupId, userId);
  }

  const where = {
    status: MediaStatus.ACTIVE,
    attachmentType: { in: GROUP_ATTACHMENT_TYPES[category] },
    post: {
      groupId,
      status: PostStatus.ACTIVE,
      visibility: PostVisibility.GROUP,
    },
    ...(search
      ? {
          fileName: {
            contains: search,
          },
        }
      : {}),
  };

  const [attachments, total] = await Promise.all([
    groupRepo.listGroupAttachments(where, (page - 1) * limit, limit),
    groupRepo.countGroupAttachments(where),
  ]);

  const viewer = await getGroupViewerContext(groupId, userId);

  const items = await Promise.all(
    attachments.map(async (attachment) => {
      const fileUrl = await getFileUrl(attachment.fileKey, 7 * 24 * 60 * 60);

      if (!attachment.post) {
        return {
          id: attachment.id,
          fileName: attachment.fileName,
          fileUrl,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          attachmentType: attachment.attachmentType,
          uploadedAt: attachment.uploadedAt,
          post: null,
        };
      }

      const authorId = attachment.post.userId;
      const hideIdentity = shouldHideAnonymousAuthor(
        attachment.post.isAnonymous,
        authorId,
        viewer,
      );
      const avatarUrl =
        !hideIdentity && attachment.post.user.profile?.avatarKey
          ? await getFileUrl(
              attachment.post.user.profile.avatarKey,
              24 * 60 * 60,
            )
          : null;
      const displayAuthor = maskUserForGroupDisplay(
        {
          id: authorId,
          fullName: attachment.post.user.fullName,
        },
        hideIdentity,
      );

      return {
        id: attachment.id,
        fileName: attachment.fileName,
        fileUrl,
        mimeType: attachment.mimeType,
        fileSize: attachment.fileSize,
        attachmentType: attachment.attachmentType,
        uploadedAt: attachment.uploadedAt,
        post: {
          id: attachment.post.id,
          content: attachment.post.content,
          createdAt: attachment.post.createdAt,
          author: {
            id: displayAuthor.id,
            fullName: displayAuthor.fullName,
            avatarUrl,
            isAnonymous: displayAuthor.isAnonymous,
          },
        },
      };
    }),
  );

  return {
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
  };
};
