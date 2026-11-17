/** カテゴリを削除できない理由 */
export const CATEGORY_DELETE_BLOCKER = {
  HAS_ITEMS: "HAS_ITEMS",
  LAST_CATEGORY: "LAST_CATEGORY",
} as const;

/** カテゴリを削除できない理由の型 */
export type CategoryDeleteBlocker =
  (typeof CATEGORY_DELETE_BLOCKER)[keyof typeof CATEGORY_DELETE_BLOCKER];
