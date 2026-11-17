"use client";

import { useCallback, useState } from "react";

import { UserFacingError } from "@/src/app/models/user-facing-error";

/** 一括操作の後に最新の内容を再取得できなかったときの文言 */
const RELOAD_ERROR_MESSAGE =
  "最新の内容を再取得できませんでした。画面を再読み込みしてください";

/**
 * 操作の失敗を利用者向けの文言にする
 * @param error - 投げられた値
 * @param fallbackMessage - UserFacingError 以外が投げられたときの文言
 * @returns UserFacingError なら message、それ以外なら fallbackMessage
 */
const toOperationErrorMessage = (
  error: unknown,
  fallbackMessage: string,
): string =>
  error instanceof UserFacingError ? error.message : fallbackMessage;

/**
 * 非同期操作の実行中状態とエラー文言を管理するフック
 *
 * 複数の操作を同時に実行でき、1件でも実行中なら isPending が true になる。
 * @returns isPending・errorMessage・run・reportError・reportPartialFailure・clearError
 */
export const useOperation = () => {
  const [pendingCount, setPendingCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(
    async (
      operation: () => Promise<void>,
      fallbackMessage: string,
    ): Promise<boolean> => {
      setPendingCount((count) => count + 1);
      setErrorMessage(null);
      try {
        await operation();
        return true;
      } catch (error) {
        setErrorMessage(toOperationErrorMessage(error, fallbackMessage));
        return false;
      } finally {
        setPendingCount((count) => count - 1);
      }
    },
    [],
  );

  const reportError = useCallback((message: string) => {
    setErrorMessage(message);
  }, []);

  const reportPartialFailure = useCallback(
    (failureMessage: string | null, isReloaded: boolean) => {
      const messages = [
        ...(failureMessage === null ? [] : [failureMessage]),
        ...(isReloaded ? [] : [RELOAD_ERROR_MESSAGE]),
      ];
      if (messages.length > 0) setErrorMessage(messages.join(" "));
    },
    [],
  );

  const clearError = useCallback(() => setErrorMessage(null), []);

  return {
    isPending: pendingCount > 0,
    errorMessage,
    run,
    reportError,
    reportPartialFailure,
    clearError,
  };
};
