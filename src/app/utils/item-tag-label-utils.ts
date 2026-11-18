import type { Tag } from "@/src/app/models/tag";

/**
 * 持ち物の行に出すタグの表示を組み立てる。付いているタグの名前をタグの表示順に「・」でつなぐ
 * @param itemTagIds - 持ち物に付いているタグのID
 * @param sortedTags - チェックリストの全タグ（表示順）
 * @returns タグの表示。タグがなければ null
 * @throws {Error} 持ち物に付いているタグが sortedTags にない場合
 */
export const buildItemTagLabel = (
  itemTagIds: readonly string[],
  sortedTags: readonly Pick<Tag, "id" | "name">[],
): string | null => {
  if (itemTagIds.length === 0) return null;
  const attached = sortedTags.filter((tag) => itemTagIds.includes(tag.id));
  if (attached.length !== new Set(itemTagIds).size) {
    const missing = itemTagIds.filter(
      (id) => !attached.some((tag) => tag.id === id),
    );
    throw new Error(`タグが見つかりません: ${missing.join(", ")}`);
  }
  return attached.map((tag) => tag.name).join("・");
};
