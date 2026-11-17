/** チェックリスト詳細画面のモード */
export const DETAIL_MODE = {
  PREPARE: "PREPARE",
  EDIT: "EDIT",
} as const;

/** チェックリスト詳細画面のモードの型 */
export type DetailMode = (typeof DETAIL_MODE)[keyof typeof DETAIL_MODE];
