import type { CategoryDeleteBlocker } from "@/src/app/enums/category-delete-blocker";
import { CATEGORY_DELETE_BLOCKER } from "@/src/app/enums/category-delete-blocker";
import type { CategoryMoveDirection } from "@/src/app/enums/category-move-direction";
import { CATEGORY_MOVE_DIRECTION } from "@/src/app/enums/category-move-direction";
import type { Category } from "@/src/app/models/category";
import type { Item } from "@/src/app/models/item";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  createCategory as createCategoryRecord,
  deleteCategory as deleteCategoryRecord,
  listCategories as listCategoryRecords,
  updateCategory as updateCategoryRecord,
} from "@/src/app/repositories/category-repository";
import { isNameTaken } from "@/src/app/utils/name-utils";

/**
 * カテゴリを表示順の昇順に並べる
 * @param categories - カテゴリ
 * @returns 表示順の昇順に並べた新しい配列（同順はIDの昇順）
 */
export const sortCategories = (categories: readonly Category[]): Category[] =>
  [...categories].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id),
  );

/**
 * チェックリストのカテゴリを表示順で取得する
 * @param checkListId - チェックリストID
 * @returns カテゴリ一覧
 */
export const listCategories = async (
  checkListId: string,
): Promise<Category[]> => {
  return sortCategories(await listCategoryRecords(checkListId));
};

/**
 * カテゴリを末尾に追加する
 * @param checkListId - チェックリストID
 * @param name - カテゴリ名
 * @param categories - チェックリストの既存カテゴリ
 * @returns 作成したカテゴリ
 * @throws {UserFacingError} カテゴリ名が重複する場合
 */
export const createCategory = async (
  checkListId: string,
  name: string,
  categories: readonly Category[],
): Promise<Category> => {
  if (isNameTaken(categories, name)) {
    throw new UserFacingError("同じ名前のカテゴリが既にあります");
  }
  const lastSortOrder = Math.max(-1, ...categories.map((c) => c.sortOrder));
  return await createCategoryRecord({
    checkListId,
    name: name.trim(),
    sortOrder: lastSortOrder + 1,
  });
};

/**
 * カテゴリ名を変更する
 * @param categoryId - 対象のカテゴリID
 * @param name - 新しい名称
 * @param categories - チェックリストの既存カテゴリ
 * @returns 更新後のカテゴリ
 * @throws {UserFacingError} カテゴリ名が他のカテゴリと重複する場合
 */
export const renameCategory = async (
  categoryId: string,
  name: string,
  categories: readonly Category[],
): Promise<Category> => {
  if (isNameTaken(categories, name, categoryId)) {
    throw new UserFacingError("同じ名前のカテゴリが既にあります");
  }
  return await updateCategoryRecord({ id: categoryId, name: name.trim() });
};

/**
 * カテゴリを1つ上または下に移動し、表示順を保存する
 * @param categories - チェックリストの全カテゴリ
 * @param categoryId - 移動するカテゴリID
 * @param direction - 移動方向
 * @returns 移動後の全カテゴリ（表示順は 0 からの連番に振り直される）。端で動かせない場合は入力を表示順に並べたもの
 * @throws {Error} 対象のカテゴリが存在しない場合
 */
export const moveCategory = async (
  categories: readonly Category[],
  categoryId: string,
  direction: CategoryMoveDirection,
): Promise<Category[]> => {
  const sorted = sortCategories(categories);
  const from = sorted.findIndex((category) => category.id === categoryId);
  if (from === -1) {
    throw new Error(`カテゴリが見つかりません: ${categoryId}`);
  }
  const to = direction === CATEGORY_MOVE_DIRECTION.UP ? from - 1 : from + 1;
  if (to < 0 || to >= sorted.length) return sorted;

  const reordered = [...sorted];
  [reordered[from], reordered[to]] = [reordered[to], reordered[from]];
  return await Promise.all(
    reordered.map((category, sortOrder) =>
      category.sortOrder === sortOrder
        ? category
        : updateCategoryRecord({ id: category.id, sortOrder }),
    ),
  );
};

const CATEGORY_DELETE_BLOCKER_MESSAGE: Record<CategoryDeleteBlocker, string> = {
  [CATEGORY_DELETE_BLOCKER.HAS_ITEMS]:
    "所属する持ち物があるカテゴリは削除できません",
  [CATEGORY_DELETE_BLOCKER.LAST_CATEGORY]:
    "最後の1件のカテゴリは削除できません",
};

/**
 * カテゴリを削除できない理由を返す。
 * 所属する持ち物がある場合は HAS_ITEMS、持ち物がなくチェックリストに残る最後の1件の場合は LAST_CATEGORY、削除できる場合は null を返す。
 * 両方に該当する場合は HAS_ITEMS を返す
 * @param categoryId - カテゴリID
 * @param categories - チェックリストの全カテゴリ
 * @param items - チェックリストの全持ち物
 * @returns 削除できない理由。削除できる場合は null
 * @example
 * // カテゴリ a, b があり、b にだけ持ち物がある場合
 * getCategoryDeleteBlocker("a", [a, b], items); // null
 * getCategoryDeleteBlocker("b", [a, b], items); // CATEGORY_DELETE_BLOCKER.HAS_ITEMS
 * // カテゴリ a のみで持ち物がない場合
 * getCategoryDeleteBlocker("a", [a], []); // CATEGORY_DELETE_BLOCKER.LAST_CATEGORY
 */
export const getCategoryDeleteBlocker = (
  categoryId: string,
  categories: readonly Pick<Category, "id">[],
  items: readonly Pick<Item, "categoryId">[],
): CategoryDeleteBlocker | null => {
  if (items.some((item) => item.categoryId === categoryId)) {
    return CATEGORY_DELETE_BLOCKER.HAS_ITEMS;
  }
  if (categories.every((category) => category.id === categoryId)) {
    return CATEGORY_DELETE_BLOCKER.LAST_CATEGORY;
  }
  return null;
};

/**
 * カテゴリを削除する
 * @param categoryId - カテゴリID
 * @param categories - チェックリストの全カテゴリ
 * @param items - チェックリストの全持ち物
 * @throws {UserFacingError} {@link getCategoryDeleteBlocker} が理由を返す場合（理由ごとの文言）
 */
export const deleteCategory = async (
  categoryId: string,
  categories: readonly Pick<Category, "id">[],
  items: readonly Pick<Item, "categoryId">[],
): Promise<void> => {
  const blocker = getCategoryDeleteBlocker(categoryId, categories, items);
  if (blocker) {
    throw new UserFacingError(CATEGORY_DELETE_BLOCKER_MESSAGE[blocker]);
  }
  await deleteCategoryRecord(categoryId);
};

/**
 * 削除したカテゴリを同じ名前・表示順で作り直す（削除の取り消し）。IDは新しくなる
 * @param category - 削除したカテゴリ
 * @returns 作り直したカテゴリ
 */
export const restoreCategory = async (category: Category): Promise<Category> =>
  await createCategoryRecord({
    checkListId: category.checkListId,
    name: category.name,
    sortOrder: category.sortOrder,
  });
