/** チェックリスト詳細画面で下から出すシートの種類（持ち物の編集シートを除く） */
export const DETAIL_SHEET = {
  MENU: "MENU",
  RENAME: "RENAME",
  CATEGORIES: "CATEGORIES",
  TAGS: "TAGS",
  BULK_TAGS: "BULK_TAGS",
  BULK_CATEGORY: "BULK_CATEGORY",
} as const;

/** 下から出すシートの種類の型 */
export type DetailSheet = (typeof DETAIL_SHEET)[keyof typeof DETAIL_SHEET];
