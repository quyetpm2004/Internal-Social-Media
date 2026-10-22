-- Existing workflows keep the current strict behavior.
-- New workflows default to free movement inside the same workflow.
ALTER TABLE `template_workflows`
    ADD COLUMN `transition_mode` ENUM('FREE', 'STRICT') NOT NULL DEFAULT 'STRICT';

ALTER TABLE `project_workflows`
    ADD COLUMN `transition_mode` ENUM('FREE', 'STRICT') NOT NULL DEFAULT 'STRICT';

ALTER TABLE `template_workflows`
    MODIFY `transition_mode` ENUM('FREE', 'STRICT') NOT NULL DEFAULT 'FREE';

ALTER TABLE `project_workflows`
    MODIFY `transition_mode` ENUM('FREE', 'STRICT') NOT NULL DEFAULT 'FREE';
