export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  role: "EMPLOYEE" | "ADMIN" | "MANAGER";
  phone?: string;
  address?: string;
  bio?: string;
  avatar?: string;
  birthdate?: string;
  gender?: "male" | "female" | "other";
}
