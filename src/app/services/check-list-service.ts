import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import type { BulkProgress, BulkResult } from "@/src/app/models/bulk-result";
import type { CheckList } from "@/src/app/models/check-list";
import type { Tag } from "@/src/app/models/tag";
import type { TagVisibility } from "@/src/app/models/tag-visibility";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  createCategory,
  deleteCategory,
  listCategories,
} from "@/src/app/repositories/category-repository";
import {
  createCheckList as createCheckListRecord,
  deleteCheckList as deleteCheckListRecord,
  getCheckListById,
  listCheckLists as listCheckListRecords,
  updateCheckList,
} from "@/src/app/repositories/check-list-repository";
import { deleteItem, listItems } from "@/src/app/repositories/item-repository";
import {
  createTag,
  deleteTag,
  listTags,
} from "@/src/app/repositories/tag-repository";
import {
  createProgressTicker,
  mapConcurrently,
  toBulkResult,
} from "@/src/app/services/concurrency-service";
import { createItem, getItemTagIds } from "@/src/app/services/item-service";
import { listTags as listSortedTags } from "@/src/app/services/tag-service";
import {
  assignSequentialOrder,
  compareBySortOrder,
  moveToPosition,
  nextSortOrder,
  saveSequentialOrder,
} from "@/src/app/utils/sort-utils";

/** 新規作成時に用意する既定カテゴリの名称 */
const DEFAULT_CATEGORY_NAME = "未分類";

/** 複製したチェックリスト名に付ける接尾辞 */
const DUPLICATE_NAME_SUFFIX = "のコピー";

/** 日数が範囲外のときの文言 */
const DURATION_DAYS_RANGE_MESSAGE = `日数は${CHECK_LIST_LIMIT.DURATION_DAYS_MIN}〜${CHECK_LIST_LIMIT.DURATION_DAYS_MAX}の整数で指定してください`;

/**
 * チェックリストを表示順に並べる（{@link compareBySortOrder} の順）
 * @param checkLists - チェックリスト
 * @returns 表示順に並べたチェックリスト（新しい配列）
 */
const sortCheckLists = (checkLists: readonly CheckList[]): CheckList[] =>
  [...checkLists].sort(compareBySortOrder);

/**
 * 所有者のチェックリストを表示順で取得する（{@link compareBySortOrder} の順）
 * @returns チェックリスト一覧
 */
export const listCheckLists = async (): Promise<CheckList[]> => {
  return sortCheckLists(await listCheckListRecords());
};

/**
 * チェックリストを1件取得する
 * @param id - チェックリストID
 * @returns チェックリスト。存在しない場合は null
 */
export const getCheckList = async (id: string): Promise<CheckList | null> => {
  return await getCheckListById(id);
};

/**
 * 日数1のチェックリストを、既定カテゴリ付きで一覧の末尾に作成する（表示順は {@link nextSortOrder} で決める）。
 * 既定カテゴリの作成に失敗した場合は作成済みの本体の削除を試み（削除の失敗は無視する）、カテゴリ作成時のエラーを投げる
 * @param name - チェックリスト名
 * @param checkLists - 既存のチェックリスト
 * @returns 作成したチェックリスト
 * @throws {unknown} 本体または既定カテゴリの作成に失敗した場合（既定カテゴリの失敗時は元のエラー）
 */
export const createCheckList = async (
  name: string,
  checkLists: readonly Pick<CheckList, "sortOrder">[],
): Promise<CheckList> => {
  const checkList = await createCheckListRecord({
    name: name.trim(),
    durationDays: CHECK_LIST_LIMIT.DURATION_DAYS_MIN,
    sortOrder: nextSortOrder(checkLists),
  });
  try {
    await createCategory({
      checkListId: checkList.id,
      name: DEFAULT_CATEGORY_NAME,
      sortOrder: 0,
    });
  } catch (error) {
    await deleteCheckListRecord(checkList.id).catch(() => undefined);
    throw error;
  }
  return checkList;
};

/**
 * チェックリスト名を変更する
 * @param id - チェックリストID
 * @param name - 新しい名称
 * @returns 更新後のチェックリスト
 */
export const renameCheckList = async (
  id: string,
  name: string,
): Promise<CheckList> => {
  return await updateCheckList({ id, name: name.trim() });
};

/**
 * チェックリストの日数を変更する
 * @param id - チェックリストID
 * @param durationDays - 新しい日数
 * @returns 更新後のチェックリスト
 * @throws {UserFacingError} 日数が範囲外の場合
 */
