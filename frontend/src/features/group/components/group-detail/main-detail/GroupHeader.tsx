import React, { useState } from "react";
import {
  Globe,
  UserPlus,
  Share2,
  EarthLock,
  Activity,
  UserMinus,
} from "lucide-react";
import { NavLink, useParams } from "react-router-dom";
import ConfirmModal from "@/components/common/ConfirmModal";
import { toast } from "sonner";

type GroupHeaderProps = {
  name: string;
  type: "PUBLIC" | "PRIVATE" | "DEPARTMENT";
  memberCount: number;
  isMember: boolean;
  avatarUrl?: string;
  coverUrl?: string;
  onJoinLeave: () => void;
};

const tabs = [
  {
    label: "Thảo luận",
    path: "",
  },
  {
    label: "Thành viên",
    path: "members",
  },
];

const GroupHeader: React.FC<GroupHeaderProps> = ({
  name,
  type,
  memberCount,
  isMember,
  avatarUrl,
  coverUrl,
  onJoinLeave,
}) => {
  const { groupId } = useParams();

  const [showLeaveJoinConfirm, setShowLeaveJoinConfirm] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);

      toast.success("Đã copy link nhóm");
    } catch (error: any) {
      console.error("Copy failed:", error);
      toast.error("Copy link thất bại");
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img
          className="w-full h-full object-cover"
          src={
            coverUrl ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuCxXrrVBOhyAl7Aur699kAxZteWPkXZCRRIQG5LakpAB500wW2pX0oErQ5rTuQ0BoP5GIvfTD3VY_UbSVwlbx4SYp2m2wPHDldxxBaCS4MSb6nkbzoXZATv8JF0_gp4mF1digbyXX_vSAhTXN3P-Ur0JZb4F8QVkfZaj0Gmcy9vftdnzoxrj_wRBH4jhIaOFVVDxTdfXZdh89KK4hlnhPM0c-YPDbkXxfI-Au0hBnxKTnJL0p4jNcMWzCyt9Lm7XUmXyOKxNrRKaso"
          }
          alt="Cover"
        />

        <div className="absolute inset-0 bg-linear-to-t from-slate-900/60 to-transparent" />
      </div>

      {/* Header */}
      <div className="max-w-5xl mx-auto px-6 relative -mt-16">
        <div className="flex flex-col md:flex-row items-end md:items-center justify-between gap-4">
          <div className="flex items-end gap-6">
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-white p-1.5 shadow-xl">
              <img
                className="w-full h-full object-cover rounded-lg"
                src={
                  avatarUrl ||
                  "https://lh3.googleusercontent.com/aida-public/AB6AXuAI0ouc-lE7Mr_qFsNUSQR5gEbGDXlsqnkWdS7EAkuImx0udlRLc1vpCMdM3kOXh-NBZ_QN1KZzmksOEAjgxWvsg7icSx7N8y9g8vW5Pb4aCjtekUtqHx8jZxQ6qkyh9pc2chdiENsQtZv6OKjtiDJPGX8twDM7RCOJ2RI0UAHpYzze2AZYBWxssvQABj2_oBWOYCV6PmG4pRLdtL4Cj6GD-8_iFaRxN2MTZFR-5OQZsnvxVgtPXi3pGFL4bFaA_Fb8TlDTHmhBios"
                }
                alt="Logo"
              />
            </div>

            <div className="mb-4 text-black dark:text-white">
              <h1 className="text-3xl font-extrabold mb-2">{name}</h1>

              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-sm font-medium">
                  {type === "PUBLIC" && (
                    <>
                      <Globe size={16} />
                      <span>Nhóm công khai</span>
                    </>
                  )}

                  {type === "PRIVATE" && (
                    <>
                      <EarthLock size={16} />
                      <span>Nhóm riêng tư</span>
                    </>
                  )}

                  {type === "DEPARTMENT" && (
                    <>
                      <Activity size={16} />
                      <span>Nhóm phòng ban</span>
                    </>
                  )}
                </span>

                <span className="text-black/60">•</span>

                <span className="text-sm font-semibold">
                  {memberCount.toLocaleString()} thành viên
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 mb-4">
            <button
              className="px-6 py-2.5 bg-blue-700 text-white font-bold cursor-pointer rounded-xl flex items-center gap-2 hover:bg-blue-800 transition-colors shadow-lg shadow-blue-700/20"
              onClick={() => setShowLeaveJoinConfirm(true)}
            >
              {isMember ? (
                <>
                  <UserMinus size={18} />
                  <span>Rời khỏi nhóm</span>
                </>
              ) : (
                <>
                  <UserPlus size={18} />
                  <span>Tham gia nhóm</span>
                </>
              )}
            </button>

            <button
              className="p-2.5 bg-white/20 backdrop-blur-md text-white rounded-xl hover:bg-white/30 transition-colors"
              onClick={handleCopyLink}
            >
              <Share2 size={20} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex gap-8 border-t border-slate-100 pt-1">
          {tabs.map((item) => {
            const to = item.path
              ? `/groups/${groupId}/${item.path}`
              : `/groups/${groupId}`;

            return (
              <NavLink
                key={item.label}
                to={to}
                end={!item.path}
                className={({ isActive }) =>
                  `py-4 text-sm font-medium transition-colors border-b-2 ${
                    isActive
                      ? "text-blue-700 border-blue-700"
                      : "text-slate-500 border-transparent hover:text-slate-900 dark:hover:text-white"
                  }`
                }
              >
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </div>

      {showLeaveJoinConfirm && (
        <ConfirmModal
          open={showLeaveJoinConfirm}
          title={isMember ? "Rời nhóm?" : "Tham gia nhóm?"}
          description={
            isMember
              ? "Bạn có chắc chắn muốn rời khỏi nhóm này không?"
              : "Bạn có chắc chắn muốn tham gia nhóm này không?"
          }
          confirmText={isMember ? "Rời nhóm" : "Tham gia nhóm"}
          variant="primary"
          onCancel={() => setShowLeaveJoinConfirm(false)}
          onConfirm={() => {
            setShowLeaveJoinConfirm(false);
            onJoinLeave();
          }}
        />
      )}
    </section>
  );
};

export default GroupHeader;
