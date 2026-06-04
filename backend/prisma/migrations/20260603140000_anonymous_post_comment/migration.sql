-- AlterTable: anonymous on content, not membership
ALTER TABLE `group_members` DROP COLUMN `is_anonymous`;

ALTER TABLE `posts` ADD COLUMN `is_anonymous` BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE `comments` ADD COLUMN `is_anonymous` BOOLEAN NOT NULL DEFAULT false;
