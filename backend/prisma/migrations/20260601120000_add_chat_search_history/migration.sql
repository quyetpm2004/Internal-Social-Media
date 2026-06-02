-- CreateTable
CREATE TABLE `chat_search_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `target_user_id` INTEGER NOT NULL,
    `searched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `chat_search_histories_user_id_searched_at_idx`(`user_id`, `searched_at`),
    UNIQUE INDEX `chat_search_histories_user_id_target_user_id_key`(`user_id`, `target_user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `chat_search_histories` ADD CONSTRAINT `chat_search_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `chat_search_histories` ADD CONSTRAINT `chat_search_histories_target_user_id_fkey` FOREIGN KEY (`target_user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
