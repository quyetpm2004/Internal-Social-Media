export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN" | "MANAGER";
  bio: string;
  phone: string;
  gender: "Nam" | "Nữ" | "Khác";
  address: string;
  birthdate: string;
  avatarUrl: string;
  departmentId: string;
  positionId: string;
}

export interface Department {
  id: string;
  name: string;
  description: string;
}

export interface Position {
  id: string;
  name: string;
  level: string;
}
