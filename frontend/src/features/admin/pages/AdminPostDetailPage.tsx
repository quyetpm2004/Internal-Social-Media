import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import ConfirmModal from "@/components/common/ConfirmModal";
import { adminApi } from "@/features/admin/api/admin.api";
import type { AdminPostDetail } from "@/features/admin/types/admin.type";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Download, FileText } from "lucide-react";
import Lightbox from "yet-another-react-lightbox";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Đã xảy ra lỗi";
}

export default function AdminPostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState<AdminPostDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [index, setIndex] = useState(-1);

  const imageAttachments = post?.attachments.filter(
    (item) => item.attachmentType === "IMAGE",
  );

  const videoAttachments = post?.attachments.filter(
    (item) => item.attachmentType === "VIDEO",
  );

  const fileAttachments = post?.attachments.filter(
    (item) => item.attachmentType === "FILE",
  );

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const res = await adminApi.getPostDetail(Number(postId));
        setPost(res.data);
      } catch (error) {
        toast.error(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [postId]);

  const handleConfirmDelete = async () => {
    setDeleting(true);
    try {
      await adminApi.deletePost(Number(postId));
      toast.success("Đã xóa bài viết");
      navigate("/admin/posts");
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Spinner />
      </div>
    );
  }

  if (!post) {
    return <p className="text-muted-foreground">Không tìm thấy bài viết.</p>;
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/posts">← Quay lại</Link>
          </Button>
          <h1 className="text-2xl font-semibold">
            Chi tiết bài viết #{post.id}
          </h1>
        </div>
        <Button
          variant="destructive"
          size="sm"
          disabled={deleting}
          onClick={() => setShowDeleteConfirm(true)}
        >
          Xóa bài viết
        </Button>
      </div>

      <div className="grid gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Thông tin</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="text-muted-foreground">Tác giả:</span>{" "}
              {post.user.fullName} ({post.user.email})
            </p>
            <p>
              <span className="text-muted-foreground">Nhóm:</span>{" "}
              {post.group?.groupName ?? "Không có"}
            </p>
            <p className="flex items-center gap-2">
              <span className="text-muted-foreground">Trạng thái:</span>
              <Badge variant={post.status === "ACTIVE" ? "active" : "inactive"}>
                {post.status === "ACTIVE" ? "Hoạt động" : "Đã khóa"}
              </Badge>
            </p>
            <p>
              <span className="text-muted-foreground">
                Bình luận / Reaction:
              </span>{" "}
              {post._count.comments} / {post._count.reactions}
            </p>
            <p>
              <span className="text-muted-foreground">Ngày tạo:</span>{" "}
              {new Date(post.createdAt).toLocaleString("vi-VN")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Nội dung</CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </CardContent>
        </Card>

        {post.attachments.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Đính kèm ({post.attachments.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {imageAttachments && imageAttachments.length > 0 && (
                <div
                  className={`grid gap-1 rounded-xl overflow-hidden mb-4 ${
                    imageAttachments.length === 1
                      ? "grid-cols-1 max-w-[50%]"
                      : "grid-cols-2"
                  }`}
                >
                  {imageAttachments.slice(0, 4).map((item, index) => (
                    <div
                      key={index}
                      className={`relative bg-slate-100 overflow-hidden ${
                        imageAttachments.length === 3 && index === 0
                          ? "row-span-2"
                          : ""
                      } ${
                        imageAttachments.length === 1
                          ? "aspect-auto"
                          : "aspect-square"
                      }`}
                      onClick={() => setIndex(index)}
                    >
                      <img
                        src={item.fileUrl}
                        className="w-full h-full object-cover hover:brightness-90 transition-all cursor-pointer"
                        alt={`Post content ${index + 1}`}
                      />

                      {imageAttachments.length > 4 && index === 3 && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center pointer-events-none">
                          <span className="text-white text-2xl font-bold">
                            +{imageAttachments.length - 4}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {videoAttachments && videoAttachments.length > 0 && (
                <div className="space-y-3 mb-4">
                  {videoAttachments.map((video, index) => (
                    <div
                      key={index}
                      className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700"
                    >
                      <video controls className="w-full max-h-[500px] bg-black">
                        <source src={video.fileUrl} />
                        Trình duyệt không hỗ trợ video.
                      </video>
                    </div>
                  ))}
                </div>
              )}

              {fileAttachments && fileAttachments.length > 0 && (
                <div className="space-y-2 mb-4">
                  {fileAttachments.map((file, index) => (
                    <a
                      key={index}
                      href={file.fileUrl}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <FileText
                          size={18}
                          className="text-slate-500 shrink-0"
                        />

                        <span className="text-sm truncate">
                          {file.fileName || "Tệp đính kèm"}
                        </span>
                      </div>

                      <Download size={18} className="text-slate-500 shrink-0" />
                    </a>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      <Lightbox
        index={index}
        open={index >= 0}
        close={() => setIndex(-1)}
        slides={imageAttachments
          ?.filter((item) => item.fileUrl)
          .map((item) => ({ src: item.fileUrl! }))}
      />

      <ConfirmModal
        open={showDeleteConfirm}
        title="Xóa bài viết?"
        description="Bạn có chắc muốn xóa bài viết này? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        loading={deleting}
        variant="danger"
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
