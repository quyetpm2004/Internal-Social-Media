-- CreateTable
CREATE TABLE `password_reset_tokens` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token_hash` VARCHAR(128) NOT NULL,
    `expires_at` DATETIME(3) NOT NULL,
    `used_at` DATETIME(3) NULL,
    `user_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `password_reset_tokens_token_hash_key`(`token_hash`),
    INDEX `password_reset_tokens_user_id_expires_at_idx`(`user_id`, `expires_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `saved_posts` (
    `saved_post_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `post_id` INTEGER NOT NULL,
    `saved_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `saved_posts_user_id_saved_at_idx`(`user_id`, `saved_at`),
    INDEX `saved_posts_post_id_idx`(`post_id`),
    UNIQUE INDEX `saved_posts_user_id_post_id_key`(`user_id`, `post_id`),
    PRIMARY KEY (`saved_post_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `events` (
    `event_id` INTEGER NOT NULL AUTO_INCREMENT,
    `post_id` INTEGER NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` VARCHAR(1000) NULL,
    `start_at` DATETIME(3) NOT NULL,
    `end_at` DATETIME(3) NULL,
    `location` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `events_post_id_key`(`post_id`),
    INDEX `events_start_at_idx`(`start_at`),
    PRIMARY KEY (`event_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `event_attendees` (
    `event_attendee_id` INTEGER NOT NULL AUTO_INCREMENT,
    `event_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `status` ENUM('GOING', 'MAYBE', 'DECLINED') NOT NULL DEFAULT 'GOING',
    `responded_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `event_attendees_event_id_status_idx`(`event_id`, `status`),
    INDEX `event_attendees_user_id_idx`(`user_id`),
    UNIQUE INDEX `event_attendees_event_id_user_id_key`(`event_id`, `user_id`),
    PRIMARY KEY (`event_attendee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `polls` (
    `poll_id` INTEGER NOT NULL AUTO_INCREMENT,
    `question` VARCHAR(500) NOT NULL,
    `allow_multiple` BOOLEAN NOT NULL DEFAULT false,
    `ends_at` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'CLOSED') NOT NULL DEFAULT 'ACTIVE',
    `post_id` INTEGER NULL,
    `message_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `polls_post_id_key`(`post_id`),
    UNIQUE INDEX `polls_message_id_key`(`message_id`),
    INDEX `polls_post_id_idx`(`post_id`),
    INDEX `polls_message_id_idx`(`message_id`),
    PRIMARY KEY (`poll_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `poll_options` (
    `poll_option_id` INTEGER NOT NULL AUTO_INCREMENT,
    `poll_id` INTEGER NOT NULL,
    `label` VARCHAR(200) NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `poll_options_poll_id_idx`(`poll_id`),
    PRIMARY KEY (`poll_option_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `poll_votes` (
    `poll_vote_id` INTEGER NOT NULL AUTO_INCREMENT,
    `poll_id` INTEGER NOT NULL,
    `option_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,

    INDEX `poll_votes_poll_id_idx`(`poll_id`),
    INDEX `poll_votes_option_id_idx`(`option_id`),
    INDEX `poll_votes_user_id_idx`(`user_id`),
    UNIQUE INDEX `poll_votes_poll_id_user_id_option_id_key`(`poll_id`, `user_id`, `option_id`),
    PRIMARY KEY (`poll_vote_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable
ALTER TABLE `messages` MODIFY `content_type` ENUM('TEXT', 'IMAGE', 'FILE', 'SYSTEM', 'POLL') NOT NULL DEFAULT 'TEXT';

-- AddForeignKey
ALTER TABLE `password_reset_tokens` ADD CONSTRAINT `password_reset_tokens_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_posts` ADD CONSTRAINT `saved_posts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `saved_posts` ADD CONSTRAINT `saved_posts_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `events` ADD CONSTRAINT `events_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_event_id_fkey` FOREIGN KEY (`event_id`) REFERENCES `events`(`event_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `event_attendees` ADD CONSTRAINT `event_attendees_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `polls` ADD CONSTRAINT `polls_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `posts`(`post_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `polls` ADD CONSTRAINT `polls_message_id_fkey` FOREIGN KEY (`message_id`) REFERENCES `messages`(`message_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `poll_options` ADD CONSTRAINT `poll_options_poll_id_fkey` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`poll_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_poll_id_fkey` FOREIGN KEY (`poll_id`) REFERENCES `polls`(`poll_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_option_id_fkey` FOREIGN KEY (`option_id`) REFERENCES `poll_options`(`poll_option_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `poll_votes` ADD CONSTRAINT `poll_votes_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
