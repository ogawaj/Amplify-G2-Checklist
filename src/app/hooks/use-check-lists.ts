"use client";

import { useEffect, useState } from "react";

import { useOperation } from "@/src/app/hooks/use-operation";
import type { BulkProgress } from "@/src/app/models/bulk-result";
import type { CheckList } from "@/src/app/models/check-list";
import {
  createCheckList,
  deleteCheckList,
  duplicateCheckList,
  listCheckLists,
  renameCheckList,
} from "@/src/app/services/check-list-service";

/**
 * チェックリスト一覧の取得と、作成・改名・複製・削除を管理するフック
 * @returns 一覧・読み込み状態・進捗・各操作
 */
export const useCheckLists = () => {
  const [checkLists, setCheckLists] = useState<CheckList[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const {
    isPending,
    errorMessage,
    run,
    reportError,
    reportPartialFailure,
    clearError,
  } = useOperation();

  useEffect(() => {
    let isCancelled = false;
    const load = async () => {
      try {
        const fetched = await listCheckLists();
        if (!isCancelled) setCheckLists(fetched);
      } catch {
        if (!isCancelled) {
          setLoadError("チェックリストを読み込めませんでした");
        }
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, []);

  const reload = async (): Promise<boolean> => {
    try {
      setCheckLists(await listCheckLists());
      return true;
    } catch {
      return false;
    }
  };

  const create = async (name: string): Promise<boolean> =>
    await run(async () => {
      const created = await createCheckList(name);
      setCheckLists((current) => [...current, created]);
    }, "チェックリストを作成できませんでした");

  const rename = async (id: string, name: string): Promise<boolean> =>
    await run(async () => {
      const updated = await renameCheckList(id, name);
      setCheckLists((current) =>
        current.map((checkList) => (checkList.id === id ? updated : checkList)),
      );
    }, "名前を変更できませんでした");

  const duplicate = async (id: string): Promise<boolean> => {
    const isSucceeded = await run(async () => {
      const { checkList, result } = await duplicateCheckList(id, setProgress);
      setCheckLists((current) => [...current, checkList]);
      if (result.failureCount > 0) {
        reportError(
          `複製を作成しましたが、${result.failureCount}件の複製に失敗しました`,
        );
      }
    }, "複製できませんでした");
    setProgress(null);
    return isSucceeded;
  };

  const remove = async (id: string): Promise<boolean> => {
    const isSucceeded = await run(async () => {
      const result = await deleteCheckList(id, setProgress);
      if (result.failureCount > 0) {
        reportPartialFailure(
          `${result.failureCount}件の削除に失敗したため、チェックリストは削除されていません。もう一度お試しください`,
          await reload(),
        );
        return;
      }
      setCheckLists((current) =>
        current.filter((checkList) => checkList.id !== id),
      );
    }, "削除できませんでした");
    setProgress(null);
    return isSucceeded;
  };

  return {
    checkLists,
    isLoading,
    loadError,
    progress,
    isPending,
    errorMessage,
    clearError,
    create,
    rename,
    duplicate,
    remove,
  };
};
