-- DropForeignKey
ALTER TABLE `tasks` DROP FOREIGN KEY `tasks_parent_task_id_fkey`;

-- DropIndex
DROP INDEX `tasks_parent_task_id_idx` ON `tasks`;

-- AlterTable
ALTER TABLE `tasks` DROP COLUMN `parent_task_id`;

-- CreateTable
CREATE TABLE `task_dependency_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `logic_type` ENUM('AND', 'OR') NOT NULL DEFAULT 'AND',
    `selection_mode` ENUM('MANUAL', 'AUTO') NOT NULL DEFAULT 'MANUAL',
    `selected_dependency_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `task_dependency_groups_selected_dependency_id_key`(`selected_dependency_id`),
    INDEX `task_dependency_groups_task_id_idx`(`task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `task_dependencies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `predecessor_task_id` INTEGER NOT NULL,
    `successor_task_id` INTEGER NOT NULL,
    `relationship_type` ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS',
    `lag` DECIMAL(8, 2) NOT NULL DEFAULT 0,
    `lag_unit` ENUM('DAY', 'HOUR') NOT NULL DEFAULT 'DAY',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `task_dependencies_group_id_idx`(`group_id`),
    INDEX `task_dependencies_successor_task_id_idx`(`successor_task_id`),
    UNIQUE INDEX `task_dependencies_predecessor_task_id_successor_task_id_key`(`predecessor_task_id`, `successor_task_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `task_dependency_groups` ADD CONSTRAINT `task_dependency_groups_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependency_groups` ADD CONSTRAINT `task_dependency_groups_selected_dependency_id_fkey` FOREIGN KEY (`selected_dependency_id`) REFERENCES `task_dependencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependencies` ADD CONSTRAINT `task_dependencies_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `task_dependency_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependencies` ADD CONSTRAINT `task_dependencies_predecessor_task_id_fkey` FOREIGN KEY (`predecessor_task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `task_dependencies` ADD CONSTRAINT `task_dependencies_successor_task_id_fkey` FOREIGN KEY (`successor_task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

