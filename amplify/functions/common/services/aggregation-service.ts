import {
  type DailyAccessSummaryRecord,
  upsertSummary,
} from "../repositories/daily-access-summary-repository";
import { listAllTodos } from "../repositories/todo-repository";

/**
 * Todo の updatedAt から日別のユニーク owner 数を集計し、DailyAccessSummary に保存する
 * @returns 集計結果一覧
 */
export const aggregateAccess = async (): Promise<
  DailyAccessSummaryRecord[]
> => {
  const todos = await listAllTodos();

  // updatedAt を日付ごとにグルーピングし、ユニーク owner をカウント
  const dailyOwners = new Map<string, Set<string>>();

  for (const todo of todos) {
    if (!todo.updatedAt || !todo.owner) continue;

    const date = todo.updatedAt.substring(0, 10); // YYYY-MM-DD
    if (!dailyOwners.has(date)) {
      dailyOwners.set(date, new Set());
    }
    dailyOwners.get(date)!.add(todo.owner);
  }

  // 集計結果を DailyAccessSummary テーブルに保存
  const results: DailyAccessSummaryRecord[] = [];

  for (const [date, owners] of dailyOwners) {
    const accessCount = owners.size;
    await upsertSummary(date, accessCount);
    results.push({ date, accessCount });
  }

  // 日付順にソート
  results.sort((a, b) => a.date.localeCompare(b.date));

  return results;
};
