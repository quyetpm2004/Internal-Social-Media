import { useEffect, useMemo, useState, type FormEvent } from "react";
import { toast } from "sonner";
import ItemSearch from "@/features/chat/components/conversation-list/ItemSearch";
import { chatApi } from "@/features/chat/apis/chat.api";
import type { ChatSearchUser } from "@/features/chat/types/chat-search.type";
import type { ChatUser } from "@/features/chat/types/chat.type";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import { SearchField } from "@/components/shared/SearchFilter";

interface CreateChatGroupModalProps {
  open: boolean;
  onClose: () => void;
  initialMember: ChatUser;
  currentUserId: number;
  onSubmit: (data: { name: string; memberIds: number[] }) => Promise<void>;
}

const getErrorMessage = (error: unknown) => {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
};

const CreateChatGroupModal = ({
  open,
  onClose,
  initialMember,
  currentUserId,
  onSubmit,
}: CreateChatGroupModalProps) => {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [extraMembers, setExtraMembers] = useState<ChatSearchUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const trimmedQuery = searchQuery.trim();

  const selectedIds = useMemo(
    () => new Set([initialMember.id, ...extraMembers.map((m) => m.id)]),
    [initialMember.id, extraMembers],
  );

  useEffect(() => {
    if (!open) {
      setGroupName("");
      setSearchQuery("");
      setSearchResults([]);
      setExtraMembers([]);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !trimmedQuery) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await chatApi.searchUsers(trimmedQuery, 1, 15);
        setSearchResults(
          res.data.users.filter(
            (u) => u.id !== currentUserId && !selectedIds.has(u.id),
          ),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedQuery, open, currentUserId, selectedIds]);

  const handleAddMember = (user: ChatSearchUser) => {
    setExtraMembers((prev) =>
      prev.some((m) => m.id === user.id) ? prev : [...prev, user],
    );
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveMember = (userId: number) => {
    setExtraMembers((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const name = groupName.trim();
    if (!name) {
      toast.error(t("pages.chat.enterGroupName"));
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit({
        name,
        memberIds: [initialMember.id, ...extraMembers.map((m) => m.id)],
      });
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const mapUser = (user: ChatSearchUser | ChatUser) => ({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.chat.createGroup")}
      containerClassName="z-60"
      formId="create-chat-group"
      confirmText={t("pages.chat.createGroup")}
      loading={submitting}
      hideCancel
      footerClassName="[&>button]:w-full"
    >
      <form id="create-chat-group" onSubmit={handleSubmit} className="space-y-4">
        <Field label={t("pages.chat.groupName")} required>
          <Input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t("pages.chat.groupNameExample")}
            required
          />
        </Field>

        <div className="space-y-2">
          <p className="text-sm font-medium text-slate-700">
            {t("pages.chat.members")}
          </p>
          <ItemSearch user={mapUser(initialMember)} />
          {extraMembers.map((user) => (
            <ItemSearch
              key={user.id}
              user={mapUser(user)}
              showDeleteButton
              onDelete={() => handleRemoveMember(user.id)}
            />
          ))}
        </div>

        <Field label={t("pages.chat.addMembers")}>
          <SearchField
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("pages.chat.searchByNameOrEmail")}
            className="w-full"
          />
        </Field>

        {searchLoading && (
          <p className="text-xs text-slate-500">{t("pages.chat.searching")}</p>
        )}
        {!searchLoading && trimmedQuery && searchResults.length === 0 && (
          <p className="text-xs text-slate-500">{t("pages.chat.noUsersFound")}</p>
        )}
        {searchResults.map((user) => (
          <ItemSearch
            key={user.id}
            user={mapUser(user)}
            onClick={() => handleAddMember(user)}
          />
        ))}
      </form>
    </Modal>
  );
};

export default CreateChatGroupModal;
