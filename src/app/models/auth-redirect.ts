/** 認証状態ごとの遷移先。未指定の状態では遷移しない */
export type AuthRedirect = {
  /** 認証済みのときの遷移先 */
  authenticated?: string;
  /** 未認証のときの遷移先 */
  unauthenticated?: string;
};
