import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, HelpCircle, Lock, Mail } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { login } = useAuthStore();
  const { t } = useTranslation();

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
      toast.success(t("auth.loginSuccess"));
      navigate(from === "/login" ? "/news-feed" : from);
    } catch {
      toast.error(t("auth.loginFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full">
      <section className="relative hidden overflow-hidden lg:flex lg:w-[58%]">
        <img
          src="/login/login.png"
          alt="Kiến trúc hiện đại"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-slate-950/85 via-slate-900/35 to-slate-900/10" />

        <div className="relative z-10 mt-auto flex w-full flex-col gap-5 p-12 xl:p-16">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center overflow-hidden rounded-xl bg-white/15 backdrop-blur-sm">
              <img
                src="/logo/logo.png"
                alt="Logo"
                className="size-6 object-contain"
              />
            </div>
            <span className="text-sm font-semibold tracking-wide text-white/90">
              Collab Network
            </span>
          </div>

          <div className="max-w-xl space-y-4">
            <h2 className="font-headline text-4xl font-bold leading-tight text-white xl:text-5xl">
              {t("auth.leftTitle")}
            </h2>
            <p className="max-w-lg text-base leading-relaxed text-white/75">
              {t("auth.leftDescription")}
            </p>
          </div>
        </div>
      </section>

      <section className="flex min-h-screen flex-1 flex-col bg-white">
        <div className="flex flex-1 items-center justify-center px-6 py-10 sm:px-10">
          <main className="w-full max-w-[420px]">
            <div className="mb-10 lg:mb-12">
              <div className="mb-8 flex items-center gap-3 lg:hidden">
                <img
                  src="/logo/logo.png"
                  alt="Logo"
                  className="h-8 w-auto object-contain"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Architectural Workspace
                </span>
              </div>

              <h1 className="font-headline text-4xl font-bold tracking-tight text-slate-900">
                {t("auth.loginTitle")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {t("auth.welcomeBack")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("auth.companyEmail")}
                </Label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-700">
                    <Mail size={18} />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="username@company.com"
                    className="h-12 rounded-xl border-none bg-slate-100 pl-11 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                    {...register("email")}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-semibold text-slate-700"
                >
                  {t("auth.password")}
                </Label>
                <div className="relative group">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-700">
                    <Lock size={18} />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 rounded-xl border-none bg-slate-100 pl-11 pr-12 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                    {...register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-blue-700"
                    aria-label={
                      showPassword
                        ? t("auth.hidePassword")
                        : t("auth.showPassword")
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  type="button"
                  className="text-sm font-medium text-blue-700 transition-colors hover:text-blue-800"
                  onClick={() => navigate("/forgot-password")}
                >
                  {t("auth.forgotPassword")}
                </button>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-xl bg-blue-800 text-base font-semibold text-white shadow-none hover:bg-blue-900"
              >
                {loading ? t("auth.loginSubmitting") : t("auth.loginButton")}
              </Button>
            </form>

            <div className="mt-10 space-y-6">
              <p className="text-center text-xs leading-relaxed text-slate-500">
                {t("auth.systemNoticeLine1")}
                <br />
                {t("auth.systemNoticeLine2")}
              </p>

              <div className="flex items-center justify-center gap-8">
                <button
                  type="button"
                  className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.14em] text-slate-500 transition-colors hover:text-blue-700"
                >
                  <HelpCircle size={14} />
                  {t("auth.help")}
                </button>
              </div>
            </div>
          </main>
        </div>

        <footer className="px-6 pb-6 text-center">
          <p className="text-[11px] font-medium tracking-[0.12em] text-slate-400 uppercase">
            © 2026 Collab Network • Internal v1.0.0
          </p>
        </footer>
      </section>
    </div>
  );
}
