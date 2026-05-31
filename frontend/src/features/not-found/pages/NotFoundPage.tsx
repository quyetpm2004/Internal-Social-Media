import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      {/* Phần trang trí nền (Glow Effect) */}
      <div className="relative flex items-center justify-center">
        <div className="absolute h-64 w-64 animate-pulse rounded-full bg-blue-400/20 blur-3xl" />
        <h1 className="relative text-9xl font-black tracking-tighter text-blue-500/20 select-none">
          404
        </h1>
        <div className="absolute inset-0 flex items-center justify-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Oops!
          </h2>
        </div>
      </div>

      <div className="mt-6 max-w-md space-y-2">
        <p className="text-xl font-medium text-muted-foreground">
          Hình như bạn đang bị lạc đường?
        </p>
        <p className="text-sm text-muted-foreground/80">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được chuyển sang một địa
          chỉ khác.
        </p>
      </div>

      <div className="mt-10 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => navigate("/news-feed")}
          className="group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-3 font-semibold text-white transition-all hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-500/30 active:scale-95"
        >
          Về trang chủ
        </button>

        <button
          onClick={() => navigate(-1)}
          className="rounded-full border border-input bg-background px-8 py-3 font-semibold text-foreground transition-all hover:bg-accent active:scale-95"
        >
          Quay lại
        </button>
      </div>
    </div>
  );
}
