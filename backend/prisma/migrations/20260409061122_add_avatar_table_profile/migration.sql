/*
  Warnings:

  - You are about to drop the column `avatarUrl` on the `user` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `profile` ADD COLUMN `avatarUrl` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `avatarUrl`;
