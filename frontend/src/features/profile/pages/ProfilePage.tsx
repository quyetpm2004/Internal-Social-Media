import { useEffect, useState } from "react";
import { toast } from "sonner";
import { profileApi } from "@/features/profile/api/profile.api";
import { type ProfileFormValues } from "@/features/profile/schemas/profile.schema";
import ProfileHeader from "../components/ProfileHeader";
import InfoField from "../components/InfoField";
import { BookUser, Shell, UserPen } from "lucide-react";
import type { Department, Position, UserProfile } from "../types/profile.type";

export default function ProfilePage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [updating, setUpdating] = useState(false);
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

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        setProfile(res.data);
      } catch {
        toast.error("Không tải được hồ sơ");
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchDepartments = async () => {
      try {
        const res = await profileApi.getDepartments();
        setDepartments(res.data);
      } catch {
        toast.error("Không tải được phòng ban");
      } finally {
        setLoadingProfile(false);
      }
    };

    const fetchPositions = async () => {
      try {
        const res = await profileApi.getPositions();
        setPositions(res.data);
      } catch {
        toast.error("Không tải được chức vụ");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
    fetchDepartments();
    fetchPositions();
  }, []);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setUpdating(true);
      console.log("Submitting payload:", values);
      const res = await profileApi.updateProfile(values);
      setProfile(res.data);
      console.log("Updated profile:", res.data);
      setIsEditing(false);
      toast.success("Cập nhật hồ sơ thành công");
    } catch {
      toast.error("Cập nhật hồ sơ thất bại");
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

  if (loadingProfile) {
    return <div>Đang tải hồ sơ...</div>;
  }

  return (
    <div className="py-4 max-w-6xl mx-auto">
      <ProfileHeader
        name={profile?.fullName}
        role={
          profile?.positionId
            ? positions.find((p) => p.id === profile.positionId)?.name
            : "Nhân viên"
        }
        department={
          profile?.departmentId
            ? departments.find((d) => d.id === profile.departmentId)?.name
            : "Chưa có phòng ban"
        }
        isEditing={isEditing}
        updating={updating}
        onEdit={() => setIsEditing(true)}
        onCancel={() => setIsEditing(false)}
        onSubmit={() => onSubmit(profile as ProfileFormValues)}
      />

      <form>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* Section: Basic Info */}
            <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xl font-bold flex items-center gap-3">
                  <UserPen size={20} />
                  Thông tin cơ bản
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isEditing ? (
                  <>
                    <InfoField
                      label="Họ và tên"
                      value={profile?.fullName}
                      placeholder="Nhập họ và tên"
                      onChange={handleInputChange}
                      name="fullName"
                    />
                    <InfoField
                      label="Giới tính"
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
                      label="Ngày sinh"
                      name="birthdate"
                      value={profile?.birthdate}
                      date={true}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Phòng ban"
                      name="departmentId"
                      value={profile?.departmentId}
                      options={departments.map((d) => ({
                        id: d.id,
                        name: d.name,
                      }))}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Chức vụ"
                      name="positionId"
                      value={profile?.positionId}
                      options={positions.map((p) => ({
                        id: p.id,
                        name: p.name,
                      }))}
                      onChange={handleInputChange}
                    />
                    <InfoField
                      label="Quyền hệ thống"
                      name="role"
                      value={profile?.role}
                      disabled
                    />
                  </>
                ) : (
                  <>
                    <InfoField
                      label="Họ và tên"
                      value={profile?.fullName}
                      readonly={true}
                    />
                    <InfoField
                      label="Giới tính"
                      value={profile?.gender}
                      readonly={true}
                    />
                    <InfoField
                      label="Ngày sinh"
                      value={profile?.birthdate}
                      date={true}
                      readonly={true}
                    />
                    <InfoField
                      label="Phòng ban"
                      value={profile?.departmentId}
                      options={departments}
                      disabled={true}
                    />
                    <InfoField
                      label="Chức vụ"
                      value={profile?.positionId}
                      options={positions}
                      disabled={true}
                    />
                    <InfoField
                      label="Quyền hệ thống"
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
                Thông tin liên hệ
              </h2>
              <div className="space-y-6">
                <div>
                  {isEditing ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField
                          label="Email"
                          name="email"
                          value={profile?.email}
                          placeholder="Nhập email"
                          onChange={handleInputChange}
                        />
                        <InfoField
                          label="Số điện thoại"
                          name="phone"
                          value={profile?.phone}
                          placeholder="Nhập số điện thoại"
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="grid grid-cols-1 mt-6">
                        <InfoField
                          label="Địa chỉ"
                          name="address"
                          value={profile?.address}
                          placeholder="Nhập địa chỉ"
                          onChange={handleInputChange}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <InfoField
                          label="Email"
                          value={profile?.email}
                          readonly={true}
                        />
                        <InfoField
                          label="Số điện thoại"
                          value={profile?.phone}
                          readonly={true}
                        />
                      </div>
                      <div className="grid grid-cols-1 mt-6">
                        <InfoField
                          label="Địa chỉ"
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
                Bio
              </h2>
              {isEditing ? (
                <textarea
                  name="bio"
                  value={profile?.bio || ""}
                  onChange={handleInputChange}
                  rows={10}
                  className=" w-full rounded-xl px-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 border border-slate-200 dark:border-slate-700 shadow-sm outline-none resize-none transition focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm
                  "
                  placeholder="Giới thiệu bản thân..."
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
    </div>
  );
}
