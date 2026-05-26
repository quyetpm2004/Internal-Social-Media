import { Download, FileText, Table2 } from "lucide-react";
import type { SharedAttachmentItem } from "@/features/chat/types/chat.type";
import {
  formatFileSize,
  getShortDateLabel,
} from "@/features/chat/utils/format-file-size";

interface SharedFilesProps {
  files: SharedAttachmentItem[];
  loading?: boolean;
}

const getFileMeta = (mimeType: string) => {
  if (mimeType.includes("pdf")) {
    return {
      icon: <FileText size={20} />,
      wrapperClass: "bg-error-container text-error",
    };
  }

  if (mimeType.includes("sheet") || mimeType.includes("excel")) {
    return {
      icon: <Table2 size={20} />,
      wrapperClass: "bg-secondary-container text-secondary",
    };
  }

  return {
    icon: <FileText size={20} />,
    wrapperClass: "bg-surface-container-high text-on-surface-variant",
  };
};

const SharedFiles = ({ files, loading }: SharedFilesProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="text-xs font-bold font-label uppercase tracking-widest text-on-surface-variant">
          Files
        </h4>
      </div>

      {loading ? (
        <p className="text-xs text-on-surface-variant py-4">Đang tải...</p>
      ) : files.length === 0 ? (
        <p className="text-xs text-on-surface-variant py-4">
          Chưa có file nào được chia sẻ.
        </p>
      ) : (
        <div className="space-y-2">
          {files.slice(0, 5).map((file) => {
            const { icon, wrapperClass } = getFileMeta(file.mimeType);

            return (
              <a
                key={file.id}
                href={file.fileUrl ?? undefined}
                target="_blank"
                rel="noreferrer"
                className="w-full flex items-center gap-3 p-3 bg-surface-container-lowest rounded-lg hover:bg-white transition-all cursor-pointer group"
              >
                <div
                  className={`w-10 h-10 rounded flex items-center justify-center ${wrapperClass}`}
                >
                  {icon}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-on-surface truncate">
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-on-surface-variant">
                    {formatFileSize(file.fileSize)}
                  </p>
                </div>

                <Download
                  size={18}
                  className="text-on-surface-variant opacity-0 group-hover:opacity-100 transition-opacity"
                />
              </a>
            );
          })}
        </div>
      )}
    </div>
  );
};

// keep helper exported in case other components want consistent meta
export { getShortDateLabel };

export default SharedFiles;
