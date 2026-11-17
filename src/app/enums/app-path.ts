/** 画面のルートパス（リスト配下を除く） */
export const APP_PATH = {
  SIGN_IN: "/sign-in",
  SIGN_UP: "/sign-up",
  PASSWORD_RESET: "/password-reset",
  LISTS: "/lists",
} as const;

/** チェックリスト配下の画面を表すパス区間 */
export const LIST_SECTION = {
  CSV: "csv",
} as const;

/** チェックリスト配下の画面のパス区間 */
export type ListSection = (typeof LIST_SECTION)[keyof typeof LIST_SECTION];
