import { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { toast } from "sonner";
import ItemSearch from "@/features/chat/components/conversation-list/ItemSearch";
import { chatApi } from "@/features/chat/apis/chat.api";
import type { ChatSearchUser } from "@/features/chat/types/chat-search.type";
import type { ChatUser } from "@/features/chat/types/chat.type";
import { useTranslation } from "react-i18next";

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

  const handleSubmit = async (e: React.FormEvent) => {
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

  if (!open) return null;

  const mapUser = (user: ChatSearchUser | ChatUser) => ({
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
          <h2 className="text-lg font-bold text-on-surface">{t("pages.chat.createGroup")}</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-surface-container-high transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col min-h-0 flex-1">
          <div className="p-6 space-y-4 overflow-y-auto flex-1">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                {t("pages.chat.groupName")}
              </label>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder={t("pages.chat.groupNameExample")}
                required
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-high border-none outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-on-surface px-1">
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

            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-on-surface px-1">
                {t("pages.chat.addMembers")}
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("pages.chat.searchByNameOrEmail")}
                className="w-full px-4 py-3 rounded-2xl bg-surface-container-high border-none outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>

            {searchLoading && (
              <p className="text-xs text-on-surface-variant px-1">
                {t("pages.chat.searching")}
              </p>
            )}
            {!searchLoading && trimmedQuery && searchResults.length === 0 && (
              <p className="text-xs text-on-surface-variant px-1">
                {t("pages.chat.noUsersFound")}
              </p>
            )}
            {searchResults.map((user) => (
              <ItemSearch
                key={user.id}
                user={mapUser(user)}
                onClick={() => handleAddMember(user)}
              />
            ))}
          </div>

          <div className="px-6 py-4 border-t border-outline-variant shrink-0">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 rounded-2xl bg-primary text-on-primary font-semibold text-sm hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {submitting ? t("pages.chat.creating") : t("pages.chat.createGroup")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChatGroupModal;
