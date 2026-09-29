-- CreateTable
CREATE TABLE `project_templates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `version` INTEGER NOT NULL DEFAULT 1,
    `parent_template_id` INTEGER NULL,
    `created_by_id` INTEGER NOT NULL,
    `updated_by_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `project_templates_key_key`(`key`),
    INDEX `project_templates_status_idx`(`status`),
    INDEX `project_templates_created_by_id_idx`(`created_by_id`),
    INDEX `project_templates_parent_template_id_idx`(`parent_template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_project_roles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_project_roles_template_id_idx`(`template_id`),
    UNIQUE INDEX `template_project_roles_template_id_key_key`(`template_id`, `key`),
    UNIQUE INDEX `template_project_roles_template_id_name_key`(`template_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_workflows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `description` TEXT NULL,
    `is_default` BOOLEAN NOT NULL DEFAULT false,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_workflows_template_id_idx`(`template_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_task_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `template_id` INTEGER NOT NULL,
    `workflow_id` INTEGER NULL,
    `name` VARCHAR(150) NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_task_types_template_id_idx`(`template_id`),
    INDEX `template_task_types_workflow_id_idx`(`workflow_id`),
    UNIQUE INDEX `template_task_types_template_id_key_key`(`template_id`, `key`),
    UNIQUE INDEX `template_task_types_template_id_name_key`(`template_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_workflow_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workflow_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `key` VARCHAR(50) NOT NULL,
    `description` TEXT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `category` ENUM('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED') NOT NULL,
    `color` VARCHAR(20) NULL,
    `is_initial` BOOLEAN NOT NULL DEFAULT false,
    `is_final` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_workflow_statuses_workflow_id_idx`(`workflow_id`),
    UNIQUE INDEX `template_workflow_statuses_workflow_id_key_key`(`workflow_id`, `key`),
    UNIQUE INDEX `template_workflow_statuses_workflow_id_name_key`(`workflow_id`, `name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_workflow_transitions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `workflow_id` INTEGER NOT NULL,
    `from_status_id` INTEGER NOT NULL,
    `to_status_id` INTEGER NOT NULL,
    `name` VARCHAR(150) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_workflow_transitions_workflow_id_idx`(`workflow_id`),
    INDEX `template_workflow_transitions_from_status_id_idx`(`from_status_id`),
    INDEX `template_workflow_transitions_to_status_id_idx`(`to_status_id`),
    UNIQUE INDEX `template_workflow_transitions_workflow_id_from_status_id_to__key`(`workflow_id`, `from_status_id`, `to_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `template_approval_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transition_id` INTEGER NOT NULL,
    `approver_type` ENUM('PROJECT_ROLE', 'TASK_ROLE') NOT NULL,
    `project_role_id` INTEGER NULL,
    `task_role` ENUM('ASSIGNEE', 'REVIEWER', 'REPORTER') NULL,
    `min_approvals` INTEGER NOT NULL DEFAULT 1,
    `on_reject_status_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `template_approval_rules_transition_id_idx`(`transition_id`),
    INDEX `template_approval_rules_project_role_id_idx`(`project_role_id`),
    INDEX `template_approval_rules_on_reject_status_id_idx`(`on_reject_status_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `project_templates` ADD CONSTRAINT `project_templates_parent_template_id_fkey` FOREIGN KEY (`parent_template_id`) REFERENCES `project_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `project_templates` ADD CONSTRAINT `project_templates_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `project_templates` ADD CONSTRAINT `project_templates_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `template_project_roles` ADD CONSTRAINT `template_project_roles_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `project_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_workflows` ADD CONSTRAINT `template_workflows_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `project_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_task_types` ADD CONSTRAINT `template_task_types_template_id_fkey` FOREIGN KEY (`template_id`) REFERENCES `project_templates`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_task_types` ADD CONSTRAINT `template_task_types_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `template_workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_workflow_statuses` ADD CONSTRAINT `template_workflow_statuses_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `template_workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_workflow_transitions` ADD CONSTRAINT `template_workflow_transitions_workflow_id_fkey` FOREIGN KEY (`workflow_id`) REFERENCES `template_workflows`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_workflow_transitions` ADD CONSTRAINT `template_workflow_transitions_from_status_id_fkey` FOREIGN KEY (`from_status_id`) REFERENCES `template_workflow_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_workflow_transitions` ADD CONSTRAINT `template_workflow_transitions_to_status_id_fkey` FOREIGN KEY (`to_status_id`) REFERENCES `template_workflow_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_approval_rules` ADD CONSTRAINT `template_approval_rules_transition_id_fkey` FOREIGN KEY (`transition_id`) REFERENCES `template_workflow_transitions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `template_approval_rules` ADD CONSTRAINT `template_approval_rules_project_role_id_fkey` FOREIGN KEY (`project_role_id`) REFERENCES `template_project_roles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `template_approval_rules` ADD CONSTRAINT `template_approval_rules_on_reject_status_id_fkey` FOREIGN KEY (`on_reject_status_id`) REFERENCES `template_workflow_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
