import { Users } from "lucide-react";

type GroupHeaderProps = {
  onClick: () => void;
};

const GroupHeader = ({ onClick }: GroupHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-surface mb-2">
          Groups
        </h1>
        <p className="text-on-surface-variant text-sm">
          Kết nối với các nhóm, khám phá các trung tâm đổi mới và tham gia cộng
          đồng của các phòng ban.
        </p>
      </div>
      <button
        className="inline-flex items-center cursor-pointer gap-2 px-4 py-2 bg-primary text-on-primary rounded-xl text-sm font-bold transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-primary/20"
        onClick={onClick}
      >
        <Users size={16} />
        Create Group
      </button>
    </div>
  );
};

export default GroupHeader;
