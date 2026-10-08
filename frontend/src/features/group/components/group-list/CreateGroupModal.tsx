import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import type { Department } from "@/features/profile/types/profile.type";
import { profileApi } from "@/features/profile/api/profile.api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Select from "@/components/shared/Select";
import Textarea from "@/components/shared/Textarea";

type CreateGroupModalProps = {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateGroupFormData) => void;
};

export type CreateGroupFormData = {
  groupName: string;
  description: string;
  groupType: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  departmentId?: string;
};

const FORM_ID = "create-group";

const CreateGroupModal = ({
  open,
  onClose,
  onSubmit,
}: CreateGroupModalProps) => {
  const { t } = useTranslation();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [formData, setFormData] = useState<CreateGroupFormData>({
    groupName: "",
    description: "",
    groupType: "PUBLIC",
    departmentId: undefined,
  });

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await profileApi.getDepartments();
        setDepartments(response.data);
      } catch (error: any) {
        console.error("Failed to fetch departments:", error);
        const message =
          error?.response?.data?.message ||
          error?.message ||
          t("common.genericError");
        toast.error(message);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.groups.createNewGroup")}
      size="xl"
      containerClassName="z-60"
      formId={FORM_ID}
      confirmText={t("pages.groups.createGroup")}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("pages.groups.groupName")} required>
          <Input
            type="text"
            name="groupName"
            placeholder={t("pages.groups.groupNameExample")}
            value={formData.groupName}
            onChange={handleChange}
            required
          />
        </Field>

        <Field label={t("common.description")}>
          <Textarea
            name="description"
            placeholder={t("pages.groups.descriptionPlaceholder")}
            value={formData.description}
            onChange={handleChange}
            className="min-h-28 resize-none"
          />
        </Field>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field label={t("pages.groups.privacy")}>
            <Select
              name="groupType"
              value={formData.groupType}
              onChange={handleChange}
            >
              <option value="PUBLIC">{t("pages.groups.privacyPublic")}</option>
              <option value="PRIVATE">{t("pages.groups.privacyPrivate")}</option>
              <option value="DEPARTMENT">
                {t("pages.groups.privacyDepartment")}
              </option>
            </Select>
          </Field>

          <Field label={t("pages.groups.department")}>
            <Select
              name="departmentId"
              value={formData.departmentId ?? ""}
              onChange={handleChange}
            >
              <option value="">{t("pages.groups.noDepartment")}</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </form>
    </Modal>
  );
};

export default CreateGroupModal;
