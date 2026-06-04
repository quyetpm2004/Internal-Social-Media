import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import {
  FileIcon,
  ImageIcon,
  Paperclip,
  PlayCircle,
  Video,
  X,
  Loader2,
} from "lucide-react";

import { PostsApi } from "@/features/new-feed/api/post.api";
import RichTextEditor from "@/features/new-feed/components/RichTextEditor";
import {
  isRichTextEmpty,
  sanitizePostHtml,
} from "@/features/new-feed/utils/rich-text";
import { uploadApi } from "@/features/uploads/api/upload.api";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { toast } from "sonner";
import { getDefaultAvatarUrl } from "@/lib/utils";

type PostCreatorProps = {
  fetchPosts: (currentPage: number) => Promise<void>;
  groupVisibility: "PUBLIC" | "GROUP";
  allowAnonymousPost?: boolean;
};

type UploadedAttachment = {
  attachmentId: number;
  key: string;
};

const PostCreator = ({
  fetchPosts,
  groupVisibility,
  allowAnonymousPost = false,
}: PostCreatorProps) => {
  const { groupId } = useParams();
  const user = useAuthStore((state) => state.user);

  const [content, setContent] = useState("");
  const [postAsAnonymous, setPostAsAnonymous] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<
    { url: string; type: string; name: string }[]
  >([]);
  const [loading, setLoading] = useState(false);

  // Xử lý tạo Preview và Cleanup
  useEffect(() => {
    if (attachments.length === 0) {
      setPreviews([]);
      return;
    }

    const previewData = attachments.map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type,
      name: file.name,
    }));

    setPreviews(previewData);

    return () => {
      previewData.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [attachments]);

  const handleSelectFiles = (
    e: React.ChangeEvent<HTMLInputElement>,
    filterType: "image" | "video" | "all",
  ) => {
    const files = Array.from(e.target.files ?? []);
    let filteredFiles = files;

    if (filterType === "image") {
      filteredFiles = files.filter((f) => f.type.startsWith("image/"));
    } else if (filterType === "video") {
      filteredFiles = files.filter((f) => f.type.startsWith("video/"));
    }

    setAttachments((prev) => [...prev, ...filteredFiles]);
    e.target.value = ""; // Reset input
  };

  const handleRemoveAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const getFilePurpose = (file: File) => {
    if (file.type.startsWith("image/")) return "post-image";
    if (file.type.startsWith("video/")) return "post-video";
    return "post-file";
  };

  const uploadAttachments = async (): Promise<UploadedAttachment[]> => {
    if (attachments.length === 0) return [];

    // 1. Lấy link Presign
    const presignRes = await uploadApi.presign(
      attachments.map((file) => ({
        purpose: getFilePurpose(file),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
      })),
    );

    const items = presignRes.data.items;

    // 2. Upload song song lên S3
    await Promise.all(
      items.map(async (item: any, index: number) => {
        const file = attachments[index];
        const uploadRes = await fetch(item.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (!uploadRes.ok) throw new Error("UPLOAD_FAILED");
      }),
    );

    // 3. Xác nhận upload thành công với Backend
    await uploadApi.confirm(
      items.map((item: any, index: number) => ({
        purpose: getFilePurpose(attachments[index]),
        key: item.key,
        attachmentId: item.attachmentId,
      })),
    );

    return items.map((item: any) => ({
      key: item.key,
      attachmentId: item.attachmentId,
    }));
  };

  const handleCreatePost = async () => {
    if (isRichTextEmpty(content) && attachments.length === 0) return;

    const sanitizedContent = sanitizePostHtml(content);

    try {
      setLoading(true);
      const uploadedAttachments = await uploadAttachments();

      const res = await PostsApi.createPost({
        content: sanitizedContent,
        contentFormat: "HTML",
        visibility: groupVisibility,
        groupId: groupId ? Number(groupId) : undefined,
        attachmentIds: uploadedAttachments.map((item) => item.attachmentId),
        isAnonymous:
          groupVisibility === "GROUP" && allowAnonymousPost && postAsAnonymous,
      });

      toast.success(
        res.data.status === "PENDING_REVIEW"
          ? "Đã gửi bài viết để duyệt. Vui lòng chờ phê duyệt."
          : "Đăng bài viết thành công.",
      );

      // Reset Form
      setContent("");
      setAttachments([]);
      setPostAsAnonymous(false);
      await fetchPosts(1);
    } catch (error: any) {
      console.error("Lỗi khi tạo bài viết:", error);
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Có lỗi xảy ra. Vui lòng thử lại.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm border border-slate-100 dark:border-slate-800">
      <div className="flex gap-4 items-start">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 border border-slate-100 dark:border-slate-700">
          <img
            src={user?.avatarUrl || getDefaultAvatarUrl(user?.fullName)}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>

        <div className="flex-1">
          <RichTextEditor
            value={content}
            onChange={setContent}
            placeholder="Bạn đang nghĩ gì thế?"
            minRows={3}
          />

          {/* Hidden Inputs */}
          <input
            id="post-images"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "image")}
          />
          <input
            id="post-videos"
            type="file"
            accept="video/*"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "video")}
          />
          <input
            id="post-files"
            type="file"
            accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt"
            multiple
            hidden
            onChange={(e) => handleSelectFiles(e, "all")}
          />

          {/* Preview Grid */}
          {previews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
              {previews.map((item, index) => (
                <div
                  key={index}
                  className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm aspect-video"
                >
                  {item.type.startsWith("image/") ? (
                    <img
                      src={item.url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : item.type.startsWith("video/") ? (
                    <div className="relative w-full h-full bg-slate-900 flex items-center justify-center">
                      <video
                        src={item.url}
                        className="w-full h-full object-contain opacity-70"
                      />
                      <PlayCircle
                        className="absolute text-white/80 group-hover:text-white transition-colors"
                        size={32}
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center">
                      <FileIcon size={28} className="text-blue-500 mb-2" />
                      <span className="text-[10px] font-medium line-clamp-1 dark:text-slate-300">
                        {item.name}
                      </span>
                    </div>
                  )}

                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveAttachment(index)}
                    className="absolute top-1.5 right-1.5 bg-black/40 hover:bg-red-500 text-white rounded-full p-1 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {allowAnonymousPost && groupVisibility === "GROUP" && (
            <label className="mt-4 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={postAsAnonymous}
                onChange={(e) => setPostAsAnonymous(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                Đăng ẩn danh — thành viên khác (trừ quản trị/kiểm duyệt) không
                thấy tên thật của bạn.
              </span>
            </label>
          )}

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex gap-1.5">
              <label
                htmlFor="post-images"
                className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors"
                title="Ảnh"
              >
                <ImageIcon size={20} />
              </label>
              <label
                htmlFor="post-videos"
                className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg cursor-pointer transition-colors"
                title="Video"
              >
                <Video size={20} />
              </label>
              <label
                htmlFor="post-files"
                className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg cursor-pointer transition-colors"
                title="Tệp đính kèm"
              >
                <Paperclip size={20} />
              </label>
            </div>

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={
                loading ||
                (isRichTextEmpty(content) && attachments.length === 0)
              }
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white px-5 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {loading ? "Đang xử lý..." : "Đăng bài viết"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
