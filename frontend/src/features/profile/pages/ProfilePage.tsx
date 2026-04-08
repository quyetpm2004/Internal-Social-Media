import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { profileApi } from "@/features/profile/api/profile.api";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/features/profile/schemas/profile.schema";
import { useAuthStore } from "@/features/auth/store/auth.store";
import ProfileHeader from "../components/ProfileHeader";
import InfoField from "../components/InfoField";
import { BookUser, Mail, Phone, Shell, UserPen } from "lucide-react";

export interface EmployeeData {
  fullName: string;
  displayName: string;
  role: string;
  department: string;
  email: string;
  phone: string;
  bio: string;
}

export default function ProfilePage() {
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [updating, setUpdating] = useState(false);
  const setUser = useAuthStore((state) => state.setUser);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
      address: "",
      bio: "",
      avatar: "",
      birthdate: "",
      gender: "male",
    },
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await profileApi.getProfile();
        reset(res.data);
        setUser(res.data);
      } catch {
        toast.error("Không tải được hồ sơ");
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [reset, setUser]);

  const onSubmit = async (values: ProfileFormValues) => {
    try {
      setUpdating(true);
      const res = await profileApi.updateProfile(values);
      reset(res.data);
      setUser(res.data);
      toast.success("Cập nhật hồ sơ thành công");
    } catch {
      toast.error("Cập nhật hồ sơ thất bại");
    } finally {
      setUpdating(false);
    }
  };

  if (loadingProfile) {
    return <div>Đang tải hồ sơ...</div>;
  }

  const user: EmployeeData = {
    fullName: "Trần Minh Quân",
    displayName: "Quân Trần",
    role: "Trưởng nhóm",
    department: "Phòng Kinh doanh",
    email: "tranminhquan@example.com",
    phone: "+84 912 345 678",
    bio: "Trần Minh Quân là một chuyên gia kinh doanh với hơn 10 năm kinh nghiệm trong ngành. Anh đã dẫn dắt nhiều dự án thành công và xây dựng mối quan hệ vững chắc với khách hàng. Với kỹ năng lãnh đạo xuất sắc và khả năng giải quyết vấn đề nhanh chóng, Quân luôn là người đứng đầu trong việc đạt được mục tiêu kinh doanh của công ty.",
  };

  return (
    <div className="py-4 max-w-6xl mx-auto">
      <ProfileHeader
        name={user.fullName}
        role={user.role}
        department={user.department}
      />

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
              <InfoField label="Họ và tên" value={user.fullName} />
              <InfoField label="Giới tính" value="Nam" />
              <InfoField label="Ngày sinh" value="14/10/1988" />
              <InfoField label="Phòng ban" value={user.department} />
            </div>
          </section>

          {/* Section: Contact */}
          <section className="bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
            <h2 className="text-xl font-bold flex items-center gap-3 mb-8">
              <BookUser size={20} />
              Thông tin liên hệ
            </h2>
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <InfoField
                  label="Email"
                  value={user.email}
                  icon={<Mail size={20} />}
                />
                <InfoField
                  label="Số điện thoại"
                  value={user.phone}
                  icon={<Phone size={20} />}
                />
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
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-sm">
              {user.bio}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
