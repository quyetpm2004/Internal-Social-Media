-- AlterTable
ALTER TABLE `notifications` MODIFY `type` ENUM('POST_APPROVED', 'POST_REJECTED', 'POST_PINNED', 'POST_UNPINNED', 'POST_REACTION', 'POST_COMMENT', 'COMMENT_REPLY', 'COMMENT_REACTION', 'POST_MENTION', 'COMMENT_MENTION', 'MESSAGE_MENTION', 'GROUP_MEMBER_ADDED', 'GROUP_MEMBER_ROLE_CHANGED', 'GROUP_MEMBER_STATUS_CHANGED', 'GROUP_MEMBER_KICKED', 'GROUP_MEMBER_REJECTED') NOT NULL;

-- CreateTable
CREATE TABLE `message_mentions` (
    `mention_id` INTEGER NOT NULL AUTO_INCREMENT,
    `message_id` INTEGER NOT NULL,
    `mentioned_user_id` INTEGER NOT NULL,

    INDEX `message_mentions_message_id_idx`(`message_id`),
    INDEX `message_mentions_mentioned_user_id_idx`(`mentioned_user_id`),
    UNIQUE INDEX `message_mentions_message_id_mentioned_user_id_key`(`message_id`, `mentioned_user_id`),
    PRIMARY KEY (`mention_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `message_mentions` ADD CONSTRAINT `message_mentions_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`message_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `message_mentions` ADD CONSTRAINT `message_mentions_mentioned_user_id_fkey` FOREIGN KEY (`mentioned_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
