-- Mỗi quy tắc duyệt chỉ cần 1 người duyệt: đưa dữ liệu cũ có min_approvals > 1 về 1.
UPDATE `template_approval_rules` SET `min_approvals` = 1 WHERE `min_approvals` <> 1;
UPDATE `project_approval_rules` SET `min_approvals` = 1 WHERE `min_approvals` <> 1;
