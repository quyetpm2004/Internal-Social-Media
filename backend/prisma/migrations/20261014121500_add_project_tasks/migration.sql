-- AlterTable
ALTER TABLE `projects` ADD COLUMN `next_task_number` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `project_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `code` VARCHAR(20) NOT NULL,
    `title` VARCHAR(200) NOT NULL,
    `description` TEXT NULL,
    `workflow_id` INTEGER NOT NULL,
    `task_type_id` INTEGER NOT NULL,
    `status_id` INTEGER NOT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'MEDIUM',
    `start_date` DATE NULL,
    `due_date` DATE NULL,
    `estimated_minutes` INTEGER NULL,
    `parent_task_id` INTEGER NULL,
    `created_by_id` INTEGER NOT NULL,
    `updated_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_tasks_project_id_idx`(`project_id`),
    INDEX `project_tasks_workflow_id_idx`(`workflow_id`),
    INDEX `project_tasks_task_type_id_idx`(`task_type_id`),
    INDEX `project_tasks_status_id_idx`(`status_id`),
    INDEX `project_tasks_parent_task_id_idx`(`parent_task_id`),
    INDEX `project_tasks_created_by_id_idx`(`created_by_id`),
    UNIQUE INDEX `project_tasks_project_id_code_key`(`project_id`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_task_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NOT NULL,
    `user_id` INTEGER NOT NULL,
    `task_role` ENUM('ASSIGNEE', 'REVIEWER', 'REPORTER') NOT NULL,
    `project_role_id` INTEGER NULL,

    INDEX `project_task_members_task_id_idx`(`task_id`),
    INDEX `project_task_members_user_id_task_role_idx`(`user_id`, `task_role`),
    INDEX `project_task_members_project_role_id_idx`(`project_role_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `project_workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_task_type_id_fkey` FOREIGN KEY (`task_type_id`) REFERENCES `project_task_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `project_workflow_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_parent_task_id_fkey` FOREIGN KEY (`parent_task_id`) REFERENCES `project_tasks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_members` ADD CONSTRAINT `project_task_members_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `project_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_members` ADD CONSTRAINT `project_task_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_members` ADD CONSTRAINT `project_task_members_project_role_id_fkey` FOREIGN KEY (`project_role_id`) REFERENCES `project_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
