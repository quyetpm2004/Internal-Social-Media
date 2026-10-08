import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import ItemSearch from "@/features/chat/components/conversation-list/ItemSearch";
import { chatApi } from "@/features/chat/apis/chat.api";
import type { ChatSearchUser } from "@/features/chat/types/chat-search.type";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import { SearchField } from "@/components/shared/SearchFilter";

interface AddGroupMembersModalProps {
  open: boolean;
  onClose: () => void;
  conversationId: number;
  currentUserId: number;
  existingMemberIds: number[];
  onAdded: () => void;
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

const AddGroupMembersModal = ({
  open,
  onClose,
  conversationId,
  currentUserId,
  existingMemberIds,
  onAdded,
}: AddGroupMembersModalProps) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ChatSearchUser[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selected, setSelected] = useState<ChatSearchUser[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const trimmedQuery = searchQuery.trim();
  const existingSet = useMemo(
    () => new Set(existingMemberIds),
    [existingMemberIds],
  );
  const selectedIds = useMemo(
    () => new Set(selected.map((u) => u.id)),
    [selected],
  );

  useEffect(() => {
    if (!open) {
      setSearchQuery("");
      setSearchResults([]);
      setSelected([]);
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
            (u) =>
              u.id !== currentUserId &&
              !existingSet.has(u.id) &&
              !selectedIds.has(u.id),
          ),
        );
      } catch {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [trimmedQuery, open, currentUserId, existingSet, selectedIds]);

  const handleAddToSelection = (user: ChatSearchUser) => {
    setSelected((prev) =>
      prev.some((m) => m.id === user.id) ? prev : [...prev, user],
    );
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleRemoveFromSelection = (userId: number) => {
    setSelected((prev) => prev.filter((m) => m.id !== userId));
  };

  const handleSubmit = async () => {
    if (selected.length === 0) {
      toast.error(t("pages.chat.selectAtLeastOneUser"));
      return;
    }

    try {
      setSubmitting(true);
      await chatApi.addGroupMembers(
        conversationId,
        selected.map((u) => u.id),
      );
      toast.success(t("pages.chat.memberAdded"));
      onAdded();
      onClose();
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const mapUser = (user: ChatSearchUser) => ({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t("pages.chat.addPeople")}
      containerClassName="z-60"
      onConfirm={handleSubmit}
      confirmText={t("pages.chat.addToGroup")}
      loading={submitting}
      confirmDisabled={selected.length === 0}
      hideCancel
      footerClassName="[&>button]:w-full"
    >
      <div className="space-y-4">
        <SearchField
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("pages.chat.searchByNameOrEmail")}
          className="w-full"
        />

        {selected.map((user) => (
          <ItemSearch
            key={user.id}
            user={mapUser(user)}
            showDeleteButton
            onDelete={() => handleRemoveFromSelection(user.id)}
          />
        ))}

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
            onClick={() => handleAddToSelection(user)}
          />
        ))}
      </div>
    </Modal>
  );
};

export default AddGroupMembersModal;
