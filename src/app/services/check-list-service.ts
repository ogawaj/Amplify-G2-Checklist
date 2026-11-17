import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import type { BulkProgress, BulkResult } from "@/src/app/models/bulk-result";
import type { CheckList } from "@/src/app/models/check-list";
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
import { compareByCreatedAt } from "@/src/app/utils/sort-utils";

/** 新規作成時に用意する既定カテゴリの名称 */
const DEFAULT_CATEGORY_NAME = "未分類";

/** 複製したチェックリスト名に付ける接尾辞 */
const DUPLICATE_NAME_SUFFIX = "のコピー";

/** 日数が範囲外のときの文言 */
const DURATION_DAYS_RANGE_MESSAGE = `日数は${CHECK_LIST_LIMIT.DURATION_DAYS_MIN}〜${CHECK_LIST_LIMIT.DURATION_DAYS_MAX}の整数で指定してください`;

/**
 * 所有者のチェックリストを作成日時の昇順で取得する
 * @returns チェックリスト一覧
 */
export const listCheckLists = async (): Promise<CheckList[]> => {
  return (await listCheckListRecords()).sort(compareByCreatedAt);
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
 * 日数1のチェックリストを、既定カテゴリ付きで作成する。
 * 既定カテゴリの作成に失敗した場合は作成済みの本体の削除を試み（削除の失敗は無視する）、カテゴリ作成時のエラーを投げる
 * @param name - チェックリスト名
 * @returns 作成したチェックリスト
 * @throws {unknown} 本体または既定カテゴリの作成に失敗した場合（既定カテゴリの失敗時は元のエラー）
 */
export const createCheckList = async (name: string): Promise<CheckList> => {
  const checkList = await createCheckListRecord({
    name: name.trim(),
    durationDays: CHECK_LIST_LIMIT.DURATION_DAYS_MIN,
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
 * チェックリストをカテゴリ・タグ・持ち物ごと複製する。複製した持ち物はすべて未チェックになる
 *
 * 新しいチェックリストの作成、カテゴリ・タグの作成、持ち物の作成を順に行い、各段階内は並列に実行する。
 * 一部の作成が失敗しても成功分は残る。失敗したカテゴリ・タグに依存する持ち物は失敗として数える。
 * @param sourceId - 複製元のチェックリストID
 * @param onProgress - 進捗の通知先（総件数はカテゴリ・タグ・持ち物の合計）
 * @returns 作成したチェックリストと、配下の複製結果
 * @throws {Error} 複製元が存在しない場合
 * @throws {unknown} 複製元の一括取得、またはチェックリスト本体の作成に失敗した場合
 */
export const duplicateCheckList = async (
  sourceId: string,
  onProgress?: (progress: BulkProgress) => void,
): Promise<{ checkList: CheckList; result: BulkResult }> => {
  const [source, categories, tags, items] = await Promise.all([
    getCheckListById(sourceId),
    listCategories(sourceId),
    listTags(sourceId),
    listItems(sourceId),
  ]);
  if (!source) {
    throw new Error(`チェックリストが見つかりません: ${sourceId}`);
  }

  const checkList = await createCheckListRecord({
    name: `${source.name}${DUPLICATE_NAME_SUFFIX}`,
    durationDays: source.durationDays,
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
    (tag) => () => createTag({ checkListId: checkList.id, name: tag.name }),
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
