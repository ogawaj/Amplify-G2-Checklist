"use client";

import { useRef, useState } from "react";

import type { useDetailFeedback } from "@/src/app/hooks/use-detail-feedback";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { TagVisibility } from "@/src/app/models/tag-visibility";
import {
  getTagVisibility,
  pruneTagVisibility,
  updateTagVisibility,
} from "@/src/app/services/check-list-service";

/**
 * 絞り込みに使うタグの表示状態を管理するフック。状態はチェックリストに保存し、未設定ならすべて表示（全選択）
 *
 * 選択を外したタグを覚える形にし、後から追加したタグは選択された状態で始まるようにする。
 * 表示は押した時点で切り替え、保存は1件ずつ順に行って最後の状態を必ず書き込む。保存に失敗し、
 * 後続の操作もなければ、最後に保存できた状態へ表示を戻す。
 * @param detail - 読み込み済みのチェックリスト詳細
 * @param feedback - 操作の結果を伝える仕組み
 * @returns visibility・toggleTag・toggleUntagged
 */
export const useTagFilter = (
  detail: CheckListDetail,
  feedback: ReturnType<typeof useDetailFeedback>,
) => {
  const { checkList, tags } = detail;
  const { run } = feedback;
  const [visibility, setVisibility] = useState(() =>
    getTagVisibility(checkList),
  );
  const latestRef = useRef(visibility);
  const savedRef = useRef(visibility);
  const pendingRef = useRef<TagVisibility | null>(null);
  const queueRef = useRef<Promise<void>>(Promise.resolve());

  const show = (next: TagVisibility): void => {
    latestRef.current = next;
    setVisibility(next);
  };

  const savePending = async (): Promise<void> => {
    const target = pendingRef.current;
    if (target === null) return;
    pendingRef.current = null;
    const isSaved = await run(async () => {
      await updateTagVisibility(checkList.id, target);
    }, "タグの選択を保存できませんでした");
    if (isSaved) {
      savedRef.current = target;
    } else if (pendingRef.current === null) {
      show(savedRef.current);
    }
  };

  const change = (next: TagVisibility): void => {
    const pruned = pruneTagVisibility(next, tags);
    show(pruned);
    pendingRef.current = pruned;
    queueRef.current = queueRef.current.then(savePending);
  };

  const toggleTag = (tagId: string): void => {
    const current = latestRef.current;
    const isHidden = current.hiddenTagIds.includes(tagId);
    change({
      ...current,
      hiddenTagIds: isHidden
        ? current.hiddenTagIds.filter((id) => id !== tagId)
        : [...current.hiddenTagIds, tagId],
    });
  };

  const toggleUntagged = (): void => {
    const current = latestRef.current;
    change({ ...current, isUntaggedHidden: !current.isUntaggedHidden });
  };

  return { visibility, toggleTag, toggleUntagged };
};
