import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
      <h1 className="text-3xl font-bold">404</h1>
      <p className="text-muted-foreground">Trang không tồn tại</p>
      <button
        className="bg-blue-400 text-black rounded-2xl px-4 py-3 cursor-pointer"
        onClick={() => navigate("/")}
      >
        Về trang chủ
      </button>
    </div>
  );
}
