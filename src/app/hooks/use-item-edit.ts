"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { Category } from "@/src/app/models/category";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { Item, ItemUpdateInput } from "@/src/app/models/item";
import type { ItemTagLabel } from "@/src/app/models/item-tag-label";
import type { Tag } from "@/src/app/models/tag";
import { groupItemsByCategory } from "@/src/app/services/item-filter-service";
import {
  appendItem,
  deleteItems,
  getItemTagIds,
  moveItemOrder,
  moveItemsToCategory,
  restoreItems,
  setTagOnItems,
  updateItem,
} from "@/src/app/services/item-service";
import { keyBy, mergeById } from "@/src/app/utils/array-utils";
import { parseInteger } from "@/src/app/utils/integer-utils";
import { buildItemTagLabel } from "@/src/app/utils/item-tag-label-utils";

/** 追加した持ち物の行を強調しておく時間（ミリ秒）。追加した行を目で追えるよう1秒強にする */
const HIGHLIGHT_MS = 1200;

/** 持ち物の変更を保存したときの通知の文言 */
const SAVED_MESSAGE = "保存しました";

/**
 * 編集モードの状態（選択・追加・項目の編集・並べ替え・一括操作・取り消し付きの削除）を管理するフック
 *
 * 編集モードは絞り込みを使わず、空のカテゴリを含む全件を扱う。
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @returns 表示用に整えた持ち物・選択状態と各操作
 */
