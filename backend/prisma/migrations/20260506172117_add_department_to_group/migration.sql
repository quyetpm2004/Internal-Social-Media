-- AlterTable
ALTER TABLE `group_members` ADD COLUMN `status` ENUM('PENDING', 'ACTIVE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE `groups` ADD COLUMN `avatar_key` VARCHAR(191) NULL,
    ADD COLUMN `cover_key` VARCHAR(191) NULL,
    ADD COLUMN `departmentId` INTEGER NULL,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `groups_departmentId_idx` ON `groups`(`departmentId`);

-- AddForeignKey
ALTER TABLE `groups` ADD CONSTRAINT `groups_departmentId_fkey` FOREIGN KEY (`departmentId`) REFERENCES `Department`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
