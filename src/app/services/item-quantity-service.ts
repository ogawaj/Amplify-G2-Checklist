/**
 * 日数を乗じた必要数を求める
 * @param quantityPerDay - 1日あたりの必要数。未設定は null / undefined
 * @param durationDays - 日数
 * @returns 必要数。数量が未設定の場合は null
 * @example calculateRequiredQuantity(2, 4) // 8
 */
export const calculateRequiredQuantity = (
  quantityPerDay: number | null | undefined,
  durationDays: number,
): number | null =>
  quantityPerDay === null || quantityPerDay === undefined
    ? null
    : quantityPerDay * durationDays;
