import { MessageSquare, Pin, Share2, ThumbsUp } from "lucide-react";
import type { PostCardProps } from "../types/new-feed.type";

const PostCard: React.FC<PostCardProps> = ({
  author,
  role,
  time,
  content,
  image,
  isPinned = false,
  stats,
}) => (
  <div
    className={`bg-white dark:bg-slate-900 rounded-xl shadow-sm overflow-hidden relative ${isPinned ? "ring-1 ring-blue-500/20" : ""}`}
  >
    {isPinned && (
      <div className="absolute top-4 right-4 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-full">
        <Pin size={12} className="text-blue-700 fill-current" />
        <span className="text-[10px] font-bold text-blue-700 uppercase tracking-tighter">
          Bài ghim
        </span>
      </div>
    )}
    <div className="p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100">
          <img src={author.avatar} alt={author.name} />
        </div>
        <div>
          <h3 className="text-sm font-bold">{author.name}</h3>
          <p className="text-[11px] text-slate-500">
            {role} • {time}
          </p>
        </div>
      </div>
      <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-sm mb-4">
        {content}
      </p>
      {image && (
        <div className="rounded-lg overflow-hidden mb-4 bg-slate-100 aspect-video">
          <img
            src={`${import.meta.env.VITE_BASE_URL_BACKEND}/uploads/post/${image}`}
            className="w-full h-full object-cover"
            alt="Post content"
          />
        </div>
      )}
      <div className="flex items-center gap-6 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors">
          <ThumbsUp size={18} />
          <span className="text-xs font-semibold">{stats.likes}</span>
        </button>
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors">
          <MessageSquare size={18} />
          <span className="text-xs font-semibold">{stats.comments}</span>
        </button>
        <button className="flex items-center gap-2 text-slate-500 hover:text-blue-700 transition-colors ml-auto">
          <Share2 size={18} />
          <span className="text-xs font-semibold">Chia sẻ</span>
        </button>
      </div>
    </div>
  </div>
);

export default PostCard;
