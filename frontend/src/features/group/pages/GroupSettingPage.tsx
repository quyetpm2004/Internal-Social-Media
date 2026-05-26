import React, { useCallback, useEffect, useState } from "react";
import type { SettingConfig } from "../types/group.type";
import SettingSection from "../components/group-setting/SettingSection";
import EditForm from "../components/group-setting/EditForm";
import SettingItem from "../components/group-setting/SettingItem";
import { groupApi } from "../apis/group.api";
import { useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { GroupMemberRole } from "../utils/group-member";
import {
  BOOL_LABELS,
  buildSettingUpdatePayload,
  HIDDEN_LABELS,
  PERMISSION_LABELS,
  settingsToFormValues,
} from "../utils/group-settings";

const DEFAULT_SETTINGS: SettingConfig[] = [
  { id: "name", label: "Tên và mô tả", value: "", type: "input-group" },
  {
    id: "hide",
    label: "Ẩn nhóm",
    value: HIDDEN_LABELS.false,
    type: "radio",
    options: [HIDDEN_LABELS.false, HIDDEN_LABELS.true],
  },
  {
    id: "approve",
    label: "Ai có thể phê duyệt yêu cầu",
    value: PERMISSION_LABELS.ANY_MEMBER,
    type: "radio",
    options: [PERMISSION_LABELS.ADMIN_ONLY, PERMISSION_LABELS.ANY_MEMBER],
  },
  {
    id: "anonymous",
    label: "Tham gia ẩn danh",
    value: BOOL_LABELS.false,
    type: "radio",
    options: [BOOL_LABELS.true, BOOL_LABELS.false],
  },
  {
    id: "post",
    label: "Ai có thể đăng",
    value: PERMISSION_LABELS.ANY_MEMBER,
    type: "radio",
    options: [PERMISSION_LABELS.ADMIN_ONLY, PERMISSION_LABELS.ANY_MEMBER],
  },
  {
    id: "review",
    label: "Phê duyệt bài viết",
    value: BOOL_LABELS.false,
    type: "radio",
    options: [BOOL_LABELS.true, BOOL_LABELS.false],
  },
];

const GroupSettingPage: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { groupId } = useParams();
  const { currentMemberRole, isMember } = useOutletContext<{
    currentMemberRole: GroupMemberRole;
    isMember: boolean;
  }>();

  const [settings, setSettings] = useState<SettingConfig[]>(DEFAULT_SETTINGS);

  const applySettingsToForm = useCallback(
    (formValues: ReturnType<typeof settingsToFormValues>) => {
      const valueById: Record<string, string> = {
        hide: formValues.hide,
        approve: formValues.approve,
        anonymous: formValues.anonymous,
        post: formValues.post,
        review: formValues.review,
      };

      setSettings((prev) =>
        prev.map((item) => {
          if (item.id === "name") {
            return {
              ...item,
              value: formValues.name,
              description: formValues.description,
            };
          }
          if (valueById[item.id] !== undefined) {
            return { ...item, value: valueById[item.id] };
          }
          return item;
        }),
      );
    },
    [],
  );

  useEffect(() => {
    if (!groupId || currentMemberRole !== "ADMIN" || !isMember) {
      setIsFetching(false);
      return;
    }

    const fetchSettings = async () => {
      setIsFetching(true);
      try {
        const res = await groupApi.getGroupSetting(groupId);
        if (res.data) {
          applySettingsToForm(settingsToFormValues(res.data));
        }
      } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        toast.error(
          err?.response?.data?.message || err?.message || "Không thể tải cài đặt nhóm",
        );
      } finally {
        setIsFetching(false);
      }
    };

    fetchSettings();
  }, [groupId, currentMemberRole, isMember, applySettingsToForm]);

  const handleSave = async (id: string, newValue: string, newDesc?: string) => {
    if (!groupId) {
      return;
    }
    setIsLoading(true);
    try {
      const payload = buildSettingUpdatePayload(id, newValue, newDesc);
      const res = await groupApi.updateGroupSetting(groupId, payload);

      if (res.data) {
        applySettingsToForm(settingsToFormValues(res.data));
      } else {
        setSettings((prev) =>
          prev.map((s) => {
            if (s.id !== id) return s;
            if (id === "name") {
              return { ...s, value: newValue, description: newDesc ?? s.description };
            }
            return { ...s, value: newValue };
          }),
        );
      }

      setEditingId(null);
      toast.success("Đã lưu cài đặt");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } }; message?: string };
      toast.error(
        err?.response?.data?.message || err?.message || "Có lỗi xảy ra. Vui lòng thử lại.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = (title: string, itemIds: string[]) => {
    const itemsInSection = settings.filter((s) => itemIds.includes(s.id));

    return (
      <SettingSection title={title}>
        {itemsInSection.map((item) => (
          <div key={item.id}>
            {editingId === item.id ? (
              <EditForm
                isLoading={isLoading}
                item={item}
                onCancel={() => setEditingId(null)}
                onSave={handleSave}
              />
            ) : (
              <SettingItem
                label={item.label}
                value={
                  item.id === "name" && item.description
                    ? `${item.value} · ${item.description}`
                    : item.value
                }
                isDropdown={item.isDropdown}
                onClick={() => setEditingId(item.id)}
              />
            )}
          </div>
        ))}
      </SettingSection>
    );
  };

  if (currentMemberRole !== "ADMIN" || !isMember) {
    return (
      <div>
        <p className="text-gray-500 text-sm mt-2">
          Chỉ Quản trị viên mới có thể xem và thay đổi thiết lập của nhóm này.
        </p>
      </div>
    );
  }

  if (isFetching) {
    return (
      <p className="text-gray-500 text-sm mt-2">Đang tải cài đặt nhóm...</p>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl items-start">
        {renderContent("Thiết lập nhóm", ["name", "hide"])}
        {renderContent("Quản lý thành viên", ["approve"])}
        {renderContent("Quản lý nội dung thảo luận", [
          "anonymous",
          "post",
          "review",
        ])}
      </div>
    </div>
  );
};

export default GroupSettingPage;
