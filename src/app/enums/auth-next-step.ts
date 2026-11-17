/** 認証操作の完了後に利用者が進む次の手順 */
export const AUTH_NEXT_STEP = {
  /** サインイン済み。認証後の画面へ進む */
  SIGNED_IN: "SIGNED_IN",
  /** メールアドレスの確認コード入力へ進む */
  CONFIRM_SIGN_UP: "CONFIRM_SIGN_UP",
  /** 確認は完了したがサインインは未実施。サインイン画面へ進む */
  SIGN_IN: "SIGN_IN",
} as const;

/** 認証操作の完了後に利用者が進む次の手順 */
export type AuthNextStep = (typeof AUTH_NEXT_STEP)[keyof typeof AUTH_NEXT_STEP];
