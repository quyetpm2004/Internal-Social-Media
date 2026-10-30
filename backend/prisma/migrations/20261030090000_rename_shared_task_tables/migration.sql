-- Đổi tên các bảng dùng chung cho cả dự án và phòng ban: bỏ tiền tố project_.
-- Dùng RENAME để giữ nguyên dữ liệu, không drop/create.

-- CreateIndex
CREATE INDEX `tasks_updated_by_id_idx` ON `project_tasks`(`updated_by_id`);

-- DropForeignKey
ALTER TABLE `project_task_comment_attachments` DROP FOREIGN KEY `project_task_comment_attachments_comment_id_fkey`;
ALTER TABLE `project_task_comment_attachments` DROP FOREIGN KEY `project_task_comment_attachments_uploaded_by_id_fkey`;
ALTER TABLE `project_task_attachments` DROP FOREIGN KEY `project_task_attachments_task_id_fkey`;
ALTER TABLE `project_task_attachments` DROP FOREIGN KEY `project_task_attachments_uploaded_by_id_fkey`;
ALTER TABLE `project_task_comments` DROP FOREIGN KEY `project_task_comments_task_id_fkey`;
ALTER TABLE `project_task_comments` DROP FOREIGN KEY `project_task_comments_user_id_fkey`;
ALTER TABLE `project_task_members` DROP FOREIGN KEY `project_task_members_task_id_fkey`;
ALTER TABLE `project_task_members` DROP FOREIGN KEY `project_task_members_user_id_fkey`;
ALTER TABLE `project_task_members` DROP FOREIGN KEY `project_task_members_project_role_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_project_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_department_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_workflow_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_task_type_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_status_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_parent_task_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_phase_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_created_by_id_fkey`;
ALTER TABLE `project_tasks` DROP FOREIGN KEY `project_tasks_updated_by_id_fkey`;
ALTER TABLE `project_workflow_statuses` DROP FOREIGN KEY `project_workflow_statuses_workflow_id_fkey`;
ALTER TABLE `project_workflows` DROP FOREIGN KEY `project_workflows_project_id_fkey`;
ALTER TABLE `project_workflows` DROP FOREIGN KEY `project_workflows_department_id_fkey`;

-- RenameTable
RENAME TABLE
    `project_task_comment_attachments` TO `task_comment_attachments`,
    `project_task_attachments` TO `task_attachments`,
    `project_task_comments` TO `task_comments`,
    `project_task_members` TO `task_members`,
    `project_tasks` TO `tasks`,
    `project_workflow_statuses` TO `workflow_statuses`,
    `project_workflows` TO `workflows`;

-- RenameIndex
ALTER TABLE `task_comment_attachments`
    RENAME INDEX `project_task_comment_attachments_comment_id_idx` TO `task_comment_attachments_comment_id_idx`,
    RENAME INDEX `project_task_comment_attachments_file_key_key` TO `task_comment_attachments_file_key_key`,
    RENAME INDEX `project_task_comment_attachments_uploaded_by_id_status_idx` TO `task_comment_attachments_uploaded_by_id_status_idx`;
ALTER TABLE `task_attachments`
    RENAME INDEX `project_task_attachments_file_key_key` TO `task_attachments_file_key_key`,
    RENAME INDEX `project_task_attachments_task_id_source_idx` TO `task_attachments_task_id_source_idx`,
    RENAME INDEX `project_task_attachments_uploaded_by_id_status_idx` TO `task_attachments_uploaded_by_id_status_idx`;
ALTER TABLE `task_comments`
    RENAME INDEX `project_task_comments_task_id_created_at_idx` TO `task_comments_task_id_created_at_idx`,
    RENAME INDEX `project_task_comments_user_id_idx` TO `task_comments_user_id_idx`;
ALTER TABLE `task_members`
    RENAME INDEX `project_task_members_project_role_id_idx` TO `task_members_project_role_id_idx`,
    RENAME INDEX `project_task_members_task_id_idx` TO `task_members_task_id_idx`,
    RENAME INDEX `project_task_members_user_id_task_role_idx` TO `task_members_user_id_task_role_idx`;
ALTER TABLE `tasks`
    RENAME INDEX `project_tasks_created_by_id_idx` TO `tasks_created_by_id_idx`,
    RENAME INDEX `project_tasks_department_id_code_key` TO `tasks_department_id_code_key`,
    RENAME INDEX `project_tasks_department_id_completed_at_idx` TO `tasks_department_id_completed_at_idx`,
    RENAME INDEX `project_tasks_department_id_idx` TO `tasks_department_id_idx`,
    RENAME INDEX `project_tasks_parent_task_id_idx` TO `tasks_parent_task_id_idx`,
    RENAME INDEX `project_tasks_phase_id_idx` TO `tasks_phase_id_idx`,
    RENAME INDEX `project_tasks_project_id_code_key` TO `tasks_project_id_code_key`,
    RENAME INDEX `project_tasks_project_id_completed_at_idx` TO `tasks_project_id_completed_at_idx`,
    RENAME INDEX `project_tasks_project_id_idx` TO `tasks_project_id_idx`,
    RENAME INDEX `project_tasks_status_id_idx` TO `tasks_status_id_idx`,
    RENAME INDEX `project_tasks_task_type_id_idx` TO `tasks_task_type_id_idx`,
    RENAME INDEX `project_tasks_workflow_id_idx` TO `tasks_workflow_id_idx`;
ALTER TABLE `workflow_statuses`
    RENAME INDEX `project_workflow_statuses_workflow_id_idx` TO `workflow_statuses_workflow_id_idx`,
    RENAME INDEX `project_workflow_statuses_workflow_id_key_key` TO `workflow_statuses_workflow_id_key_key`,
    RENAME INDEX `project_workflow_statuses_workflow_id_name_key` TO `workflow_statuses_workflow_id_name_key`;
ALTER TABLE `workflows`
    RENAME INDEX `project_workflows_department_id_key` TO `workflows_department_id_key`,
    RENAME INDEX `project_workflows_project_id_idx` TO `workflows_project_id_idx`;

-- AddForeignKey
ALTER TABLE `task_comment_attachments` ADD CONSTRAINT `task_comment_attachments_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `task_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_comment_attachments` ADD CONSTRAINT `task_comment_attachments_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_attachments` ADD CONSTRAINT `task_attachments_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_comments` ADD CONSTRAINT `task_comments_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `task_members` ADD CONSTRAINT `task_members_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `task_members` ADD CONSTRAINT `task_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `task_members` ADD CONSTRAINT `task_members_project_role_id_fkey` FOREIGN KEY (`project_role_id`) REFERENCES `project_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_task_type_id_fkey` FOREIGN KEY (`task_type_id`) REFERENCES `project_task_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_status_id_fkey` FOREIGN KEY (`status_id`) REFERENCES `workflow_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_parent_task_id_fkey` FOREIGN KEY (`parent_task_id`) REFERENCES `tasks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_phase_id_fkey` FOREIGN KEY (`phase_id`) REFERENCES `project_phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `tasks` ADD CONSTRAINT `tasks_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `workflow_statuses` ADD CONSTRAINT `workflow_statuses_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `workflows`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflows` ADD CONSTRAINT `workflows_project_id_fkey` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `workflows` ADD CONSTRAINT `workflows_department_id_fkey` FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
