"use client";

import { AppHeader } from "@/src/app/components/common/app-header";
import { LoadingMessage } from "@/src/app/components/common/loading-message";
import { APP_PATH } from "@/src/app/enums/app-path";
import { useAuthRedirect } from "@/src/app/hooks/use-auth-redirect";

/**
 * 認証必須ページのレイアウト（未認証ならサインインへ遷移し、共通ヘッダーを表示する）
 * @param props - プロパティ
 * @returns ヘッダー付きのレイアウト
 */
export default function AuthPageLayout(props: {
  /** 子コンポーネント */
  children: React.ReactNode;
}) {
  const { isReady } = useAuthRedirect({ unauthenticated: APP_PATH.SIGN_IN });
  if (!isReady) return <LoadingMessage />;
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-4xl px-4 pt-4 pb-16">
        {props.children}
      </main>
    </div>
  );
}
