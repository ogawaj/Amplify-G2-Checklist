import type { Dispatch, SetStateAction } from "react";

import type { Category } from "@/src/app/models/category";
import type { CheckList } from "@/src/app/models/check-list";
import type { Item } from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";

/** 読み込み済みのチェックリスト詳細（持ち物・カテゴリ・タグを含む） */
export type CheckListDetail = {
  /** チェックリスト */
  checkList: CheckList;
  /** カテゴリ（取得順） */
  categories: Category[];
  /** タグ */
  tags: Tag[];
  /** 持ち物 */
  items: Item[];
  /** チェックリストを差し替える */
  setCheckList: (checkList: CheckList) => void;
  /** カテゴリを差し替える */
  setCategories: Dispatch<SetStateAction<Category[]>>;
  /** タグを差し替える */
  setTags: Dispatch<SetStateAction<Tag[]>>;
  /** 持ち物を差し替える */
  setItems: Dispatch<SetStateAction<Item[]>>;
  /** 表示を保ったまま全データを再取得する。reject しない。最新の内容を取得できたら true、できなければ false */
  reload: () => Promise<boolean>;
};
