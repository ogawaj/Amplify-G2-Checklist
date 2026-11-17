"use client";

import { LoadingMessage } from "@/src/app/components/common/loading-message";
import { APP_PATH } from "@/src/app/enums/app-path";
import { useAuthRedirect } from "@/src/app/hooks/use-auth-redirect";

/**
 * ルートページ（認証状態に応じて一覧またはサインインへ振り分ける）
 * @returns 遷移待ちの表示
 */
export default function RootPage() {
  useAuthRedirect({
    authenticated: APP_PATH.LISTS,
    unauthenticated: APP_PATH.SIGN_IN,
  });
  return <LoadingMessage />;
}
