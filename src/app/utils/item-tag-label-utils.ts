import type { ItemTagLabel } from "@/src/app/models/item-tag-label";
import type { Tag } from "@/src/app/models/tag";

/**
 * 持ち物の行に出すタグの表示を組み立てる（UI上ではタグを「行き先」と呼ぶ）
 *
 * 絞り込みなしでは付いているタグをすべて出す。絞り込み中は、タグなしの持ち物を「共通」、
 * 選んでいるタグ以外が付いている持ち物をそのタグに「にも」を添えて出し、それ以外は出さない。
 * @param itemTagIds - 持ち物に付いているタグのID
 * @param tagsById - タグIDからタグを引く Map
 * @param selectedTagIds - 絞り込みに選んでいるタグのID（空なら絞り込みなし）
 * @returns タグの表示。出すものがなければ null
 * @throws {Error} 持ち物に付いているタグが tagsById にない場合
 */
export const buildItemTagLabel = (
  itemTagIds: readonly string[],
  tagsById: ReadonlyMap<string, Pick<Tag, "name">>,
  selectedTagIds: readonly string[],
): ItemTagLabel | null => {
  const joinNames = (tagIds: readonly string[]) =>
    tagIds
      .map((id) => {
        const tag = tagsById.get(id);
        if (!tag) throw new Error(`タグが見つかりません: ${id}`);
        return tag.name;
      })
      .join("・");
  if (selectedTagIds.length === 0) {
    return itemTagIds.length > 0
      ? { text: joinNames(itemTagIds), isCommon: false }
      : null;
  }
  if (itemTagIds.length === 0) return { text: "共通", isCommon: true };
  const otherTagIds = itemTagIds.filter((id) => !selectedTagIds.includes(id));
  return otherTagIds.length > 0
    ? { text: `${joinNames(otherTagIds)}にも`, isCommon: false }
    : null;
};
