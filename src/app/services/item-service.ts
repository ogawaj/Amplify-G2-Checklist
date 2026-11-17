import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import type {
  BulkProgress,
  BulkResult,
  BulkWriteOutcome,
} from "@/src/app/models/bulk-result";
import type { Category } from "@/src/app/models/category";
import type {
  Item,
  ItemCreateInput,
  ItemUpdateInput,
} from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  createItem as createItemRecord,
  deleteItem as deleteItemRecord,
  listItems as listItemRecords,
  updateItem as updateItemRecord,
} from "@/src/app/repositories/item-repository";
import { sortCategories } from "@/src/app/services/category-service";
import {
  createProgressTicker,
  mapConcurrently,
  toBulkResult,
  toBulkWriteOutcome,
} from "@/src/app/services/concurrency-service";
import { mergeById } from "@/src/app/utils/array-utils";
import { compareItemOrder } from "@/src/app/utils/sort-utils";

/** 1日あたりの必要数が範囲外のときの文言 */
const QUANTITY_RANGE_MESSAGE = `1日あたりの必要数は${CHECK_LIST_LIMIT.QUANTITY_MIN}〜${CHECK_LIST_LIMIT.QUANTITY_MAX}の整数で指定してください`;

/**
 * 持ち物に付与されたタグのIDを返す
 * @param item - 持ち物
 * @returns タグID（付与がなければ空配列）
 */
export const getItemTagIds = (item: Pick<Item, "tagIds">): string[] =>
  item.tagIds ?? [];

/**
 * 1日あたりの必要数として指定できる値かを判定する
 * @param quantityPerDay - 検査する値
 * @returns 範囲内の整数であれば true
 */
export const isValidQuantityPerDay = (quantityPerDay: number): boolean =>
  Number.isInteger(quantityPerDay) &&
  quantityPerDay >= CHECK_LIST_LIMIT.QUANTITY_MIN &&
  quantityPerDay <= CHECK_LIST_LIMIT.QUANTITY_MAX;

/**
 * チェックリストの持ち物を表示順で取得する
 * @param checkListId - チェックリストID
 * @returns 持ち物一覧（{@link compareItemOrder} の順）
 */
export const listItems = async (checkListId: string): Promise<Item[]> => {
  const items = await listItemRecords(checkListId);
  return items.sort(compareItemOrder);
};

/**
 * 1日あたりの必要数を検査する。未指定（undefined）と未設定（null）は検査しない
 * @param quantityPerDay - 検査する値
 * @throws {UserFacingError} 範囲外の場合
 */
const assertValidQuantityPerDay = (
  quantityPerDay: number | null | undefined,
): void => {
  if (
    typeof quantityPerDay === "number" &&
    !isValidQuantityPerDay(quantityPerDay)
  ) {
    throw new UserFacingError(QUANTITY_RANGE_MESSAGE);
  }
};

/**
 * 持ち物を未チェックの状態で作成する
 * @param input - 作成する持ち物の項目
 * @returns 作成した持ち物
 * @throws {UserFacingError} 1日あたりの必要数が範囲外の場合
 */
export const createItem = async (
  input: Omit<ItemCreateInput, "isChecked">,
): Promise<Item> => {
  assertValidQuantityPerDay(input.quantityPerDay);
  return await createItemRecord({ ...input, isChecked: false });
};

/**
 * 持ち物を更新する。省略した項目は更新されず、quantityPerDay に null を渡すと数量を消す
 * @param input - 更新対象のIDと変更項目
 * @returns 更新後の持ち物
 * @throws {UserFacingError} 1日あたりの必要数が範囲外の場合
 */
export const updateItem = async (input: ItemUpdateInput): Promise<Item> => {
  assertValidQuantityPerDay(input.quantityPerDay);
  return await updateItemRecord(input);
};

/**
 * 持ち物をまとめて削除する。存在しない持ち物は成功として扱う
 * @param itemIds - 削除する持ち物のID
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果
 */
