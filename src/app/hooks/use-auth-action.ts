"use client";

import { useCallback, useState } from "react";

import { UserFacingError } from "@/src/app/models/user-facing-error";

/** 対応表にないエラーに使う文言 */
const FALLBACK_MESSAGE =
  "処理に失敗しました。時間をおいてもう一度お試しください";

/**
 * 認証操作の実行中状態とエラー文言を管理するフック
 *
 * UserFacingError はその message を、それ以外は汎用文言を表示する。
 * @returns isPending・errorMessage・run・clearError
 */
export const useAuthAction = () => {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(
    async (action: () => Promise<void>): Promise<boolean> => {
      setIsPending(true);
      setErrorMessage(null);
      try {
        await action();
        return true;
      } catch (error) {
        setErrorMessage(
          error instanceof UserFacingError ? error.message : FALLBACK_MESSAGE,
        );
        return false;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  const clearError = useCallback(() => setErrorMessage(null), []);

  return { isPending, errorMessage, run, clearError };
};
