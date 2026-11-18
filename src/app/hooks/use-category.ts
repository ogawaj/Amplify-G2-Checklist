"use client";

import { useMemo, useState } from "react";

import type { CategoryDeleteBlocker } from "@/src/app/enums/category-delete-blocker";
import { CATEGORY_DELETE_BLOCKER } from "@/src/app/enums/category-delete-blocker";
import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { Category } from "@/src/app/models/category";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import {
  createCategory,
  deleteCategory,
  getCategoryDeleteBlocker,
  moveCategory,
  planCategoryMove,
  renameCategory,
  restoreCategory,
  sortCategories,
} from "@/src/app/services/category-service";

/**
 * 削除できない理由を利用者向けの文言にする
 * @param blocker - 削除できない理由
 * @param category - 削除しようとしたカテゴリ
 * @param itemCount - カテゴリに属する持ち物の件数
 * @returns 理由の文言
 */
const toBlockedMessage = (
  blocker: CategoryDeleteBlocker,
  category: Pick<Category, "name">,
  itemCount: number,
): string => {
  switch (blocker) {
    case CATEGORY_DELETE_BLOCKER.HAS_ITEMS:
      return `「${category.name}」には持ち物が${itemCount}件あるため削除できません`;
    case CATEGORY_DELETE_BLOCKER.LAST_CATEGORY:
      return "最後のカテゴリは削除できません";
  }
};

/**
 * カテゴリ管理シートの状態（追加・改名・並べ替え・取り消し付きの削除）を管理するフック
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @returns 表示順のカテゴリと各操作
 */
export const useCategory = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
) => {
  const { checkList, categories, items, setCategories } = detail;
  const { run, notify, notifyUndoable } = feedback;
  const [blocked, setBlocked] = useState<BlockedDeletion | null>(null);

  const sortedCategories = useMemo(
    () => sortCategories(categories),
    [categories],
  );

  const add = async (name: string): Promise<boolean> =>
    await run(async () => {
      const created = await createCategory(checkList.id, name, categories);
      setCategories((current) => [...current, created]);
    }, "カテゴリを追加できませんでした");

  const rename = async (category: Category, name: string): Promise<boolean> => {
    setCategories((current) =>
      current.map((c) => (c.id === category.id ? { ...c, name } : c)),
    );
    const isSaved = await run(async () => {
      await renameCategory(category.id, name, categories);
    }, "名前を変更できませんでした");
    if (isSaved) {
      notify("保存しました");
    } else {
      setCategories((current) =>
        current.map((c) => (c.id === category.id ? category : c)),
      );
    }
    return isSaved;
  };

  const move = async (
    categoryId: string,
    targetCategoryId: string,
  ): Promise<void> => {
    setCategories(planCategoryMove(categories, categoryId, targetCategoryId));
    const isMoved = await run(async () => {
      setCategories(
        await moveCategory(categories, categoryId, targetCategoryId),
      );
    }, "並び順を変更できませんでした");
    if (!isMoved && !(await detail.reload())) setCategories(categories);
  };

  const undoRemove = async (deleted: Category): Promise<void> => {
    await run(async () => {
      const restored = await restoreCategory(deleted);
      setCategories((current) => [...current, restored]);
    }, "元に戻せませんでした");
  };

  const remove = async (category: Category): Promise<void> => {
    const blocker = getCategoryDeleteBlocker(category.id, categories, items);
    if (blocker !== null) {
      setBlocked({
        targetId: category.id,
        message: toBlockedMessage(
          blocker,
          category,
          items.filter((item) => item.categoryId === category.id).length,
        ),
      });
      return;
    }
    const isDeleted = await run(async () => {
      await deleteCategory(category.id, categories, items);
      setCategories((current) => current.filter((c) => c.id !== category.id));
    }, "カテゴリを削除できませんでした");
    if (isDeleted) {
      notifyUndoable(
        `「${category.name}」を削除しました`,
        () => void undoRemove(category),
      );
    }
  };

  return {
    sortedCategories,
    blocked,
    add,
    rename,
    move,
    remove,
    closeBlocked: () => setBlocked(null),
  };
};
