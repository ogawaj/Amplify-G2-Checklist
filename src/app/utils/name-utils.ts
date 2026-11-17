/**
 * 同じ名称の要素が既に存在するかを判定する（前後の空白は無視して比較する）
 * @param records - 既存の要素
 * @param name - 検査する名称
 * @param excludeId - 検査から除く要素のID（改名時の自分自身）
 * @returns 重複する要素があれば true
 */
export const isNameTaken = (
  records: readonly { id: string; name: string }[],
  name: string,
  excludeId?: string,
): boolean => {
  const trimmed = name.trim();
  return records.some(
    (record) => record.id !== excludeId && record.name.trim() === trimmed,
  );
};
