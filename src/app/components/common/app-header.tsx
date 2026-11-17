"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import Link from "next/link";

import { APP_PATH } from "@/src/app/enums/app-path";
import { useEnvVariable } from "@/src/app/hooks/use-env-variable";
import { Button } from "@/src/lib/shadcn/ui/button";

/**
 * 共通ヘッダー（アプリ名・環境バッジ・サインアウト）
 * @returns ヘッダー
 */
export function AppHeader() {
  const { signOut } = useAuthenticator((context) => [context.signOut]);
  const { envVariable } = useEnvVariable();

  return (
    <header className="flex items-center justify-between border-b bg-background px-4 py-3 md:px-6">
      <div className="flex items-center gap-3">
        <Link href={APP_PATH.LISTS} className="text-lg font-semibold">
          CheckList
        </Link>
        <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
          {envVariable.ENV_JA_NAME}
        </span>
      </div>
      <Button variant="outline" onClick={signOut}>
        サインアウト
      </Button>
    </header>
  );
}
