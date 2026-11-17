/**
 * 作成日時の昇順（同時刻はIDの昇順）で並べるための比較関数
 * @param a - 比較対象
 * @param b - 比較対象
 * @returns Array.prototype.sort 用の比較結果
 */
export const compareByCreatedAt = (
  a: { id: string; createdAt: string },
  b: { id: string; createdAt: string },
): number => a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id);

/**
 * 持ち物の表示順で並べるための比較関数。sortOrder の昇順で、未設定は末尾にまとめて作成日時の昇順で並べる
 * @param a - 比較対象
 * @param b - 比較対象
 * @returns Array.prototype.sort 用の比較結果
 * @example [{sortOrder: null}, {sortOrder: 1}, {sortOrder: 0}] は 0 → 1 → null の順になる
 */
export const compareItemOrder = (
  a: { id: string; createdAt: string; sortOrder?: number | null },
  b: { id: string; createdAt: string; sortOrder?: number | null },
): number => {
  const aOrder = a.sortOrder ?? Number.POSITIVE_INFINITY;
  const bOrder = b.sortOrder ?? Number.POSITIVE_INFINITY;
  if (aOrder !== bOrder) return aOrder < bOrder ? -1 : 1;
  return compareByCreatedAt(a, b);
};
