/*
  Warnings:

  - You are about to drop the column `fileSize` on the `post_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `file_type` on the `post_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `file_url` on the `post_attachments` table. All the data in the column will be lost.
  - You are about to drop the column `avatarUrl` on the `profile` table. All the data in the column will be lost.
  - Added the required column `attachment_type` to the `post_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_key` to the `post_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_size` to the `post_attachments` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mime_type` to the `post_attachments` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `post_attachments` DROP COLUMN `fileSize`,
    DROP COLUMN `file_type`,
    DROP COLUMN `file_url`,
    ADD COLUMN `attachment_type` ENUM('IMAGE', 'VIDEO', 'FILE') NOT NULL,
    ADD COLUMN `file_key` VARCHAR(191) NOT NULL,
    ADD COLUMN `file_size` INTEGER NOT NULL,
    ADD COLUMN `mime_type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `profile` DROP COLUMN `avatarUrl`,
    ADD COLUMN `avatar_key` VARCHAR(191) NULL;
