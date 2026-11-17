import type { Category } from "@/src/app/models/category";
import type { Item } from "@/src/app/models/item";

/** カテゴリとその配下の持ち物 */
export type CategoryItemGroup = {
  /** カテゴリ */
  category: Category;
  /** カテゴリに属する持ち物（表示順） */
  items: Item[];
};
