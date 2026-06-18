import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api/profile.api";
import ProfileHeader from "@/features/profile/components/ProfileHeader";
import InfoField from "@/features/profile/components/InfoField";
import { BookUser, Shell, UserPen } from "lucide-react";
import type {
  Department,
  Position,
  UserProfile,
} from "@/features/profile/types/profile.type";
import { uploadApi } from "@/features/uploads/api/upload.api";
import { useParams } from "react-router-dom";
import NotFoundPage from "@/features/not-found/pages/NotFoundPage";
import { useAuthStore } from "@/features/auth/store/auth.store";
import { authApi } from "@/features/auth/api/auth.api";
import { useTranslation } from "react-i18next";

export default function ProfilePage() {
  const { userId } = useParams();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const { t } = useTranslation();

  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({
    id: "",
    fullName: "",
    email: "",
    departmentId: "",
    positionId: "",
    role: "EMPLOYEE",
    phone: "",
    address: "",
    bio: "",
    avatarUrl: "",
    birthdate: "",
    gender: "Nam",
  });

  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [openChangePasswordModal, setOpenChangePasswordModal] = useState(false);
  const [changePasswordForm, setChangePasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (typeof error === "object" && error !== null) {
      const maybeResponse = error as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      return (
        maybeResponse.response?.data?.message ||
        maybeResponse.message ||
        fallback
      );
    }
    return fallback;
  };

  const fetchProfile = useCallback(async () => {
    if (!userId) {
      return;
    }

    try {
      const res = await profileApi.getProfile(userId);
      setProfile(res.data);
    } catch {
      toast.error(t("profile.loadFailed"));
    } finally {
      setLoadingProfile(false);
    }
  }, [t, userId]);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await profileApi.getDepartments();
        setDepartments(res.data);
      } catch {
        toast.error(t("profile.departmentLoadFailed"));
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchPositions = async () => {
      try {
        const res = await profileApi.getPositions();
        setPositions(res.data);
      } catch {
        toast.error(t("profile.positionLoadFailed"));
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    fetchDepartments();
    fetchPositions();
  }, [fetchProfile, t]);

  const onSubmit = async () => {
    try {
      setUpdating(true);

      const profilePayload = {
        fullName: profile.fullName,
        email: profile.email,
        departmentId: profile.departmentId,
        positionId: profile.positionId,
        phone: profile.phone,
        address: profile.address,
        bio: profile.bio,
        birthdate: profile.birthdate,
        gender: profile.gender,
      };

      const res = await profileApi.updateProfile(profilePayload);

      setProfile((prev) => ({
        ...prev,
        ...res.data,
        avatarUrl: prev.avatarUrl,
      }));

      setIsEditing(false);
      toast.success(t("profile.updateSuccess"));
    } catch {
      toast.error(t("profile.updateFailed"));
    } finally {
      setUpdating(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setProfile((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = async (file: File) => {
    try {
      setAvatarUploading(true);

      const presignRes = await uploadApi.presign([
        {
          purpose: "avatar",
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
        },
      ]);

      const { uploadUrl, key } = presignRes.data.items[0];

      await fetch(uploadUrl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });

      await uploadApi.confirm([
        {
          purpose: "avatar",
          key,
        },
      ]);

      fetchProfile();

      toast.success(t("profile.avatarUpdateSuccess"));
    } catch (error: unknown) {
      console.error("Error uploading avatar:", error);
      toast.error(getErrorMessage(error, t("profile.genericError")));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      setAvatarUploading(true);

      await profileApi.deleteAvatar();

      setProfile((prev) => ({
        ...prev,
        avatarUrl: "",
      }));

      toast.success(t("profile.avatarDeleteSuccess"));
    } catch (error: unknown) {
      toast.error(t("profile.avatarDeleteFailed"));
      toast.error(getErrorMessage(error, t("profile.genericError")));
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePasswordInput = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setChangePasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const submitChangePassword = async () => {
    try {
      setSecurityLoading(true);
      await authApi.changePassword(changePasswordForm);
      setChangePasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      setOpenChangePasswordModal(false);
      toast.success(t("profile.changePasswordSuccess"));
      await logout();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t("profile.changePasswordFailed")));
    } finally {
      setSecurityLoading(false);
    }
  };

  if (loadingProfile) {
    return <div>{t("profile.loading")}</div>;
  }

  if (!userId) {
    return <NotFoundPage />;
  }

  // Update avatar state

  return (
    <div className="py-4 max-w-6xl mx-auto">
      <ProfileHeader
        isOwner={userId === String(user?.id)}
        name={profile?.fullName}
        avatarUrl={profile?.avatarUrl}
        role={
          profile?.positionId
            ? positions.find((p) => p.id === profile.positionId)?.name
            : t("profile.defaultRole")
        }
        department={
          profile?.departmentId
            ? departments.find((d) => d.id === profile.departmentId)?.name
            : t("profile.noDepartment")
        }
        isEditing={isEditing}
        updating={updating}
        avatarUploading={avatarUploading}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSubmit={onSubmit}
        onAvatarChange={handleAvatarChange}
        onAvatarDelete={handleDeleteAvatar}
        onOpenChangePasswordModal={() => setOpenChangePasswordModal(true)}
      />

      <form>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Section: Basic Info */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <UserPen size={20} />
                  {t("profile.basicInfo")}
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <InfoField
                      label={t("profile.fullName")}
                      value={profile?.fullName}
                      placeholder={t("profile.inputFullName")}
                      onChange={handleInputChange}
                      name="fullName"
                    />
                    <InfoField
                      label={t("profile.gender")}
                      name="gender"
                      value={profile?.gender}
                      options={[
                        { id: "Nam", name: "Nam" },
                        { id: "Nữ", name: "Nữ" },
                        { id: "Khác", name: "Khác" },
                      ]}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label={t("profile.birthdate")}
                      name="birthdate"
                      value={profile?.birthdate}
                      date={true}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label={t("profile.department")}
                      name="departmentId"
                      value={profile?.departmentId}
                      options={departments.map((d) => ({
                        id: d.id,
                        name: d.name,
                      }))}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label={t("profile.position")}
                      name="positionId"
                      value={profile?.positionId}
                      options={positions.map((p) => ({
                        id: p.id,
                        name: p.name,
                      }))}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label={t("profile.role")}
                      name="role"
                      value={profile?.role}
                      disabled
                    />
                  </>
                ) : (
                  <>
                    <InfoField
                      label={t("profile.fullName")}
                      value={profile?.fullName}
                      readonly={true}
                    />
                    <InfoField
                      label={t("profile.gender")}
                      value={profile?.gender}
                      readonly={true}
                    />
                    <InfoField
                      label={t("profile.birthdate")}
                      value={profile?.birthdate}
                      date={true}
                      readonly={true}
                    />
                    <InfoField
                      label={t("profile.department")}
                      value={profile?.departmentId}
                      options={departments}
                      disabled={true}
                    />
                    <InfoField
                      label={t("profile.position")}
                      value={profile?.positionId}
                      options={positions}
                      disabled={true}
                    />
                    <InfoField
                      label={t("profile.role")}
                      value={profile?.role}
                      disabled={true}
                    />
                  </>
                )}
              </div>
            </section>

            {/* Section: Contact */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
                <BookUser size={20} />
                {t("profile.contactInfo")}
              </h2>
              <div className="space-y-6">
                <div>
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField
                          label={t("profile.email")}
                          name="email"
                          value={profile?.email}
                          placeholder={t("profile.inputEmail")}
                          onChange={handleInputChange}
                        />
                        <InfoField
                          label={t("profile.phone")}
                          name="phone"
                          value={profile?.phone}
                          placeholder={t("profile.inputPhone")}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 mt-6">
                        <InfoField
                          label={t("profile.address")}
                          name="address"
                          value={profile?.address}
                          placeholder={t("profile.inputAddress")}
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField
                          label={t("profile.email")}
                          value={profile?.email}
                          readonly={true}
                        />
                        <InfoField
                          label={t("profile.phone")}
                          value={profile?.phone}
                          readonly={true}
                        />
                      </div>
                      <div className="grid grid-cols-1 mt-6">
                        <InfoField
                          label={t("profile.address")}
                          value={profile?.address}
                          readonly={true}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Bio */}
          <div className="space-y-6">
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 h-full">
              <h2 className="text-xl font-bold flex items-center gap-3 mb-6">
                <Shell size={20} />
                {t("profile.bio")}
              </h2>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile?.bio || ""}
                  onChange={handleInputChange}
                  rows={10}
                  className=" w-full rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm outline-none resize-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                  "
                  placeholder={t("profile.bioPlaceholder")}
                />
              ) : (
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm whitespace-pre-line">
                  {profile?.bio}
                </p>
              )}
            </section>
          </div>
        </div>
      </form>

      {openChangePasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-3">
            <h3 className="text-lg font-bold">{t("profile.changePasswordTitle")}</h3>
            <input
              type="password"
              name="currentPassword"
              value={changePasswordForm.currentPassword}
              onChange={handleChangePasswordInput}
              placeholder={t("profile.currentPassword")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
            <input
              type="password"
              name="newPassword"
              value={changePasswordForm.newPassword}
              onChange={handleChangePasswordInput}
              placeholder={t("profile.newPassword")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
            <input
              type="password"
              name="confirmNewPassword"
              value={changePasswordForm.confirmNewPassword}
              onChange={handleChangePasswordInput}
              placeholder={t("profile.confirmNewPassword")}
              className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-900"
            />
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOpenChangePasswordModal(false)}
                className="flex-1 rounded-lg border border-slate-200 dark:border-slate-700 py-2 text-sm font-semibold"
              >
                {t("profile.cancel")}
              </button>
              <button
                type="button"
                disabled={securityLoading}
                onClick={submitChangePassword}
                className="flex-1 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 text-white py-2 text-sm font-semibold transition-colors"
              >
                {t("profile.confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
