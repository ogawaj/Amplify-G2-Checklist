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
 * 表示順で並べるための比較関数。sortOrder の昇順で、未設定は末尾にまとめて作成日時の昇順で並べる
 * @param a - 比較対象
 * @param b - 比較対象
 * @returns Array.prototype.sort 用の比較結果
 * @example [{sortOrder: null}, {sortOrder: 1}, {sortOrder: 0}] は 0 → 1 → null の順になる
 */
export const compareBySortOrder = (
  a: { id: string; createdAt: string; sortOrder?: number | null },
  b: { id: string; createdAt: string; sortOrder?: number | null },
): number => {
  const aOrder = a.sortOrder ?? Number.POSITIVE_INFINITY;
  const bOrder = b.sortOrder ?? Number.POSITIVE_INFINITY;
  if (aOrder !== bOrder) return aOrder < bOrder ? -1 : 1;
  return compareByCreatedAt(a, b);
};

/**
 * 並んだ要素のうち1つを、別の要素の位置へ動かす。下へ動かすと対象の直後、上へ動かすと対象の直前に入り、間の要素は1つずつずれる
 * @param sorted - 表示順に並んだ要素
 * @param id - 動かす要素のID
 * @param targetId - 移動先にある要素のID
 * @returns 動かした後の並び（新しい配列）
 * @throws {Error} どちらかの要素が見つからない場合
 * @example
 * // A B C で A を C の位置へ → B C A、C を A の位置へ → C A B
 * moveToPosition([a, b, c], "a", "c");
 */
export const moveToPosition = <T extends { id: string }>(
  sorted: readonly T[],
  id: string,
  targetId: string,
): T[] => {
  const from = sorted.findIndex((element) => element.id === id);
  const to = sorted.findIndex((element) => element.id === targetId);
  if (from === -1 || to === -1) {
    throw new Error(`並べ替える対象が見つかりません: ${id}, ${targetId}`);
  }
  const moved = sorted.filter((_, index) => index !== from);
  moved.splice(to, 0, sorted[from]);
  return moved;
};

/**
 * 末尾に加える要素の表示順を決める。表示順が未設定の要素があれば未設定（undefined）にし、作成日時順で末尾に並ぶようにする
 * @param elements - 既存の要素
 * @returns 既存の表示順の最大値+1（要素がなければ0）。未設定の要素があれば undefined
 * @example nextSortOrder([{sortOrder: 0}, {sortOrder: 3}]) は 4、nextSortOrder([{sortOrder: 0}, {sortOrder: null}]) は undefined
 */
export const nextSortOrder = (
  elements: readonly { sortOrder?: number | null }[],
): number | undefined => {
  const sortOrders = elements.flatMap((element) => element.sortOrder ?? []);
  return sortOrders.length < elements.length
    ? undefined
    : Math.max(-1, ...sortOrders) + 1;
};

/**
 * 表示順に並んだ要素へ0からの連番を振る（保存はしない）
 * @param sorted - 表示順に並んだ要素
 * @returns sortOrder を0からの連番にした要素（新しい配列）
 */
export const assignSequentialOrder = <T extends { sortOrder?: number | null }>(
  sorted: readonly T[],
): (T & { sortOrder: number })[] =>
  sorted.map((element, sortOrder) => ({ ...element, sortOrder }));

/**
 * 計画した並び（{@link assignSequentialOrder} 済み）のうち、表示順が元と変わった要素だけ書き込む。
 * 書き込みはすべて終わるまで待ち、1件でも失敗していれば最初の失敗を投げる（成功した分は書き込まれたまま残る）
 * @param planned - 新しい表示順を振った要素
 * @param previous - 変更前の要素（表示順の比較に使う）
 * @param update - 1件の表示順を書き込み、更新後の要素を返す関数
 * @returns 書き込み後の全件（書き込まなかった要素は planned のまま）
 * @throws {unknown} 書き込みに失敗した場合は update が投げた最初の値
 */
export const saveSequentialOrder = async <
  T extends { id: string; sortOrder?: number | null },
>(
  planned: readonly (T & { sortOrder: number })[],
  previous: readonly T[],
  update: (input: { id: string; sortOrder: number }) => Promise<T>,
): Promise<T[]> => {
  const previousOrders = new Map(
    previous.map((element) => [element.id, element.sortOrder]),
  );
  const results = await Promise.allSettled(
    planned.map((element) =>
      element.sortOrder === previousOrders.get(element.id)
        ? Promise.resolve<T>(element)
        : update({ id: element.id, sortOrder: element.sortOrder }),
    ),
  );
  const failure = results.find((result) => result.status === "rejected");
  if (failure) throw failure.reason;
  return results.flatMap((result) =>
    result.status === "fulfilled" ? [result.value] : [],
  );
};
