/*
  Warnings:

  - A unique constraint covering the columns `[department_id,code]` on the table `project_tasks` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[department_id]` on the table `project_workflows` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `departments` ADD COLUMN `next_task_number` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `project_tasks` ADD COLUMN `department_id` INTEGER NULL,
    MODIFY `project_id` INTEGER NULL,
    MODIFY `task_type_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `project_workflows` ADD COLUMN `department_id` INTEGER NULL,
    MODIFY `project_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `project_tasks_department_id_idx` ON `project_tasks`(`department_id`);

-- CreateIndex
CREATE INDEX `project_tasks_department_id_completed_at_idx` ON `project_tasks`(`department_id`, `completed_at`);

-- CreateIndex
CREATE UNIQUE INDEX `project_tasks_department_id_code_key` ON `project_tasks`(`department_id`, `code`);

-- CreateIndex
CREATE UNIQUE INDEX `project_workflows_department_id_key` ON `project_workflows`(`department_id`);

-- AddForeignKey
ALTER TABLE `project_workflows` ADD CONSTRAINT `project_workflows_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_tasks` ADD CONSTRAINT `project_tasks_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
