import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

type ProfileMeta = { full_name?: string; avatar_url?: string };

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function metaString(meta: unknown, key: keyof ProfileMeta): string | null {
  if (typeof meta === "object" && meta) {
    const v = (meta as Record<string, unknown>)[key as string];
    return typeof v === "string" ? v : null;
  }
  return null;
}
