import { useState } from "react";
import { authApi } from "@/features/auth/api/auth.api";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState(""); // Thêm state quản lý lỗi

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!email) {
      setError("Vui lòng nhập địa chỉ email.");
      return;
    }

    try {
      setLoading(true);
      await authApi.forgotPassword(email);
      setSuccess("Liên kết đặt lại mật khẩu đã được gửi vào email của bạn.");
      setEmail(""); // Clear email sau khi gửi thành công
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message ||
          "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/50 p-4 dark:bg-slate-950">
      <Card className="w-full max-w-md shadow-lg border-slate-200/80 dark:border-slate-800">
        <CardHeader className="space-y-1.5 text-center">
          <CardTitle className="text-2xl font-bold tracking-tight">
            Quên mật khẩu?
          </CardTitle>
          <CardDescription>
            Nhập email của bạn để nhận liên kết lấy lại mật khẩu tài khoản.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full"
                disabled={loading}
              />
            </div>

            {/* Thông báo lỗi nếu có */}
            {error && (
              <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md font-medium">
                {error}
              </div>
            )}

            {/* Thông báo thành công nếu có */}
            {success && (
              <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md font-medium dark:bg-green-950/30 dark:text-green-400">
                {success}
              </div>
            )}

            <button
              className="w-full font-medium bg-primary text-white hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-md px-4 py-2 text-sm transition-colors"
              type="submit"
              disabled={loading}
            >
              {loading ? "Đang gửi yêu cầu..." : "Gửi liên kết xác nhận"}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <a
              href="/login"
              className="text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
            >
              Quay lại trang đăng nhập
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
