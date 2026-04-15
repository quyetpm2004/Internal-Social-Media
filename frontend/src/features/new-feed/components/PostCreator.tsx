import { BarChart3, FileText, ImageIcon } from "lucide-react";

const PostCreator = () => (
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
          className="w-full bg-slate-50 dark:bg-slate-800 border-none rounded-lg focus:ring-2 focus:ring-blue-500 p-3 text-sm resize-none outline-none text-slate-900 dark:text-slate-100"
          placeholder="Chia sẻ cập nhật hoặc đột phá của bạn..."
          rows={2}
        />
        <div className="flex justify-between items-center mt-4">
          <div className="flex gap-2">
            {[ImageIcon, FileText, BarChart3].map((Icon, i) => (
              <button
                key={i}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <Icon size={20} />
              </button>
            ))}
          </div>
          <button className="bg-blue-700 px-6 py-2 rounded-lg text-white font-semibold text-sm hover:bg-blue-800 transition-colors">
            Đăng
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default PostCreator;
