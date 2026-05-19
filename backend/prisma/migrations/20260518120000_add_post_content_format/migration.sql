-- AlterTable
ALTER TABLE `posts` ADD COLUMN `content_format` ENUM('PLAIN', 'HTML') NOT NULL DEFAULT 'PLAIN';
