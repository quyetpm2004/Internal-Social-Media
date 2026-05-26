import { useEffect, useMemo, useState } from "react";
import { ImageIcon, Play, User } from "lucide-react";
import { Link, useParams } from "react-router-dom";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { toast } from "sonner";
import { groupApi } from "@/features/group/apis/group.api";
import { AttachmentSearchBar } from "@/features/group/components/group-detail/attachments/AttachmentSearchBar";
import GroupPagination from "@/features/group/components/group-list/GroupPagination";
import type { GroupAttachmentItem } from "@/features/group/types/group.type";

function getErrorMessage(error: unknown): string {
  const err = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return (
    err?.response?.data?.message ||
    err?.message ||
    "Có lỗi xảy ra. Vui lòng thử lại."
  );
}

const GroupMediaPage = () => {
  const { groupId } = useParams();
  const [items, setItems] = useState<GroupAttachmentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [pagination, setPagination] = useState({
    total: 0,
    totalPages: 1,
    limit: 24,
    page: 1,
  });

  const imageItems = useMemo(
    () => items.filter((item) => item.attachmentType === "IMAGE"),
    [items],
  );

  const lightboxSlides = useMemo(
    () => imageItems.map((item) => ({ src: item.fileUrl })),
    [imageItems],
  );

  const fetchMedia = async () => {
    if (!groupId) return;

    try {
      setLoading(true);
      const res = await groupApi.getGroupMedia(groupId, currentPage, searchTerm);
      setItems(res.data.items);
      setPagination(res.data.pagination);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [groupId, currentPage, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openLightbox = (item: GroupAttachmentItem) => {
    const index = imageItems.findIndex((img) => img.id === item.id);
    if (index >= 0) setLightboxIndex(index);
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          File phương tiện
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Ảnh và video từ các bài viết trong nhóm
        </p>
      </div>

      <AttachmentSearchBar
        placeholder="Tìm theo tên file..."
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {loading ? (
        <div className="py-16 text-center text-slate-500">Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center">
          <ImageIcon size={40} className="mx-auto text-slate-300 mb-3" />
          <p className="text-slate-500">Chưa có file phương tiện nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 aspect-square"
            >
              {item.attachmentType === "IMAGE" ? (
                <button
                  type="button"
                  onClick={() => openLightbox(item)}
                  className="w-full h-full cursor-pointer"
                >
                  <img
                    src={item.fileUrl}
                    alt={item.fileName}
                    className="w-full h-full object-cover group-hover:brightness-90 transition-all"
                  />
                </button>
              ) : (
                <video
                  src={item.fileUrl}
                  controls
                  className="w-full h-full object-cover"
                />
              )}

              {item.attachmentType === "VIDEO" && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs flex items-center gap-1 pointer-events-none">
                  <Play size={12} />
                  Video
                </div>
              )}

              {item.post && (
                <div className="absolute inset-x-0 bottom-0 p-2 bg-linear-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link
                    to={`/groups/${groupId}/posts/${item.post.id}`}
                    className="flex items-center gap-2 text-white text-xs hover:underline"
                  >
                    {item.post.author.avatarUrl ? (
                      <img
                        src={item.post.author.avatarUrl}
                        alt=""
                        className="w-5 h-5 rounded-full object-cover"
                      />
                    ) : (
                      <User size={14} />
                    )}
                    <span className="truncate">{item.post.author.fullName}</span>
                  </Link>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <GroupPagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={setCurrentPage}
        />
      )}

      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={lightboxSlides}
      />
    </div>
  );
};

export default GroupMediaPage;
