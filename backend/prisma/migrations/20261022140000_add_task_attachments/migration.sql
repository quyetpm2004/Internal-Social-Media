-- CreateTable
CREATE TABLE `project_task_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `task_id` INTEGER NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_key` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `attachment_type` ENUM('IMAGE', 'VIDEO', 'FILE') NOT NULL,
    `source` ENUM('DESCRIPTION', 'FILE') NOT NULL DEFAULT 'FILE',
    `status` ENUM('PENDING', 'READY', 'ACTIVE', 'FAILED', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `uploaded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_task_attachments_file_key_key`(`file_key`),
    INDEX `project_task_attachments_task_id_source_idx`(`task_id`, `source`),
    INDEX `project_task_attachments_uploaded_by_id_status_idx`(`uploaded_by_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_task_comment_attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `comment_id` INTEGER NULL,
    `file_name` VARCHAR(255) NOT NULL,
    `file_key` VARCHAR(500) NOT NULL,
    `mime_type` VARCHAR(150) NOT NULL,
    `file_size` INTEGER NOT NULL,
    `attachment_type` ENUM('IMAGE', 'VIDEO', 'FILE') NOT NULL,
    `status` ENUM('PENDING', 'READY', 'ACTIVE', 'FAILED', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `uploaded_by_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_task_comment_attachments_file_key_key`(`file_key`),
    INDEX `project_task_comment_attachments_comment_id_idx`(`comment_id`),
    INDEX `project_task_comment_attachments_uploaded_by_id_status_idx`(`uploaded_by_id`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_task_attachments` ADD CONSTRAINT `project_task_attachments_task_id_fkey` FOREIGN KEY (`task_id`) REFERENCES `project_tasks`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_attachments` ADD CONSTRAINT `project_task_attachments_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_comment_attachments` ADD CONSTRAINT `project_task_comment_attachments_comment_id_fkey` FOREIGN KEY (`comment_id`) REFERENCES `project_task_comments`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `project_task_comment_attachments` ADD CONSTRAINT `project_task_comment_attachments_uploaded_by_id_fkey` FOREIGN KEY (`uploaded_by_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
