"use client";

import { useMemo } from "react";

import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { useTagFilter } from "@/src/app/hooks/use-tag-filter";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { Item } from "@/src/app/models/item";
import type { ItemTagLabel } from "@/src/app/models/item-tag-label";
import {
  renameCheckList,
  updateDurationDays,
} from "@/src/app/services/check-list-service";
import {
  filterItemsByTags,
  groupItemsByCategory,
  summarizeProgress,
} from "@/src/app/services/item-filter-service";
import { calculateRequiredQuantity } from "@/src/app/services/item-quantity-service";
import {
  getItemTagIds,
  resetItems,
  restoreCheckedItems,
  updateItem,
} from "@/src/app/services/item-service";
import { keyBy, mergeById } from "@/src/app/utils/array-utils";
import { parseInteger } from "@/src/app/utils/integer-utils";
import { buildItemTagLabel } from "@/src/app/utils/item-tag-label-utils";

/**
 * 準備モードの状態（タグ絞り込み・チェック操作・取り消し付きの一括リセット・日数・名前）を管理するフック
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @param tagFilter - 絞り込みに使うタグの選択状態
 * @returns 表示用に整えた持ち物・件数と各操作
 */
export const useCheckState = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
  tagFilter: ReturnType<typeof useTagFilter>,
) => {
  const { checkList, categories, tags, items, setItems, setCheckList } = detail;
  const { run, reportError, reportPartialFailure, notify, notifyUndoable } =
    feedback;
  const { selectedTagIds } = tagFilter;

  const visibleItems = useMemo(
    () => filterItemsByTags(items, selectedTagIds),
    [items, selectedTagIds],
  );
  const groups = useMemo(
    () => groupItemsByCategory(categories, visibleItems, true),
    [categories, visibleItems],
  );
  const visibleProgress = useMemo(
    () => summarizeProgress(visibleItems),
    [visibleItems],
  );
  const totalProgress = useMemo(() => summarizeProgress(items), [items]);
  const tagsById = useMemo(() => keyBy(tags, (tag) => tag.id), [tags]);
  const selectedTagNames = selectedTagIds.flatMap(
    (tagId) => tagsById.get(tagId)?.name ?? [],
  );

  const isFiltered = selectedTagIds.length > 0;
  const remainingCount =
    visibleProgress.totalCount - visibleProgress.checkedCount;
  const isAllDone = visibleProgress.totalCount > 0 && remainingCount === 0;
  const checkedCount = totalProgress.checkedCount;
  const hiddenCheckedCount = checkedCount - visibleProgress.checkedCount;
  const resetLabel =
    isFiltered && hiddenCheckedCount > 0
      ? `チェックを外す（${checkedCount}件・隠れている${hiddenCheckedCount}件を含む）`
      : `チェックを外す（${checkedCount}件）`;

  const getRequiredQuantity = (item: Item): number | null =>
    calculateRequiredQuantity(item.quantityPerDay, checkList.durationDays);

  const getTagLabel = (item: Item): ItemTagLabel | null =>
    buildItemTagLabel(getItemTagIds(item), tagsById, selectedTagIds);

  const replaceItemChecked = (itemId: string, isChecked: boolean) =>
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, isChecked } : item,
      ),
    );

  const toggleChecked = async (item: Item): Promise<void> => {
    const next = !item.isChecked;
    replaceItemChecked(item.id, next);
    const isSaved = await run(async () => {
      await updateItem({ id: item.id, isChecked: next });
    }, "チェックを保存できませんでした");
    if (!isSaved) replaceItemChecked(item.id, !next);
  };

  const undoReset = async (itemIds: string[]): Promise<void> => {
    await run(
      async () =>
        await feedback.trackProgress("元に戻し中", async (onProgress) => {
          const { result, values } = await restoreCheckedItems(
            itemIds,
            onProgress,
          );
          setItems((current) => mergeById(current, values));
          if (result.failureCount === 0) return;
          const isReloaded = await detail.reload();
          reportPartialFailure(
            `${result.failureCount}件のチェックを戻せませんでした`,
            isReloaded,
          );
        }),
      "元に戻せませんでした",
    );
  };

  const resetAll = async (): Promise<void> => {
    const checkedItemIds = items
      .filter((item) => item.isChecked)
      .map((item) => item.id);
    if (checkedItemIds.length === 0) return;
    await run(
      async () =>
        await feedback.trackProgress("リセット中", async (onProgress) => {
          const result = await resetItems(items, onProgress);
          if (result.failureCount === 0) {
            setItems((current) =>
              current.map((item) => ({ ...item, isChecked: false })),
            );
            notifyUndoable(
              `${checkedItemIds.length}件のチェックを外しました`,
              () => void undoReset(checkedItemIds),
            );
            return;
          }
          const isReloaded = await detail.reload();
          reportPartialFailure(
            `${result.failureCount}件のチェックを外せませんでした。もう一度お試しください`,
            isReloaded,
          );
        }),
      "一括リセットできませんでした",
    );
  };

  const changeDurationDays = async (text: string): Promise<boolean> => {
    const durationDays = parseInteger(text);
    if (durationDays === null) {
      reportError("日数は整数で指定してください");
      return false;
    }
    const previous = checkList;
    if (durationDays === previous.durationDays) return true;
    setCheckList({ ...previous, durationDays });
    const isSaved = await run(async () => {
      await updateDurationDays(previous.id, durationDays);
    }, "日数を保存できませんでした");
    if (!isSaved) setCheckList(previous);
    return isSaved;
  };

  const stepDurationDays = async (delta: -1 | 1): Promise<void> => {
    await changeDurationDays(String(checkList.durationDays + delta));
  };

  const renameList = async (name: string): Promise<boolean> => {
    const previous = checkList;
    setCheckList({ ...previous, name });
    const isSaved = await run(async () => {
      await renameCheckList(previous.id, name);
    }, "名前を変更できませんでした");
    if (isSaved) {
      notify("名前を変更しました");
    } else {
      setCheckList(previous);
    }
    return isSaved;
  };

  return {
    groups,
    selectedTagNames,
    isFiltered,
    remainingCount,
    isAllDone,
    checkedCount,
    resetLabel,
    getRequiredQuantity,
    getTagLabel,
    toggleChecked,
    resetAll,
    changeDurationDays,
    stepDurationDays,
    renameList,
  };
};
