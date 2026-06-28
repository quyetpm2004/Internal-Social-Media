-- AlterTable
ALTER TABLE `comments` ADD COLUMN `is_pinned` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX `comments_post_id_is_pinned_idx` ON `comments`(`post_id`, `is_pinned`);
