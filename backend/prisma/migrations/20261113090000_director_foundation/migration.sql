-- 1. users.token_version (thu hồi access token khi đổi role / khóa tài khoản)
ALTER TABLE `users` ADD COLUMN `token_version` INTEGER NOT NULL DEFAULT 0;

-- 2. positions.key (khóa ổn định, backfill từ tên hiện có)
ALTER TABLE `positions` ADD COLUMN `key` VARCHAR(30) NULL;

UPDATE `positions` SET `key` = CASE `name`
  WHEN 'Giám đốc' THEN 'DIRECTOR'
  WHEN 'Trưởng phòng' THEN 'MANAGER'
  WHEN 'Chuyên viên cao cấp' THEN 'SENIOR'
  WHEN 'Nhân viên' THEN 'STAFF'
  WHEN 'Thực tập sinh' THEN 'INTERN'
  ELSE CONCAT('POSITION_', `id`)
END;

ALTER TABLE `positions` MODIFY `key` VARCHAR(30) NOT NULL;
CREATE UNIQUE INDEX `positions_key_key` ON `positions`(`key`);

-- 3. projects.department_id
ALTER TABLE `projects` ADD COLUMN `department_id` INTEGER NULL;
CREATE INDEX `projects_department_id_idx` ON `projects`(`department_id`);
ALTER TABLE `projects` ADD CONSTRAINT `projects_department_id_fkey`
  FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- 4. Dữ liệu cũ: "giám đốc" đang là MANAGER thuộc "Ban Giám đốc" -> DIRECTOR, không thuộc phòng nào.
--    Làm trước bước backfill dự án để dự án của Giám đốc trở thành liên phòng ban (department_id NULL).
UPDATE `departments` d
  JOIN `users` u ON u.`id` = d.`managerId`
  JOIN `positions` p ON p.`id` = u.`positionId`
  SET d.`managerId` = NULL
  WHERE p.`key` = 'DIRECTOR';

UPDATE `users` u
  JOIN `positions` p ON p.`id` = u.`positionId`
  SET u.`role` = 'DIRECTOR', u.`departmentId` = NULL, u.`token_version` = u.`token_version` + 1
  WHERE p.`key` = 'DIRECTOR' AND u.`role` = 'MANAGER';

-- 5. Xóa phòng "Ban Giám đốc" nếu chưa có task/workflow phòng ban tham chiếu (FK Restrict).
--    Thành viên còn lại về department_id NULL nhờ ON DELETE SET NULL.
UPDATE `departments` SET `managerId` = NULL WHERE `name` = 'Ban Giám đốc';

DELETE FROM `departments`
  WHERE `name` = 'Ban Giám đốc'
    AND NOT EXISTS (SELECT 1 FROM `tasks` t WHERE t.`department_id` = `departments`.`id`)
    AND NOT EXISTS (SELECT 1 FROM `workflows` w WHERE w.`department_id` = `departments`.`id`);

-- 6. Dự án có sẵn: gán phòng theo người tạo; người tạo không có phòng -> liên phòng (NULL).
UPDATE `projects` pr
  JOIN `users` u ON u.`id` = pr.`created_by_id`
  SET pr.`department_id` = u.`departmentId`;