export const updateDurationDays = async (
  id: string,
  durationDays: number,
): Promise<CheckList> => {
  if (
    !Number.isInteger(durationDays) ||
    durationDays < CHECK_LIST_LIMIT.DURATION_DAYS_MIN ||
    durationDays > CHECK_LIST_LIMIT.DURATION_DAYS_MAX
  ) {
    throw new UserFacingError(DURATION_DAYS_RANGE_MESSAGE);
  }
  return await updateCheckList({ id, durationDays });
};

/**
 * チェックリストを別のチェックリストの位置へ動かしたときの並びを求める（保存はしない。並び方は {@link moveToPosition} のとおり）
 * @param checkLists - 全チェックリスト
 * @param checkListId - 動かすチェックリストID
 * @param targetCheckListId - 移動先にあるチェックリストID
 * @returns 移動後の全チェックリスト（表示順は0からの連番に振り直す）
 * @throws {Error} どちらかのチェックリストが存在しない場合
 */
export const planCheckListMove = (
  checkLists: readonly CheckList[],
  checkListId: string,
  targetCheckListId: string,
): (CheckList & { sortOrder: number })[] =>
  assignSequentialOrder(
    moveToPosition(sortCheckLists(checkLists), checkListId, targetCheckListId),
  );

/**
 * チェックリストを別のチェックリストの位置へ動かし、表示順を保存する（{@link planCheckListMove} の並びにする）
 * @param checkLists - 全チェックリスト
 * @param checkListId - 動かすチェックリストID
 * @param targetCheckListId - 移動先にあるチェックリストID
 * @returns 移動後の全チェックリスト（表示順は0からの連番に振り直す）
 * @throws {Error} どちらかのチェックリストが存在しない場合
 * @throws {unknown} 表示順の書き込みに失敗した場合（{@link saveSequentialOrder}。一部だけ書き込まれていることがある）
 */
export const moveCheckList = async (
  checkLists: readonly CheckList[],
  checkListId: string,
  targetCheckListId: string,
): Promise<CheckList[]> =>
  await saveSequentialOrder(
    planCheckListMove(checkLists, checkListId, targetCheckListId),
    checkLists,
    updateCheckList,
  );

/**
 * チェックリストに保存された絞り込みの状態を取り出す。未設定の項目はすべて表示（外したものなし）として扱う
 * @param checkList - チェックリスト
 * @returns 表示から外しているタグ
 */
export const getTagVisibility = (
  checkList: Pick<CheckList, "hiddenTagIds" | "isUntaggedHidden">,
): TagVisibility => ({
  hiddenTagIds: checkList.hiddenTagIds ?? [],
  isUntaggedHidden: checkList.isUntaggedHidden ?? false,
});

/**
 * 絞り込みの状態から、存在しないタグ（削除済み）のIDを除く
 * @param visibility - 表示から外しているタグ
 * @param tags - チェックリストに存在するタグ
 * @returns 存在するタグのIDだけを残した状態
 */
export const pruneTagVisibility = (
  visibility: TagVisibility,
  tags: readonly Pick<Tag, "id">[],
): TagVisibility => {
  const tagIds = new Set(tags.map((tag) => tag.id));
  return {
    ...visibility,
    hiddenTagIds: visibility.hiddenTagIds.filter((id) => tagIds.has(id)),
  };
};

/**
 * チェックリストに絞り込みの状態を保存する
 * @param id - チェックリストID
 * @param visibility - 表示から外しているタグ
 * @returns 更新後のチェックリスト
 */
export const updateTagVisibility = async (
  id: string,
  visibility: TagVisibility,
): Promise<CheckList> => {
  return await updateCheckList({
    id,
    hiddenTagIds: [...visibility.hiddenTagIds],
    isUntaggedHidden: visibility.isUntaggedHidden,
  });
};

/**
 * チェックリストをカテゴリ・タグ・持ち物ごと複製する。複製した持ち物はすべて未チェックになり、絞り込みはすべて表示の状態になる。
 * タグの表示順は0からの連番にそろえて引き継ぐ。
 *
 * 新しいチェックリストの作成、カテゴリ・タグの作成、持ち物の作成を順に行い、各段階内は並列に実行する。
 * 一部の作成が失敗しても成功分は残る。失敗したカテゴリ・タグに依存する持ち物は失敗として数える。
 * 複製したチェックリストは一覧の末尾に置く（表示順は {@link nextSortOrder} で決める）。
 * @param sourceId - 複製元のチェックリストID
 * @param checkLists - 既存のチェックリスト
 * @param onProgress - 進捗の通知先（総件数はカテゴリ・タグ・持ち物の合計）
 * @returns 作成したチェックリストと、配下の複製結果
 * @throws {Error} 複製元が存在しない場合
 * @throws {unknown} 複製元の一括取得、またはチェックリスト本体の作成に失敗した場合
 */
