import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Eye, EyeOff, Lock, Mail, Phone, User } from "lucide-react";
import { useTranslation } from "react-i18next";

import { authApi } from "@/features/auth/api/auth.api";
import {
  registerSchema,
  type RegisterFormValues,
} from "@/features/auth/schemas/register.schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object") {
    const axiosError = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      axiosError.response?.data?.message ||
      axiosError.message ||
      "Unexpected error"
    );
  }
  return "Unexpected error";
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      gender: "Nam",
      birthdate: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setLoading(true);
      await authApi.register(values);
      setSubmitted(true);
      toast.success(t("auth.registerSuccess"));
    } catch (error) {
      toast.error(getErrorMessage(error) || t("auth.registerFailed"));
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
                {t("auth.registerTitle")}
              </h1>
              <p className="mt-3 text-sm leading-relaxed text-slate-500">
                {t("auth.registerDescription")}
              </p>
            </div>

            {submitted ? (
              <div className="space-y-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-6">
                <p className="text-sm leading-relaxed text-slate-700">
                  {t("auth.registerPendingMessage")}
                </p>
                <Button
                  type="button"
                  className="h-12 w-full rounded-xl bg-blue-800 text-base font-semibold text-white shadow-none hover:bg-blue-900"
                  onClick={() => navigate("/login")}
                >
                  {t("auth.backToLogin")}
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label
                    htmlFor="fullName"
                    className="text-sm font-semibold text-slate-700"
                  >
                    {t("auth.fullName")}
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-700">
                      <User size={18} />
                    </div>
                    <Input
                      id="fullName"
                      type="text"
                      placeholder={t("auth.fullNamePlaceholder")}
                      className="h-12 rounded-xl border-none bg-slate-100 pl-11 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                      {...register("fullName")}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-sm text-red-500">
                      {errors.fullName.message}
                    </p>
                  )}
                </div>

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
                    htmlFor="phone"
                    className="text-sm font-semibold text-slate-700"
                  >
                    {t("profile.phone")}
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-700">
                      <Phone size={18} />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder={t("profile.inputPhone")}
                      className="h-12 rounded-xl border-none bg-slate-100 pl-11 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-sm text-red-500">{errors.phone.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label
                      htmlFor="gender"
                      className="text-sm font-semibold text-slate-700"
                    >
                      {t("profile.gender")}
                    </Label>
                    <select
                      id="gender"
                      className="h-12 w-full rounded-xl border-none bg-slate-100 px-4 text-sm text-slate-900 outline-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                      {...register("gender")}
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                    {errors.gender && (
                      <p className="text-sm text-red-500">
                        {errors.gender.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="birthdate"
                      className="text-sm font-semibold text-slate-700"
                    >
                      {t("profile.birthdate")}
                    </Label>
                    <Input
                      id="birthdate"
                      type="date"
                      className="h-12 rounded-xl border-none bg-slate-100 px-4 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                      {...register("birthdate")}
                    />
                    {errors.birthdate && (
                      <p className="text-sm text-red-500">
                        {errors.birthdate.message}
                      </p>
                    )}
                  </div>
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

                <div className="space-y-2">
                  <Label
                    htmlFor="confirmPassword"
                    className="text-sm font-semibold text-slate-700"
                  >
                    {t("auth.confirmPassword")}
                  </Label>
                  <div className="relative group">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 transition-colors group-focus-within:text-blue-700">
                      <Lock size={18} />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="h-12 rounded-xl border-none bg-slate-100 pl-11 pr-12 shadow-none focus-visible:ring-2 focus-visible:ring-blue-700/20"
                      {...register("confirmPassword")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((prev) => !prev)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 transition-colors hover:text-blue-700"
                      aria-label={
                        showConfirmPassword
                          ? t("auth.hidePassword")
                          : t("auth.showPassword")
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-red-500">
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-blue-800 text-base font-semibold text-white shadow-none hover:bg-blue-900"
                >
                  {loading
                    ? t("auth.registerSubmitting")
                    : t("auth.registerButton")}
                </Button>
              </form>
            )}

            <p className="mt-8 text-center text-sm text-slate-500">
              {t("auth.haveAccount")}{" "}
              <button
                type="button"
                className="font-semibold text-blue-700 transition-colors hover:text-blue-800"
                onClick={() => navigate("/login")}
              >
                {t("auth.loginButton")}
              </button>
            </p>
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
