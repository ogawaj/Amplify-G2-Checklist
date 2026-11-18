import type { Category } from "@/src/app/models/category";
import type { CategoryItemGroup } from "@/src/app/models/category-item-group";
import type { Item } from "@/src/app/models/item";
import type { ItemProgress } from "@/src/app/models/item-progress";
import type { TagVisibility } from "@/src/app/models/tag-visibility";
import { sortCategories } from "@/src/app/services/category-service";
import { getItemTagIds, isItemHidden } from "@/src/app/services/item-service";
import { groupBy } from "@/src/app/utils/array-utils";
import { compareBySortOrder } from "@/src/app/utils/sort-utils";

/**
 * 表示から外したタグで持ち物を絞り込む。付いているタグのうち1つでも表示中なら残し、タグのない持ち物は isUntaggedHidden が false なら残す。keptItemIds の持ち物は条件に関わらず残す
 * @param items - 持ち物
 * @param visibility - 表示から外しているタグ
 * @param keptItemIds - 条件に関わらず残す持ち物のID
 * @returns 表示する持ち物
 * @example
 * // 「泊まり」(t1) を外す → 泊まりだけの持ち物は消え、泊まり・調理の持ち物とタグなしは残る
 * filterItemsByTags(items, { hiddenTagIds: ["t1"], isUntaggedHidden: false });
 */
export const filterItemsByTags = (
  items: readonly Item[],
  visibility: TagVisibility,
  keptItemIds: readonly string[] = [],
): Item[] =>
  items.filter((item) => {
    if (keptItemIds.includes(item.id)) return true;
    const tagIds = getItemTagIds(item);
    if (tagIds.length === 0) return !visibility.isUntaggedHidden;
    return tagIds.some((tagId) => !visibility.hiddenTagIds.includes(tagId));
  });

/**
 * 非表示の持ち物を除く
 * @param items - 持ち物
 * @returns 非表示でない持ち物
 */
export const excludeHiddenItems = (items: readonly Item[]): Item[] =>
  items.filter((item) => !isItemHidden(item));

/**
 * 持ち物をカテゴリの表示順にまとめる
 * @param categories - チェックリストの全カテゴリ
 * @param items - 持ち物
 * @param omitEmpty - true の場合、持ち物が0件のカテゴリを結果から除く
 * @returns カテゴリごとの持ち物（持ち物は表示順。{@link compareBySortOrder} の順）
 * @throws {Error} 持ち物の所属カテゴリが categories に存在しない場合
 */
export const groupItemsByCategory = (
  categories: readonly Category[],
  items: readonly Item[],
  omitEmpty: boolean,
): CategoryItemGroup[] => {
  const itemsByCategoryId = groupBy(items, (item) => item.categoryId);
  const categoryIds = new Set(categories.map((category) => category.id));
  itemsByCategoryId.forEach((_, categoryId) => {
    if (!categoryIds.has(categoryId)) {
      throw new Error(`持ち物の所属カテゴリが見つかりません: ${categoryId}`);
    }
  });
  const groups = sortCategories(categories).map((category) => ({
    category,
    items: (itemsByCategoryId.get(category.id) ?? []).sort(compareBySortOrder),
  }));
  return omitEmpty ? groups.filter((group) => group.items.length > 0) : groups;
};

/**
 * 持ち物の準備状況を集計する
 * @param items - 集計対象の持ち物
 * @returns 準備済み件数と総件数
 */
export const summarizeProgress = (items: readonly Item[]): ItemProgress => ({
  checkedCount: items.filter((item) => item.isChecked).length,
  totalCount: items.length,
});
