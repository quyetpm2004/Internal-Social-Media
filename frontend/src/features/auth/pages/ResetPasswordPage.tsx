import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom"; // Dùng Link nếu bạn xài react-router-dom
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
import { Loader2, CheckCircle2, XCircle, Lock, ArrowLeft } from "lucide-react";

export default function ResetPasswordPage() {
  const { token } = useParams();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [validToken, setValidToken] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const verifyToken = async () => {
      try {
        await authApi.verifyResetToken(token ?? "");
        setValidToken(true);
      } catch {
        setValidToken(false);
      } finally {
        setLoading(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không trùng khớp.");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải chứa ít nhất 6 ký tự.");
      return;
    }

    try {
      setSubmitting(true);
      await authApi.resetPassword({
        token: token ?? "",
        newPassword: password,
        confirmNewPassword: confirmPassword,
      });
      setSuccess(true);
    } catch (err: any) {
      console.error(err);
      setError(
        err?.response?.data?.message || "Đã có lỗi xảy ra. Vui lòng thử lại.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 1. TRẠNG THÁI LOADING BAN ĐẦU (KHI CHECK TOKEN)
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <div className="flex flex-col items-center space-y-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Đang xác thực liên kết...</p>
        </div>
      </div>
    );
  }

  // 2. TRẠNG THÁI TOKEN KHÔNG HỢP LỆ HOẶC HẾT HẠN
  if (!validToken) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200/80 text-center dark:border-slate-800">
          <CardContent className="pt-8 pb-8 flex flex-col items-center">
            <XCircle className="h-12 w-12 text-destructive mb-4" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Liên kết không hợp lệ
            </h2>
            <p className="mt-2 text-sm text-muted-foreground max-w-xs">
              Đường dẫn đặt lại mật khẩu đã hết hạn, sai mã hoặc đã được sử dụng
              trước đó.
            </p>
            <Button asChild className="mt-6 w-full" variant="outline">
              <Link to="/forgot-password">Yêu cầu liên kết mới</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 3. TRẠNG THÁI ĐỔI MẬT KHẨU THÀNH CÔNG
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
        <Card className="w-full max-w-md shadow-lg border-slate-200/80 text-center dark:border-slate-800">
          <CardContent className="pt-8 pb-8 flex flex-col items-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Đặt lại thành công!
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Mật khẩu mới của bạn đã được cập nhật thành công.
            </p>
            <Button asChild className="mt-6 w-full">
              <Link to="/login">Đăng nhập ngay</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 4. GIAO DIỆN ĐỔI MẬT KHẨU CHÍNH
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50/50 dark:bg-slate-950 p-4">
      <Card className="w-full max-w-md shadow-lg border-slate-200/80 dark:border-slate-800">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mb-2">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">
            Đặt lại mật khẩu
          </CardTitle>
          <CardDescription>
            Vui lòng nhập mật khẩu mới bảo mật cao để bảo vệ tài khoản của bạn
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Mật khẩu mới</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                disabled={submitting}
              />
            </div>

            {/* Khối hiển thị lỗi nội bộ (Validation / API Error) */}
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-lg border border-destructive/20">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full font-medium bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                "Đổi mật khẩu"
              )}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-primary transition-colors gap-1.5"
            >
              <ArrowLeft className="h-4 w-4" />
              Hủy và quay lại
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
