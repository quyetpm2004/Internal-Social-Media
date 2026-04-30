import { useEffect, useState } from "react";
import { BarChart3, FileText, ImageIcon, X } from "lucide-react";
import { PostsApi } from "../api/new-feed.api";

type PostCreatorProps = {
  onPostCreated?: (post: any) => void;
};

const PostCreator = ({ onPostCreated }: PostCreatorProps) => {
  const [content, setContent] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const urls = attachments.map((file) => URL.createObjectURL(file));
    setPreviews(urls);

    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [attachments]);

  const handleSelectImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));

    setAttachments((prev) => [...prev, ...imageFiles]);

    console.log("Selected files:", imageFiles);

    e.target.value = "";
  };

  const handleRemoveImage = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreatePost = async () => {
    if (!content.trim() && attachments.length === 0) return;

    try {
      setLoading(true);

      const res = await PostsApi.createPost(
        content,
        "PUBLIC",
        null,
        attachments,
      );

      onPostCreated?.(res.data);

      setContent("");
      setAttachments([]);
    } catch (error) {
      console.error("Tạo bài viết thất bại:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-5 shadow-sm">
      <div className="flex gap-4 items-start">
        <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0">
          <img
            src="https://khoanhdep.com/wp-content/uploads/2025/09/anh-anime-nam-2.jpg"
            alt="Avatar"
          />
        </div>

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 p-3 text-sm resize-none outline-none text-slate-900 dark:text-slate-100"
            placeholder="Chia sẻ cập nhật hoặc đột phá của bạn..."
            rows={2}
          />

          <input
            id="post-images"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleSelectImages}
          />

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 mt-3">
              {previews.map((src, index) => (
                <div
                  key={src}
                  className="relative rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700"
                >
                  <img
                    src={src}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-40 object-cover"
                  />

                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <div className="flex gap-2">
              <label
                htmlFor="post-images"
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <ImageIcon size={20} />
              </label>

              {[FileText, BarChart3].map((Icon, i) => (
                <button
                  key={i}
                  type="button"
                  className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                >
                  <Icon size={20} />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={handleCreatePost}
              disabled={
                loading || (!content.trim() && attachments.length === 0)
              }
              className="bg-blue-700 px-6 py-2 rounded-lg text-white font-semibold text-sm hover:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Đang đăng..." : "Đăng"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostCreator;
