/** 確認コードを伴う認証フォームの段階 */
export const AUTH_FORM_STEP = {
  INPUT: "INPUT",
  CONFIRM: "CONFIRM",
} as const;

/** 認証フォームの段階 */
export type AuthFormStep = (typeof AUTH_FORM_STEP)[keyof typeof AUTH_FORM_STEP];
