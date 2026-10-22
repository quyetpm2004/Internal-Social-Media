-- AlterTable
ALTER TABLE `project_tasks` ADD COLUMN `completed_at` DATETIME(3) NULL;

-- CreateIndex
CREATE INDEX `project_tasks_project_id_completed_at_idx` ON `project_tasks`(`project_id`, `completed_at`);
