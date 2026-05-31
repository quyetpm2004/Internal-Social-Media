import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getDefaultAvatarUrl(fullName?: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    fullName || "User",
  )}`;
}
