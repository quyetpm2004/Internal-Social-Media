import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import ItemSearch from "@/features/chat/components/conversation-list/ItemSearch";
import { chatApi } from "@/features/chat/apis/chat.api";
import type { ChatSearchUser } from "@/features/chat/types/chat-search.type";
import { useTranslation } from "react-i18next";

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

  if (!open) return null;

  const mapUser = (user: ChatSearchUser) => ({
    id: user.id,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  });

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />

      <div className="relative w-full max-w-md rounded-3xl bg-surface shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-surface-container-low shrink-0">
          <h2 className="text-lg font-bold text-on-surface">{t("pages.chat.addPeople")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto flex-1 min-h-0">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("pages.chat.searchByNameOrEmail")}
            className="w-full px-4 py-3 rounded-2xl bg-surface-container-high border-none outline-none focus:ring-2 focus:ring-primary text-sm"
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
            <p className="text-xs text-on-surface-variant">{t("pages.chat.searching")}</p>
          )}
          {!searchLoading && trimmedQuery && searchResults.length === 0 && (
            <p className="text-xs text-on-surface-variant">
              {t("pages.chat.noUsersFound")}
            </p>
          )}
          {searchResults.map((user) => (
            <ItemSearch
              key={user.id}
              user={mapUser(user)}
              onClick={() => handleAddToSelection(user)}
            />
          ))}
        </div>

        <div className="px-6 py-4 border-t border-outline-variant shrink-0">
          <button
            type="button"
            disabled={submitting || selected.length === 0}
            onClick={handleSubmit}
            className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? t("pages.chat.adding") : t("pages.chat.addToGroup")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroupMembersModal;
