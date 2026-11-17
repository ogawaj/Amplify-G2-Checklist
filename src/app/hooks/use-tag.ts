"use client";

import { useState } from "react";

import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { useTagFilter } from "@/src/app/hooks/use-tag-filter";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { Tag } from "@/src/app/models/tag";
import { getItemTagIds } from "@/src/app/services/item-service";
import {
  canDeleteTag,
  createTag,
  deleteTag,
  renameTag,
  restoreTag,
} from "@/src/app/services/tag-service";

/**
 * タグ（行き先）管理シートの状態（追加・改名・取り消し付きの削除）を管理するフック
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @param tagFilter - 絞り込みに使うタグの選択状態（削除・取り消しに追従させる）
 * @returns タグと各操作
 */
export const useTag = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
  tagFilter: ReturnType<typeof useTagFilter>,
) => {
  const { checkList, tags, items, setTags } = detail;
  const { run, notify, notifyUndoable } = feedback;
  const { selectedTagIds, replaceTags } = tagFilter;
  const [blocked, setBlocked] = useState<BlockedDeletion | null>(null);

  const add = async (name: string): Promise<boolean> =>
    await run(async () => {
      const created = await createTag(checkList.id, name, tags);
      setTags((current) => [...current, created]);
    }, "行き先を追加できませんでした");

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

  const undoRemove = async (
    deleted: Tag,
    previousSelectedTagIds: string[],
  ): Promise<void> => {
    await run(async () => {
      const restored = await restoreTag(deleted);
      setTags((current) => [...current, restored]);
      replaceTags(
        previousSelectedTagIds.map((id) =>
          id === deleted.id ? restored.id : id,
        ),
      );
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
    const previousSelectedTagIds = selectedTagIds;
    const isDeleted = await run(async () => {
      await deleteTag(tag.id, items);
      setTags((current) => current.filter((t) => t.id !== tag.id));
      replaceTags((current) => current.filter((id) => id !== tag.id));
    }, "行き先を削除できませんでした");
    if (isDeleted) {
      notifyUndoable(
        `「${tag.name}」を削除しました`,
        () => void undoRemove(tag, previousSelectedTagIds),
      );
    }
  };

  return {
    tags,
    blocked,
    add,
    rename,
    remove,
    closeBlocked: () => setBlocked(null),
  };
};
