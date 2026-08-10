import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getInitials = (name: string) => {
  const names = name.trim().split(/\s+/);

  return names
    .slice(0, 2)
    .map((name) => name[0])
    .join("")
    .toUpperCase();
};
