import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  Lock,
  Mail,
  LayoutDashboard,
  HelpCircle,
  Globe,
} from "lucide-react";

import { useAuthStore } from "@/features/auth/store/auth.store";
import {
  loginSchema,
  type LoginFormValues,
} from "@/features/auth/schemas/login.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((state) => state.login);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const from =
    (location.state as { from?: { pathname?: string } })?.from?.pathname ||
    "/profile";

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setLoading(true);
      await login(values);
      toast.success("Đăng nhập thành công");
      navigate(from, { replace: true });
    } catch {
      toast.error("Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-6  bg-illustration">
      <main className="w-full max-w-md">
        <div className="bg-white rounded-2xl p-8 md:p-10 shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="mb-10 text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="w-10 h-10 bg-blue-700 rounded-lg flex items-center justify-center text-white shadow-lg">
                <LayoutDashboard size={24} />
              </div>
              <span className="font-headline font-extrabold text-2xl tracking-tighter text-blue-900">
                CollabNet
              </span>
            </div>
            <h1 className="text-3xl font-headline font-semibold text-gray-900 tracking-tight">
              Đăng nhập
            </h1>
            <p className="text-[#444653] text-sm mt-2 font-medium">
              Chào mừng trở lại với mạng lưới nội bộ
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="w-full space-y-6">
            <div className="space-y-2">
              <Label
                htmlFor="email"
                className="block text-sm font-semibold font-label text-gray-600 ml-1"
              >
                Email công ty
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-700 transition-colors">
                  <Mail size={20} />
                </div>
                <Input
                  id="email"
                  type="email"
                  placeholder="username@company.com"
                  className="block w-full pl-11 pr-4 py-6 bg-gray-50 border-none rounded-lg focus-visible:ring-2 focus-visible:ring-blue-700/20 transition-all shadow-none"
                  {...register("email")}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-red-500 ml-1">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-600 ml-1"
              >
                Mật khẩu
              </Label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-700 transition-colors">
                  <Lock size={20} />
                </div>
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-12 py-6 bg-gray-50 border-none rounded-lg focus-visible:ring-2 focus-visible:ring-blue-700/20 transition-all shadow-none"
                  {...register("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-blue-700 transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-sm text-red-500 ml-1">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 hover:bg-blue-800 text-lg cursor-pointer text-white font-semibold py-7 rounded-xl shadow-lg shadow-blue-700/10 active:scale-[0.98] transition-all"
            >
              {loading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </form>

          <div className="mt-10 w-full pt-8 border-t border-gray-50 flex flex-col items-center">
            <p className="text-[#444653] text-xs font-label text-center leading-relaxed">
              Hệ thống truy cập nội bộ dành riêng cho nhân viên.
              <br />
              Yêu cầu tuân thủ Chính sách bảo mật thông tin.
            </p>
            <div className="mt-6 flex gap-4">
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                <HelpCircle size={18} />
              </button>
              <button className="p-2 rounded-full hover:bg-gray-100 transition-colors text-gray-400">
                <Globe size={18} />
              </button>
            </div>
          </div>
        </div>

        <footer className="mt-8 text-center">
          <p className="text-gray-400/60 text-[11px] font-medium tracking-wide uppercase">
            Architectural Workspace • internal network v1.0.0s
          </p>
        </footer>
      </main>
    </div>
  );
}
