"use client";

import { LoadingMessage } from "@/src/app/components/common/loading-message";
import { APP_PATH } from "@/src/app/enums/app-path";
import { useAuthRedirect } from "@/src/app/hooks/use-auth-redirect";

/**
 * 公開ページのレイアウト（認証済みならチェックリスト一覧へ遷移する）
 * @param props - プロパティ
 * @returns 中央寄せ1カラムのレイアウト
 */
export default function PublicPageLayout(props: {
  /** 子コンポーネント */
  children: React.ReactNode;
}) {
  const { isReady } = useAuthRedirect({ authenticated: APP_PATH.LISTS });
  if (!isReady) return <LoadingMessage />;
  return (
    <main className="grid min-h-screen place-items-center bg-muted px-4 py-8">
      <div className="w-full max-w-sm">{props.children}</div>
    </main>
  );
}
