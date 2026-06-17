import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind クラス名を結合するユーティリティ
 * @param inputs - 結合するクラス値
 * @returns 結合済みのクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
