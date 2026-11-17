import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import type {
  BulkProgress,
  BulkResult,
  BulkWriteOutcome,
} from "@/src/app/models/bulk-result";

/**
 * 同時実行数を制限して全要素を処理する。1件の失敗で他の要素の処理は止まらない
 * @param items - 処理対象
 * @param worker - 要素1件を処理する関数
 * @param onSettled - 1件の処理が成功・失敗のいずれかで終わるたびに呼ばれる関数
 * @returns 入力と同じ順序の処理結果
 */
export const mapConcurrently = async <T, R>(
  items: readonly T[],
  worker: (item: T) => Promise<R>,
  onSettled?: () => void,
): Promise<PromiseSettledResult<R>[]> => {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let nextIndex = 0;
  const run = async () => {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      try {
        results[index] = {
          status: "fulfilled",
          value: await worker(items[index]),
        };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
      onSettled?.();
    }
  };
  const workerCount = Math.min(CHECK_LIST_LIMIT.CONCURRENCY, items.length);
  await Promise.all(Array.from({ length: workerCount }, run));
  return results;
};

/**
 * 処理結果を成功件数・失敗件数・失敗の理由に集約する
 * @param results - {@link mapConcurrently} の結果
 * @returns 一括処理の結果
 */
export const toBulkResult = (
  results: readonly PromiseSettledResult<unknown>[],
): BulkResult => {
  const failureReasons = results.flatMap((result) =>
    result.status === "rejected" ? [result.reason as unknown] : [],
  );
  return {
    successCount: results.length - failureReasons.length,
    failureCount: failureReasons.length,
    failureReasons,
  };
};

/**
 * 処理結果を、成功件数・失敗の理由と成功した値にまとめる
 * @param results - {@link mapConcurrently} の結果
 * @returns 一括処理の結果と、成功した値（入力順）
 */
export const toBulkWriteOutcome = <T>(
  results: readonly PromiseSettledResult<T>[],
): BulkWriteOutcome<T> => ({
  result: toBulkResult(results),
  values: results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : [])),
});

/**
 * 完了件数を数えて進捗を通知する関数を作る。複数段階の処理で総件数を通しで数える際に使う
 * @param totalCount - 全段階を通した処理対象の総件数
 * @param onProgress - 進捗の通知先。省略時は何も通知しない
 * @returns 1件完了するたびに呼ぶ関数
 */
export const createProgressTicker = (
  totalCount: number,
  onProgress?: (progress: BulkProgress) => void,
): (() => void) => {
  let completedCount = 0;
  return () => {
    completedCount += 1;
    onProgress?.({ completedCount, totalCount });
  };
};
