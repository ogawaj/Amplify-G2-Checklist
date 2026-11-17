"use client";

import { useBulkProgress } from "@/src/app/hooks/use-bulk-progress";
import { useOperation } from "@/src/app/hooks/use-operation";
import { useUndoToast } from "@/src/app/hooks/use-undo-toast";

/**
 * 詳細画面で操作の結果を利用者に伝える仕組み（実行中・エラー・通知・一括処理の進捗）をまとめたフック
 *
 * 画面内のすべての操作フックが同じものを共有し、エラーや通知を1か所に集める。
 * @returns 実行中・エラー・通知・一括処理の進捗の状態と操作
 */
export const useDetailFeedback = () => {
  const operation = useOperation();
  const undoToast = useUndoToast();
  const bulk = useBulkProgress();
  return { ...operation, ...undoToast, ...bulk };
};
