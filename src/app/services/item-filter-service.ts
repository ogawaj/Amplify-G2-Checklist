import type { Category } from "@/src/app/models/category";
import type { CategoryItemGroup } from "@/src/app/models/category-item-group";
import type { Item } from "@/src/app/models/item";
import type { ItemProgress } from "@/src/app/models/item-progress";
import { sortCategories } from "@/src/app/services/category-service";
import { getItemTagIds } from "@/src/app/services/item-service";
import { groupBy } from "@/src/app/utils/array-utils";
import { compareItemOrder } from "@/src/app/utils/sort-utils";

/**
 * 選択されたタグで持ち物を絞り込む。タグを持たない持ち物は常に残る
 * @param items - 持ち物
 * @param selectedTagIds - 選択中のタグID。空の場合は絞り込まない
 * @returns 選択したいずれかのタグを持つ持ち物とタグなしの持ち物
 */
export const filterItemsByTags = (
  items: readonly Item[],
  selectedTagIds: readonly string[],
): Item[] => {
  if (selectedTagIds.length === 0) return [...items];
  return items.filter((item) => {
    const tagIds = getItemTagIds(item);
    return (
      tagIds.length === 0 ||
      tagIds.some((tagId) => selectedTagIds.includes(tagId))
    );
  });
};

/**
 * 持ち物をカテゴリの表示順にまとめる
 * @param categories - チェックリストの全カテゴリ
 * @param items - 持ち物
 * @param omitEmpty - true の場合、持ち物が0件のカテゴリを結果から除く
 * @returns カテゴリごとの持ち物（持ち物は表示順。{@link compareItemOrder} の順）
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
    items: (itemsByCategoryId.get(category.id) ?? []).sort(compareItemOrder),
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