export const duplicateCheckList = async (
  sourceId: string,
  checkLists: readonly Pick<CheckList, "sortOrder">[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<{ checkList: CheckList; result: BulkResult }> => {
  const [source, categories, tags, items] = await Promise.all([
    getCheckListById(sourceId),
    listCategories(sourceId),
    listSortedTags(sourceId),
    listItems(sourceId),
  ]);
  if (!source) {
    throw new Error(`チェックリストが見つかりません: ${sourceId}`);
  }

  const checkList = await createCheckListRecord({
    name: `${source.name}${DUPLICATE_NAME_SUFFIX}`,
    durationDays: source.durationDays,
    sortOrder: nextSortOrder(checkLists),
  });

  const tick = createProgressTicker(
    categories.length + tags.length + items.length,
    onProgress,
  );
  const categoryWrites = categories.map(
    (category) => () =>
      createCategory({
        checkListId: checkList.id,
        name: category.name,
        sortOrder: category.sortOrder,
      }),
  );
  const tagWrites = tags.map(
    (tag, sortOrder) => () =>
      createTag({ checkListId: checkList.id, name: tag.name, sortOrder }),
  );
  const parentResults = await mapConcurrently(
    [...categoryWrites, ...tagWrites],
    (write) => write(),
    tick,
  );
  const categoryResults = parentResults.slice(0, categories.length);
  const tagResults = parentResults.slice(categories.length);

  const newCategoryIds = new Map<string, string>();
  const newTagIds = new Map<string, string>();
  categoryResults.forEach((categoryResult, index) => {
    if (categoryResult.status === "fulfilled") {
      newCategoryIds.set(categories[index].id, categoryResult.value.id);
    }
  });
  tagResults.forEach((tagResult, index) => {
    if (tagResult.status === "fulfilled") {
      newTagIds.set(tags[index].id, tagResult.value.id);
    }
  });

  const itemResults = await mapConcurrently(
    items,
    async (item) => {
      const categoryId = newCategoryIds.get(item.categoryId);
      const tagIds = getItemTagIds(item).map((tagId) => newTagIds.get(tagId));
      if (categoryId === undefined || tagIds.includes(undefined)) {
        throw new Error(`持ち物の複製先が作成できませんでした: ${item.id}`);
      }
      return await createItem({
        checkListId: checkList.id,
        categoryId,
        name: item.name,
        quantityPerDay: item.quantityPerDay ?? undefined,
        tagIds: tagIds.filter((tagId): tagId is string => tagId !== undefined),
        sortOrder: item.sortOrder,
        isHidden: item.isHidden,
      });
    },
    tick,
  );

  return {
    checkList,
    result: toBulkResult([...categoryResults, ...tagResults, ...itemResults]),
  };
};

/**
 * チェックリストを配下の持ち物・タグ・カテゴリごと削除する
 *
 * 持ち物、タグとカテゴリ、本体の順に段階を分けて削除し、各段階内は並列に実行する。
 * ある段階に1件でも失敗があれば次の段階へ進まずその時点の結果を返す（持ち物が残ったままカテゴリを消さないため）。
 * 結果の failureCount が 0 のときだけ本体まで削除済み。
 * @param id - チェックリストID
 * @param onProgress - 進捗の通知先（総件数は配下の件数に本体の1件を加えた数）
 * @returns 一括処理の結果
 */
export const deleteCheckList = async (
  id: string,
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkResult> => {
  const [categories, tags, items] = await Promise.all([
    listCategories(id),
    listTags(id),
    listItems(id),
  ]);
  const tick = createProgressTicker(
    items.length + tags.length + categories.length + 1,
    onProgress,
  );

  const itemResults = await mapConcurrently(
    items,
    (item) => deleteItem(item.id),
    tick,
  );
  if (itemResults.some((r) => r.status === "rejected")) {
    return toBulkResult(itemResults);
  }

  const parentDeletes = [
    ...tags.map((tag) => () => deleteTag(tag.id)),
    ...categories.map((category) => () => deleteCategory(category.id)),
  ];
  const parentResults = await mapConcurrently(
    parentDeletes,
    (remove) => remove(),
    tick,
  );
  const childResults = [...itemResults, ...parentResults];
  if (parentResults.some((r) => r.status === "rejected")) {
    return toBulkResult(childResults);
  }

  const bodyResults = await mapConcurrently(
    [id],
    (checkListId) => deleteCheckListRecord(checkListId),
    tick,
  );
  return toBulkResult([...childResults, ...bodyResults]);
};
