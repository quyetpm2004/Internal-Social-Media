import React, { useState } from "react";
import type { SettingConfig } from "../types/group.type";
import SettingSection from "../components/group-setting/SettingSection";
import EditForm from "../components/group-setting/EditForm";
import SettingItem from "../components/group-setting/SettingItem";
import { groupApi } from "../apis/group.api";
import { useNavigate, useOutletContext, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { GroupMemberRole } from "../utils/group-member";
import { Home } from "lucide-react";

const GroupSettingPage: React.FC = () => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { groupId } = useParams();
  const { currentMemberRole, isMember } = useOutletContext<{
    currentMemberRole: GroupMemberRole;
    isMember: boolean;
  }>();
  const navigate = useNavigate();

  const [settings, setSettings] = useState<SettingConfig[]>([
    { id: "name", label: "Tên và mô tả", value: "test", type: "input-group" },
    {
      id: "hide",
      label: "Ẩn nhóm",
      value: "Ẩn",
      type: "radio",
      options: ["Hiển thị", "Ẩn"],
    },
    {
      id: "approve",
      label: "Ai có thể phê duyệt yêu cầu",
      value: "Bất cứ ai trong nhóm",
      type: "radio",
      options: ["Chỉ quản trị viên", "Bất cứ ai trong nhóm"],
    },
    {
      id: "anonymous",
      label: "Tham gia ẩn danh",
      value: "Bật",
      type: "radio",
      options: ["Bật", "Tắt"],
    },
    {
      id: "post",
      label: "Ai có thể đăng",
      value: "Bất cứ ai trong nhóm",
      type: "radio",
      options: ["Chỉ quản trị viên", "Bất cứ ai trong nhóm"],
    },
    {
      id: "review",
      label: "Phê duyệt bài viết",
      value: "Tắt",
      type: "radio",
      options: ["Bật", "Tắt"],
    },
  ]);

  const handleSave = async (id: string, newValue: string, newDesc?: string) => {
    if (!groupId) {
      return;
    }
    setIsLoading(true);
    try {
      let response;
      switch (id) {
        case "name":
          response = await groupApi.updateGroup(
            groupId,
            newValue,
            newDesc as string,
          );
          break;
        default:
          console.log("No action");
      }
      setSettings((prev) =>
        prev.map((s) => (s.id === id ? { ...s, value: newValue } : s)),
      );
      setEditingId(null);
    } catch (error: any) {
      console.error("Lỗi:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
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
                value={item.value}
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
        <button
          onClick={() => navigate("/news-feed")}
          className="mt-6 flex items-center gap-2 text-blue-600 hover:underline font-medium text-sm cursor-pointer"
        >
          <Home size={16} />
          Quay lại trang chính
        </button>
      </div>
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