export const useItemEdit = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
) => {
  const { checkList, categories, tags, items, setItems } = detail;
  const {
    run,
    reportError,
    reportPartialFailure,
    notify,
    notifyUndoable,
    trackProgress,
  } = feedback;
  const [checkedItemIds, setCheckedItemIds] = useState<string[]>([]);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(
    null,
  );
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (highlightTimerRef.current !== null) {
        clearTimeout(highlightTimerRef.current);
      }
    },
    [],
  );

  const groups = useMemo(
    () => groupItemsByCategory(categories, items, false),
    [categories, items],
  );
  const tagsById = useMemo(() => keyBy(tags, (tag) => tag.id), [tags]);
  const selectedItems = useMemo(
    () =>
      groups.flatMap((group) =>
        group.items.filter((item) => checkedItemIds.includes(item.id)),
      ),
    [groups, checkedItemIds],
  );
  const selectedItemIds = selectedItems.map((item) => item.id);
  const isAllSelected =
    items.length > 0 && selectedItems.length === items.length;

  const toggleSelected = (itemId: string) =>
    setCheckedItemIds((current) =>
      current.includes(itemId)
        ? current.filter((id) => id !== itemId)
        : [...current, itemId],
    );

  const toggleAllSelected = () =>
    setCheckedItemIds(isAllSelected ? [] : items.map((item) => item.id));

  const clearSelection = () => setCheckedItemIds([]);

  const getTagLabel = (item: Item): ItemTagLabel | null =>
    buildItemTagLabel(getItemTagIds(item), tagsById, []);

  const getOrderBounds = (
    item: Item,
  ): { isFirst: boolean; isLast: boolean } => {
    const group = groups.find((g) => g.category.id === item.categoryId);
    if (!group) {
      throw new Error(`持ち物のカテゴリが見つかりません: ${item.categoryId}`);
    }
    const siblings = group.items;
    const index = siblings.findIndex((sibling) => sibling.id === item.id);
    if (index === -1) {
      throw new Error(`持ち物が見つかりません: ${item.id}`);
    }
    return { isFirst: index === 0, isLast: index === siblings.length - 1 };
  };

  const highlightItem = (itemId: string) => {
    setHighlightedItemId(itemId);
    if (highlightTimerRef.current !== null) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(
      () => setHighlightedItemId(null),
      HIGHLIGHT_MS,
    );
  };

  /**
   * 一括処理で一部が失敗したとき、最新の内容を取り直して失敗を知らせる
   * @param failureCount - 失敗した件数
   * @param failureMessage - 失敗を知らせる文言
   */
  const reportBulkFailure = async (
    failureCount: number,
    failureMessage: string,
  ): Promise<void> => {
    if (failureCount === 0) return;
    const isReloaded = await detail.reload();
    reportPartialFailure(failureMessage, isReloaded);
  };

  /**
   * 画面を先に更新して保存し、失敗したら更新した項目だけを元に戻す
   * @param itemId - 更新する持ち物のID
   * @param patch - 画面に先に反映する項目
   * @param rollback - 保存に失敗したときに戻す項目
   * @param input - 保存する更新内容
   * @param failureMessage - 保存に失敗したときの文言
   * @returns 保存に成功したら true
   */
  const patchItem = async (
    itemId: string,
    patch: Partial<Item>,
    rollback: Partial<Item>,
    input: ItemUpdateInput,
    failureMessage: string,
  ): Promise<boolean> => {
    setItems((current) =>
      current.map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    );
    const isSaved = await run(async () => {
      await updateItem(input);
    }, failureMessage);
    if (isSaved) {
      notify(SAVED_MESSAGE);
    } else {
      setItems((current) =>
        current.map((item) =>
          item.id === itemId ? { ...item, ...rollback } : item,
        ),
      );
    }
    return isSaved;
  };

  const renameItem = async (item: Item, name: string): Promise<boolean> =>
    await patchItem(
      item.id,
      { name },
      { name: item.name },
      { id: item.id, name },
      "持ち物名を保存できませんでした",
    );

  const changeQuantity = async (item: Item, text: string): Promise<boolean> => {
    const quantityPerDay = text.trim() === "" ? null : parseInteger(text);
    if (text.trim() !== "" && quantityPerDay === null) {
      reportError("1日あたりの必要数は整数で指定してください");
      return false;
    }
    return await patchItem(
      item.id,
      { quantityPerDay },
      { quantityPerDay: item.quantityPerDay },
      { id: item.id, quantityPerDay },
      "数量を保存できませんでした",
    );
  };

  const toggleItemTag = async (item: Item, tagId: string): Promise<boolean> => {
    const currentTagIds = getItemTagIds(item);
    const tagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((id) => id !== tagId)
      : [...currentTagIds, tagId];
    return await patchItem(
      item.id,
      { tagIds },
      { tagIds: item.tagIds },
      { id: item.id, tagIds },
      "行き先を保存できませんでした",
    );
  };

  const moveItem = async (item: Item, category: Category): Promise<boolean> => {
    if (item.categoryId === category.id) return true;
    return await run(async () => {
      const { result, values } = await moveItemsToCategory(
        [item],
        category.id,
        items,
      );
      if (result.failureCount > 0) throw result.failureReasons[0];
      setItems((current) => mergeById(current, values));
      notify(`「${category.name}」へ移動しました`);
    }, "カテゴリを保存できませんでした");
  };

  const reorderItem = async (item: Item, delta: -1 | 1): Promise<boolean> =>
    await run(async () => {
      const updated = await moveItemOrder(item.id, items, delta);
      setItems((current) => mergeById(current, updated));
      notify("並び順を変更しました");
    }, "並び順を変更できませんでした");

  const addItem = async (categoryId: string, name: string): Promise<boolean> =>
    await run(async () => {
      const { created, reordered } = await appendItem(
        { checkListId: checkList.id, categoryId, name },
        items,
      );
      setItems((current) => [...mergeById(current, reordered), created]);
      highlightItem(created.id);
    }, "持ち物を追加できませんでした");

  const undoRemove = async (deletedItems: Item[]): Promise<void> => {
    await run(
      async () =>
        await trackProgress("元に戻し中", async (onProgress) => {
          const { result, values } = await restoreItems(
            deletedItems,
            categories,
            tags,
            onProgress,
          );
          setItems((current) => [...current, ...values]);
          await reportBulkFailure(
            result.failureCount,
            `${result.failureCount}件を元に戻せませんでした`,
          );
        }),
      "元に戻せませんでした",
    );
  };

  const removeItems = async (targets: Item[]): Promise<void> => {
    const targetIds = targets.map((item) => item.id);
    const message =
      targets.length === 1
        ? `「${targets[0].name}」を削除しました`
        : `${targets.length}件を削除しました`;
    await run(
      async () =>
        await trackProgress("削除中", async (onProgress) => {
          const result = await deleteItems(targetIds, onProgress);
          setCheckedItemIds((current) =>
            current.filter((id) => !targetIds.includes(id)),
          );
          if (result.failureCount === 0) {
            setItems((current) =>
              current.filter((item) => !targetIds.includes(item.id)),
            );
            notifyUndoable(message, () => void undoRemove(targets));
            return;
          }
          await reportBulkFailure(
            result.failureCount,
            `${result.failureCount}件の削除に失敗しました`,
          );
        }),
      "削除できませんでした",
    );
  };

  const moveSelectedToCategory = async (category: Category): Promise<void> => {
    const targets = selectedItems;
    await run(
      async () =>
        await trackProgress("移動中", async (onProgress) => {
          const { result, values } = await moveItemsToCategory(
            targets,
            category.id,
            items,
            onProgress,
          );
          setItems((current) => mergeById(current, values));
          if (result.failureCount === 0) {
            clearSelection();
            notify(`${targets.length}件を「${category.name}」へ移動しました`);
            return;
          }
          await reportBulkFailure(
            result.failureCount,
            `${result.failureCount}件の移動に失敗しました`,
          );
        }),
      "移動できませんでした",
    );
  };

  const isTagAttachedToAllSelected = (tagId: string): boolean =>
    selectedItems.length > 0 &&
    selectedItems.every((item) => getItemTagIds(item).includes(tagId));

  const toggleSelectedTag = async (tag: Tag): Promise<void> => {
    const targets = selectedItems;
    const isAttached = !isTagAttachedToAllSelected(tag.id);
    await run(
      async () =>
        await trackProgress("行き先を更新中", async (onProgress) => {
          const { result, values } = await setTagOnItems(
            targets,
            tag.id,
            isAttached,
            onProgress,
          );
          setItems((current) => mergeById(current, values));
          if (result.failureCount === 0) {
            notify(
              `「${tag.name}」を${targets.length}件${isAttached ? "に付けました" : "から外しました"}`,
            );
            return;
          }
          await reportBulkFailure(
            result.failureCount,
            `${result.failureCount}件の行き先を更新できませんでした`,
          );
        }),
      "行き先を更新できませんでした",
    );
  };

  return {
    groups,
    itemCount: items.length,
    selectedItems,
    selectedItemIds,
    isAllSelected,
    highlightedItemId,
    toggleSelected,
    toggleAllSelected,
    clearSelection,
    getTagLabel,
    getAttachedTagIds: getItemTagIds,
    getOrderBounds,
    renameItem,
    changeQuantity,
    toggleItemTag,
    moveItem,
    reorderItem,
    addItem,
    removeItems,
    moveSelectedToCategory,
    isTagAttachedToAllSelected,
    toggleSelectedTag,
  };
};
