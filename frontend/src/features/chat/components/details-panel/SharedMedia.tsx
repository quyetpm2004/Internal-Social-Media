import type { SharedAttachmentItem } from "@/features/chat/types/chat.type";

interface SharedMediaProps {
  media: SharedAttachmentItem[];
  totalCount: number;
  loading?: boolean;
}

const SharedMedia = ({ media, totalCount, loading }: SharedMediaProps) => {
  const visibleItems = media.slice(0, 6);
  const remaining =
    totalCount > visibleItems.length ? totalCount - visibleItems.length : 0;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-on-surface">
          File phương tiện
        </h4>
      </div>

      {loading ? (
        <p className="text-xs text-on-surface-variant py-4">Đang tải...</p>
      ) : visibleItems.length === 0 ? (
        <p className="text-xs text-on-surface-variant py-4">
          Chưa có ảnh hoặc video nào được chia sẻ.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {visibleItems.map((item, index) => {
            const isLastWithOverlay =
              index === visibleItems.length - 1 && remaining > 0;

            return (
              <a
                key={item.id}
                href={item.fileUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="aspect-square rounded-lg overflow-hidden bg-surface-container-high hover:brightness-90 transition-all cursor-pointer relative"
              >
                {item.attachmentType === "IMAGE" && item.fileUrl ? (
                  <img
                    className="w-full h-full object-cover"
                    src={item.fileUrl}
                    alt={item.fileName}
                  />
                ) : item.attachmentType === "VIDEO" && item.fileUrl ? (
                  <video
                    className="w-full h-full object-cover"
                    src={item.fileUrl}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-on-surface-variant text-[10px]">
                    {item.fileName}
                  </div>
                )}

                {isLastWithOverlay && (
                  <div className="absolute inset-0 bg-on-surface/40 flex items-center justify-center">
                    <span className="text-on-primary font-bold text-xs">
                      +{remaining}
                    </span>
                  </div>
                )}
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SharedMedia;