export const deleteItems = async (
  itemIds: readonly string[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkResult> => {
  const results = await mapConcurrently(
    itemIds,
    deleteItemRecord,
    createProgressTicker(itemIds.length, onProgress),
  );
  return toBulkResult(results);
};

/**
 * チェック済みの持ち物だけを未チェックに戻す
 * @param items - チェックリスト内の全持ち物
 * @param onProgress - 進捗の通知先（通知の総件数はチェック済みの件数）
 * @returns 一括処理の結果
 */
export const resetItems = async (
  items: readonly Item[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkResult> => {
  const checkedItems = items.filter((item) => item.isChecked);
  const results = await mapConcurrently(
    checkedItems,
    (item) => updateItemRecord({ id: item.id, isChecked: false }),
    createProgressTicker(checkedItems.length, onProgress),
  );
  return toBulkResult(results);
};

/**
 * 更新入力をまとめて書き込む
 * @param inputs - 更新入力
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果と、更新に成功した持ち物
 */
const updateItemsConcurrently = async (
  inputs: readonly ItemUpdateInput[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkWriteOutcome<Item>> => {
  const results = await mapConcurrently(
    inputs,
    updateItemRecord,
    createProgressTicker(inputs.length, onProgress),
  );
  return toBulkWriteOutcome(results);
};

/**
 * カテゴリ内の持ち物の表示順を 0 からの連番にそろえる。値が変わる持ち物だけを更新する
 * @param items - チェックリスト内の全持ち物
 * @param categoryId - 対象のカテゴリID
 * @returns 表示順にそろえたカテゴリ内の持ち物（更新したものは更新後の値）
 * @throws {unknown} 更新に1件でも失敗した場合は最初の失敗理由
 */
const normalizeItemOrder = async (
  items: readonly Item[],
  categoryId: string,
): Promise<Item[]> => {
  const siblings = items
    .filter((item) => item.categoryId === categoryId)
    .sort(compareItemOrder);
  const inputs = siblings.flatMap((item, index) =>
    item.sortOrder === index ? [] : [{ id: item.id, sortOrder: index }],
  );
  const { result, values } = await updateItemsConcurrently(inputs);
  if (result.failureCount > 0) throw result.failureReasons[0];
  return mergeById(siblings, values);
};

/**
 * カテゴリの末尾に持ち物を加える準備をする。カテゴリ内の表示順が0からの連番になっていなければ（未設定・重複・欠番）連番へそろえて書き込み、末尾に付ける表示順を返す
 * @param items - チェックリスト内の全持ち物
 * @param categoryId - 対象のカテゴリID
 * @returns 末尾に付ける表示順（連番にそろえた後のカテゴリ内の件数）と、表示順をそろえたカテゴリ内の持ち物
 * @throws {unknown} 表示順の更新に失敗した場合は最初の失敗理由
 */
export const prepareAppendSortOrder = async (
  items: readonly Item[],
  categoryId: string,
): Promise<{ sortOrder: number; reordered: Item[] }> => {
  const reordered = await normalizeItemOrder(items, categoryId);
  return { sortOrder: reordered.length, reordered };
};

/**
 * 持ち物をカテゴリの末尾に追加する。カテゴリ内の表示順が0からの連番になっていなければ（未設定・重複・欠番）先に連番へそろえる
 * @param input - 作成する持ち物の項目（表示順を除く）
 * @param items - チェックリスト内の全持ち物
 * @returns 作成した持ち物と、表示順をそろえたカテゴリ内の持ち物
 * @throws {UserFacingError} 1日あたりの必要数が範囲外の場合
 * @throws {unknown} 表示順の更新に失敗した場合は最初の失敗理由
 */
export const appendItem = async (
  input: Omit<ItemCreateInput, "isChecked" | "sortOrder">,
  items: readonly Item[],
): Promise<{ created: Item; reordered: Item[] }> => {
  // 表示順をそろえる書き込みの前に入力を検査し、不正な入力で書き込みだけが済むことを防ぐ
  assertValidQuantityPerDay(input.quantityPerDay);
  const { sortOrder, reordered } = await prepareAppendSortOrder(
    items,
    input.categoryId,
  );
  const created = await createItem({ ...input, sortOrder });
  return { created, reordered };
};

/**
 * 持ち物を同じカテゴリ内で1つ上または下の持ち物と入れ替える
 * @param itemId - 動かす持ち物のID
 * @param items - チェックリスト内の全持ち物
 * @param delta - -1 で上へ、1 で下へ
 * @returns 並べ替え後のカテゴリ内の全持ち物（表示順）。端で動かせない場合も連番にそろえた全件
 * @throws {Error} 持ち物が見つからない場合
 * @throws {unknown} 表示順の更新に失敗した場合は最初の失敗理由
 */
export const moveItemOrder = async (
  itemId: string,
  items: readonly Item[],
  delta: -1 | 1,
): Promise<Item[]> => {
  const target = items.find((item) => item.id === itemId);
  if (!target) throw new Error(`持ち物が見つかりません: ${itemId}`);
  const siblings = await normalizeItemOrder(items, target.categoryId);
  const index = siblings.findIndex((item) => item.id === itemId);
  const neighbor = siblings[index + delta];
  if (!neighbor) return siblings;
  const { result, values } = await updateItemsConcurrently([
    { id: itemId, sortOrder: index + delta },
    { id: neighbor.id, sortOrder: index },
  ]);
  if (result.failureCount > 0) throw result.failureReasons[0];
  return mergeById(siblings, values);
};

/**
 * 持ち物をまとめて別のカテゴリの末尾へ移動する（選択した順を保つ）
 * @param targets - 移動する持ち物（表示順）
 * @param categoryId - 移動先のカテゴリID
 * @param items - チェックリスト内の全持ち物
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果（移動の書き込みのみを数える）と、画面に反映すべき持ち物（移動に成功した持ち物と、表示順をそろえた移動先カテゴリの元からの全件。書き込まなかった持ち物も含む）
 * @throws {unknown} 移動先の表示順の更新に失敗した場合は最初の失敗理由
 */
export const moveItemsToCategory = async (
  targets: readonly Item[],
  categoryId: string,
  items: readonly Item[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkWriteOutcome<Item>> => {
  const { sortOrder, reordered } = await prepareAppendSortOrder(
    items,
    categoryId,
  );
  const outcome = await updateItemsConcurrently(
    targets
      .filter((item) => item.categoryId !== categoryId)
      .map((item, index) => ({
        id: item.id,
        categoryId,
        sortOrder: sortOrder + index,
      })),
    onProgress,
  );
  return { ...outcome, values: [...reordered, ...outcome.values] };
};

/**
 * 持ち物にまとめてタグを付ける、または外す。変化のない持ち物は更新しない
 * @param targets - 対象の持ち物
 * @param tagId - タグID
 * @param isAttached - true で付ける、false で外す
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果と、更新に成功した持ち物
 */
export const setTagOnItems = async (
  targets: readonly Item[],
  tagId: string,
  isAttached: boolean,
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkWriteOutcome<Item>> => {
  const inputs = targets.flatMap((item) => {
    const tagIds = getItemTagIds(item);
    if (tagIds.includes(tagId) === isAttached) return [];
    return [
      {
        id: item.id,
        tagIds: isAttached
          ? [...tagIds, tagId]
          : tagIds.filter((id) => id !== tagId),
      },
    ];
  });
  return await updateItemsConcurrently(inputs, onProgress);
};

/**
 * 指定した持ち物をチェック済みに戻す（一括リセットの取り消し）
 * @param itemIds - チェック済みに戻す持ち物のID
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果と、更新に成功した持ち物
 */
export const restoreCheckedItems = async (
  itemIds: readonly string[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkWriteOutcome<Item>> =>
  await updateItemsConcurrently(
    itemIds.map((id) => ({ id, isChecked: true })),
    onProgress,
  );

/**
 * 削除した持ち物を同じ内容（チェック状態・タグ・表示順を含む）で作り直す。IDは新しくなる
 *
 * 削除後に所属カテゴリが消えていれば表示順で先頭のカテゴリへ入れ、消えたタグは外して作り直す。
 * @param deletedItems - 削除した持ち物
 * @param categories - 作り直す時点のカテゴリ（1件以上）
 * @param tags - 作り直す時点のタグ
 * @param onProgress - 進捗の通知先
 * @returns 一括処理の結果と、作り直した持ち物
 * @throws {Error} カテゴリが1件もない場合
 */
export const restoreItems = async (
  deletedItems: readonly Item[],
  categories: readonly Category[],
  tags: readonly Tag[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkWriteOutcome<Item>> => {
  const [firstCategory] = sortCategories(categories);
  if (!firstCategory) throw new Error("作り直し先のカテゴリがありません");
  const categoryIds = new Set(categories.map((category) => category.id));
  const tagIds = new Set(tags.map((tag) => tag.id));
  const results = await mapConcurrently(
    deletedItems,
    (item) =>
      createItemRecord({
        checkListId: item.checkListId,
        categoryId: categoryIds.has(item.categoryId)
          ? item.categoryId
          : firstCategory.id,
        name: item.name,
        quantityPerDay: item.quantityPerDay ?? undefined,
        tagIds: getItemTagIds(item).filter((tagId) => tagIds.has(tagId)),
        isChecked: item.isChecked,
        sortOrder: item.sortOrder,
      }),
    createProgressTicker(deletedItems.length, onProgress),
  );
  return toBulkWriteOutcome(results);
};
