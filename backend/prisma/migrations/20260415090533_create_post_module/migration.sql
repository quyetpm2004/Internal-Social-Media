-- CreateTable
CREATE TABLE `groups` (
    `group_id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `group_type` ENUM('PUBLIC', 'PRIVATE', 'DEPARTMENT') NOT NULL DEFAULT 'PUBLIC',
    `created_by` INTEGER NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `groups_created_by_idx`(`created_by`),
    PRIMARY KEY (`group_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `group_members` (
    `group_member_id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `member_role` ENUM('MEMBER', 'MODERATOR', 'ADMIN') NOT NULL DEFAULT 'MEMBER',
    `joined_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `group_members_group_id_idx`(`group_id`),
    INDEX `group_members_user_id_idx`(`user_id`),
    UNIQUE INDEX `group_members_group_id_user_id_key`(`group_id`, `user_id`),
    PRIMARY KEY (`group_member_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `posts` (
    `post_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `group_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `visibility` ENUM('PUBLIC', 'PRIVATE', 'DEPARTMENT', 'GROUP') NOT NULL DEFAULT 'PUBLIC',
    `view_count` INTEGER NOT NULL DEFAULT 0,
    `is_pinned` BOOLEAN NOT NULL DEFAULT false,
    `status` ENUM('ACTIVE', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `posts_user_id_idx`(`user_id`),
    INDEX `posts_group_id_idx`(`group_id`),
    PRIMARY KEY (`post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comments` (
    `comment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `parent_comment_id` INTEGER NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('ACTIVE', 'HIDDEN', 'DELETED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `comments_post_id_idx`(`post_id`),
    INDEX `comments_user_id_idx`(`user_id`),
    INDEX `comments_parent_comment_id_idx`(`parent_comment_id`),
    PRIMARY KEY (`comment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_mentions` (
    `mention_id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `mentioned_user_id` INTEGER NOT NULL,

    INDEX `post_mentions_post_id_idx`(`post_id`),
    INDEX `post_mentions_mentioned_user_id_idx`(`mentioned_user_id`),
    UNIQUE INDEX `post_mentions_post_id_mentioned_user_id_key`(`post_id`, `mentioned_user_id`),
    PRIMARY KEY (`mention_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `comment_mentions` (
    `mention_id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NOT NULL,
    `mentioned_user_id` INTEGER NOT NULL,

    INDEX `comment_mentions_comment_id_idx`(`comment_id`),
    INDEX `comment_mentions_mentioned_user_id_idx`(`mentioned_user_id`),
    UNIQUE INDEX `comment_mentions_comment_id_mentioned_user_id_key`(`comment_id`, `mentioned_user_id`),
    PRIMARY KEY (`mention_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `post_attachments` (
    `attachment_id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `file_name` VARCHAR(191) NOT NULL,
    `file_url` VARCHAR(191) NOT NULL,
    `file_type` VARCHAR(191) NOT NULL,
    `uploaded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `post_attachments_post_id_idx`(`post_id`),
    PRIMARY KEY (`attachment_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reactions` (
    `reaction_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `post_id` INTEGER NULL,
    `comment_id` INTEGER NULL,
    `reaction_type` ENUM('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reactions_user_id_idx`(`user_id`),
    INDEX `reactions_post_id_idx`(`post_id`),
    INDEX `reactions_comment_id_idx`(`comment_id`),
    UNIQUE INDEX `reactions_user_id_post_id_key`(`user_id`, `post_id`),
    UNIQUE INDEX `reactions_user_id_comment_id_key`(`user_id`, `comment_id`),
    PRIMARY KEY (`reaction_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_created_by_fkey` FOREIGN KEY (`created_by`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `group_members` ADD CONSTRAINT `group_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `posts` ADD CONSTRAINT `posts_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `groups`(`group_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comments` ADD CONSTRAINT `comments_parent_comment_id_fkey` FOREIGN KEY (`parent_comment_id`) REFERENCES `comments`(`comment_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_mentions` ADD CONSTRAINT `post_mentions_mentioned_user_id_fkey` FOREIGN KEY (`mentioned_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `comment_mentions` ADD CONSTRAINT `comment_mentions_mentioned_user_id_fkey` FOREIGN KEY (`mentioned_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `post_attachments` ADD CONSTRAINT `post_attachments_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reactions` ADD CONSTRAINT `reactions_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `comments`(`comment_id`) ON DELETE CASCADE ON UPDATE CASCADE;
