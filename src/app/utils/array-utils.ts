/**
 * 要素をキーごとにまとめる
 * @param values - 対象の配列
 * @param getKey - 要素からキーを求める関数
 * @returns キーごとの要素配列（要素は入力順）
 */
export const groupBy = <T, K>(
  values: readonly T[],
  getKey: (value: T) => K,
): Map<K, T[]> => {
  const groups = new Map<K, T[]>();
  for (const value of values) {
    const key = getKey(value);
    const group = groups.get(key);
    if (group) {
      group.push(value);
    } else {
      groups.set(key, [value]);
    }
  }
  return groups;
};

/**
 * 要素をキーで引ける Map にする。同じキーの要素は後のものが残る
 * @param values - 対象の配列
 * @param getKey - 要素からキーを求める関数
 * @returns キーから要素を引く Map
 */
export const keyBy = <T, K>(
  values: readonly T[],
  getKey: (value: T) => K,
): Map<K, T> => {
  return new Map(values.map((value) => [getKey(value), value]));
};

/**
 * 同じ id の要素を新しい値で置き換える。置き換え先に存在しない要素は追加しない
 * @param values - 元の配列
 * @param updated - 新しい値（id で置き換え先を決める）
 * @returns 置き換えた新しい配列（順序は元のまま）
 */
export const mergeById = <T extends { id: string }>(
  values: readonly T[],
  updated: readonly T[],
): T[] => {
  const updatedById = keyBy(updated, (value) => value.id);
  return values.map((value) => updatedById.get(value.id) ?? value);
};
