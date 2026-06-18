import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { X } from "lucide-react";
import type { Department } from "@/features/profile/types/profile.type";
import { profileApi } from "@/features/profile/api/profile.api";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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

  if (!open) return null;

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
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      {/* backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* modal */}
      <div className="relative w-full max-w-2xl rounded-3xl bg-surface shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low">
          <h2 className="text-xl font-bold text-on-surface">{t("pages.groups.createNewGroup")}</h2>

          <button
            onClick={onClose}
            className="
              p-2 rounded-full
              hover:bg-surface-container-high
              transition-colors
            "
          >
            <X size={20} />
          </button>
        </div>

        {/* body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            {/* group name */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                {t("pages.groups.groupName")}
              </label>

              <input
                type="text"
                name="groupName"
                placeholder={t("pages.groups.groupNameExample")}
                value={formData.groupName}
                onChange={handleChange}
                required
                className="
                  w-full
                  px-4 py-3
                  rounded-2xl
                  bg-surface-container-high
                  border-none
                  outline-none
                  focus:ring-2 focus:ring-primary
                  placeholder:text-on-surface-variant/50
                "
              />
            </div>

            {/* description */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                {t("common.description")}
              </label>

              <textarea
                rows={4}
                name="description"
                placeholder={t("pages.groups.descriptionPlaceholder")}
                value={formData.description}
                onChange={handleChange}
                className="
                  w-full
                  px-4 py-3
                  rounded-2xl
                  bg-surface-container-high
                  border-none
                  outline-none
                  resize-none
                  focus:ring-2 focus:ring-primary
                  placeholder:text-on-surface-variant/50
                "
              />
            </div>

            {/* select */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* privacy */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface px-1">
                  {t("pages.groups.privacy")}
                </label>

                <select
                  name="groupType"
                  value={formData.groupType}
                  onChange={handleChange}
                  className="
                    w-full
                    px-4 py-3
                    rounded-2xl
                    bg-surface-container-high
                    border-none
                    outline-none
                    focus:ring-2 focus:ring-primary
                  "
                >
                  <option value="PUBLIC">{t("pages.groups.privacyPublic")}</option>
                  <option value="PRIVATE">{t("pages.groups.privacyPrivate")}</option>
                  <option value="DEPARTMENT">{t("pages.groups.privacyDepartment")}</option>
                </select>
              </div>

              {/* department */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-on-surface px-1">
                  {t("pages.groups.department")}
                </label>

                <select
                  name="departmentId"
                  value={formData.departmentId}
                  onChange={handleChange}
                  className="
                    w-full
                    px-4 py-3
                    rounded-2xl
                    bg-surface-container-high
                    border-none
                    outline-none
                    focus:ring-2 focus:ring-primary
                  "
                >
                  <option value="">{t("pages.groups.noDepartment")}</option>

                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* footer */}
          <div className="flex justify-end gap-3 px-6 py-4 border-t border-outline-variant bg-surface-container-low">
            <button
              type="button"
              onClick={onClose}
              className="
                px-6 py-2.5
                rounded-xl
                text-sm
                font-semibold
                text-on-surface-variant
                hover:bg-surface-container-high
                transition-colors
              "
            >
              {t("common.cancel")}
            </button>

            <button
              type="submit"
              className="
                px-6 py-2.5
                rounded-xl
                bg-primary
                text-white
                text-sm
                font-semibold
                hover:brightness-110
                active:scale-95
                transition-all
              "
            >
              {t("pages.groups.createGroup")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
