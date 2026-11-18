"use client";

import { useMemo, useState } from "react";

import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { Tag } from "@/src/app/models/tag";
import { getItemTagIds } from "@/src/app/services/item-service";
import {
  canDeleteTag,
  createTag,
  deleteTag,
  moveTag,
  planTagMove,
  renameTag,
  restoreTag,
  sortTags,
} from "@/src/app/services/tag-service";

/**
 * タグ管理シートの状態（追加・改名・並べ替え・取り消し付きの削除）を管理するフック
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @returns 表示順のタグと各操作
 */
export const useTag = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
) => {
  const { checkList, tags, items, setTags } = detail;
  const { run, notify, notifyUndoable } = feedback;
  const [blocked, setBlocked] = useState<BlockedDeletion | null>(null);
  const sortedTags = useMemo(() => sortTags(tags), [tags]);

  const add = async (name: string): Promise<boolean> =>
    await run(async () => {
      const created = await createTag(checkList.id, name, tags);
      setTags((current) => [...current, created]);
    }, "タグを追加できませんでした");

  const rename = async (tag: Tag, name: string): Promise<boolean> => {
    setTags((current) =>
      current.map((t) => (t.id === tag.id ? { ...t, name } : t)),
    );
    const isSaved = await run(async () => {
      await renameTag(tag.id, name, tags);
    }, "名前を変更できませんでした");
    if (isSaved) {
      notify("保存しました");
    } else {
      setTags((current) => current.map((t) => (t.id === tag.id ? tag : t)));
    }
    return isSaved;
  };

  const move = async (tagId: string, targetTagId: string): Promise<void> => {
    setTags(planTagMove(tags, tagId, targetTagId));
    const isMoved = await run(async () => {
      setTags(await moveTag(tags, tagId, targetTagId));
    }, "並び順を変更できませんでした");
    if (!isMoved && !(await detail.reload())) setTags(tags);
  };

  const undoRemove = async (deleted: Tag): Promise<void> => {
    await run(async () => {
      const restored = await restoreTag(deleted);
      setTags((current) => [...current, restored]);
    }, "元に戻せませんでした");
  };

  const remove = async (tag: Tag): Promise<void> => {
    if (!canDeleteTag(tag.id, items)) {
      const itemCount = items.filter((item) =>
        getItemTagIds(item).includes(tag.id),
      ).length;
      setBlocked({
        targetId: tag.id,
        message: `「${tag.name}」は${itemCount}件の持ち物に付いているため削除できません`,
      });
      return;
    }
    const isDeleted = await run(async () => {
      await deleteTag(tag.id, items);
      setTags((current) => current.filter((t) => t.id !== tag.id));
    }, "タグを削除できませんでした");
    if (isDeleted) {
      notifyUndoable(
        `「${tag.name}」を削除しました`,
        () => void undoRemove(tag),
      );
    }
  };

  return {
    sortedTags,
    blocked,
    add,
    rename,
    move,
    remove,
    closeBlocked: () => setBlocked(null),
  };
};
