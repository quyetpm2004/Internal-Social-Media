-- AlterTable
ALTER TABLE `project_tasks` ADD COLUMN `phase_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `project_phases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `goal` TEXT NULL,
    `start_date` DATE NULL,
    `end_date` DATE NULL,
    `status` ENUM('PLANNED', 'ACTIVE', 'COMPLETED') NOT NULL DEFAULT 'PLANNED',
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_phases_project_id_status_idx`(`project_id`, `status`),
    INDEX `project_phases_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_milestones` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `project_id` INTEGER NOT NULL,
    `phase_id` INTEGER NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `due_date` DATE NOT NULL,
    `status` ENUM('OPEN', 'REACHED') NOT NULL DEFAULT 'OPEN',
    `reached_at` DATETIME(3) NULL,
    `created_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `project_milestones_project_id_due_date_idx`(`project_id`, `due_date`),
    INDEX `project_milestones_phase_id_idx`(`phase_id`),
    INDEX `project_milestones_created_by_id_idx`(`created_by_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_milestone_tasks` (
    `milestone_id` INTEGER NOT NULL,
    `task_id` INTEGER NOT NULL,

    INDEX `project_milestone_tasks_task_id_idx`(`task_id`),
    PRIMARY KEY (`milestone_id`, `task_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `project_tasks_phase_id_idx` ON `project_tasks`(`phase_id`);

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `project_phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_phases` ADD CONSTRAINT `project_phases_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_phases` ADD CONSTRAINT `project_phases_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `project_phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestones` ADD CONSTRAINT `project_milestones_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestone_tasks` ADD CONSTRAINT `project_milestone_tasks_milestone_id_fkey` FOREIGN KEY (`milestone_id`) REFERENCES `project_milestones`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_milestone_tasks` ADD CONSTRAINT `project_milestone_tasks_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `project_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
