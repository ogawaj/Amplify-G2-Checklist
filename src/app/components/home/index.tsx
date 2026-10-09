"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";

import { useEnvVariable } from "@/src/app/hooks/use-env-variable";
import { Button } from "@/src/lib/shadcn/ui/button";

/**
 * ホーム画面コンポーネント（アプリ名・環境バッジ・サインアウトのヘッダーのみ）
 * @returns ホーム画面
 */
export function Home() {
  const { signOut } = useAuthenticator();
  const { envVariable } = useEnvVariable();

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Amplify-G2-CheckList</h1>
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {envVariable.ENV_JA_NAME}
          </span>
        </div>
        <Button variant="outline" onClick={signOut}>
          サインアウト
        </Button>
      </header>
    </div>
  );
}
