-- CreateTable
CREATE TABLE `search_histories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `query` VARCHAR(255) NOT NULL,
    `searched_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `search_histories_user_id_searched_at_idx`(`user_id`, `searched_at`),
    UNIQUE INDEX `search_histories_user_id_query_key`(`user_id`, `query`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `search_histories` ADD CONSTRAINT `search_histories_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
