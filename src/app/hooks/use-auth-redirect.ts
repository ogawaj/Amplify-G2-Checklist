"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import type { AuthRedirect } from "@/src/app/models/auth-redirect";

/**
 * 認証状態に応じて画面を遷移させるフック
 * @param redirects - 認証状態ごとの遷移先
 * @returns isReady - 遷移が不要で、画面を描画してよいか
 */
export const useAuthRedirect = (redirects: AuthRedirect) => {
  const { authStatus } = useAuthenticator((context) => [context.authStatus]);
  const router = useRouter();
  const destination =
    authStatus === "authenticated"
      ? redirects.authenticated
      : authStatus === "unauthenticated"
        ? redirects.unauthenticated
        : undefined;

  useEffect(() => {
    if (destination) router.replace(destination);
  }, [destination, router]);

  const isReady = authStatus !== "configuring" && destination === undefined;
  return { isReady };
};
