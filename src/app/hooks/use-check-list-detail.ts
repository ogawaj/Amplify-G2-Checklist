"use client";

import { useCallback, useEffect, useState } from "react";

import type { Category } from "@/src/app/models/category";
import type { CheckList } from "@/src/app/models/check-list";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { Item } from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";
import { listCategories } from "@/src/app/services/category-service";
import { getCheckList } from "@/src/app/services/check-list-service";
import { listItems } from "@/src/app/services/item-service";
import { listTags } from "@/src/app/services/tag-service";
import { isValidListId } from "@/src/app/utils/list-path-utils";

/** 読み込み失敗時の文言 */
const LOAD_ERROR_MESSAGE = "チェックリストを読み込めませんでした";

/** チェックリストが存在しないときの文言 */
const NOT_FOUND_MESSAGE = "チェックリストが見つかりません";

/** 読み込みの状態 */
type CheckListDetailState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "loaded"; detail: CheckListDetail };

/**
 * チェックリストの持ち物・カテゴリ・タグを一括で読み込み、保持するフック
 * @param listId - チェックリストID
 * @returns 読み込み中（loading）・失敗（error。固定の文言付き）・完了（loaded。詳細付き）のいずれか
 */
export const useCheckListDetail = (listId: string): CheckListDetailState => {
  const [checkList, setCheckList] = useState<CheckList | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    const [fetchedCheckList, fetchedCategories, fetchedTags, fetchedItems] =
      await Promise.all([
        getCheckList(listId),
        listCategories(listId),
        listTags(listId),
        listItems(listId),
      ]);
    if (fetchedCheckList === null) {
      setLoadError(NOT_FOUND_MESSAGE);
      return;
    }
    setCheckList(fetchedCheckList);
    setCategories(fetchedCategories);
    setTags(fetchedTags);
    setItems(fetchedItems);
  }, [listId]);

  const reload = useCallback(async (): Promise<boolean> => {
    try {
      await fetchAll();
      return true;
    } catch {
      return false;
    }
  }, [fetchAll]);

  const isListIdValid = isValidListId(listId);

  useEffect(() => {
    if (!isListIdValid) return;
    let isCancelled = false;
    const load = async () => {
      try {
        await fetchAll();
      } catch {
        if (!isCancelled) setLoadError(LOAD_ERROR_MESSAGE);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    };
    void load();
    return () => {
      isCancelled = true;
    };
  }, [fetchAll, isListIdValid]);

  if (!isListIdValid) return { status: "error", message: NOT_FOUND_MESSAGE };
  if (loadError !== null) return { status: "error", message: loadError };
  if (isLoading || checkList === null) return { status: "loading" };
  return {
    status: "loaded",
    detail: {
      checkList,
      categories,
      tags,
      items,
      setCheckList,
      setCategories,
      setTags,
      setItems,
      reload,
    },
  };
};
