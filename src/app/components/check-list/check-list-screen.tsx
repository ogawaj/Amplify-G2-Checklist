"use client";

import { useState } from "react";

import { CheckListCard } from "@/src/app/components/check-list/check-list-card";
import { BulkProgressBar } from "@/src/app/components/common/bulk-progress-bar";
import { ConfirmDialog } from "@/src/app/components/common/confirm-dialog";
import { InlineText } from "@/src/app/components/common/inline-text";
import { LoadingMessage } from "@/src/app/components/common/loading-message";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { ScreenHeader } from "@/src/app/components/common/screen-header";
import { useCheckLists } from "@/src/app/hooks/use-check-lists";
import type { CheckList } from "@/src/app/models/check-list";

/**
 * チェックリスト一覧画面（S-04）
 * @returns 一覧画面
 */
export function CheckListScreen() {
  const lists = useCheckLists();
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState("処理中");
  const [deleteTarget, setDeleteTarget] = useState<CheckList | null>(null);

  if (lists.isLoading) return <LoadingMessage />;

  return (
    <div className="flex flex-col gap-3">
      <ScreenHeader title="チェックリスト" />
      <NoticeBanner
        message={lists.loadError ?? lists.errorMessage}
        onDismiss={lists.clearError}
      />
      <BulkProgressBar label={progressLabel} progress={lists.progress} />
      {lists.checkLists.length === 0 && !lists.loadError && (
        <p className="text-sm text-muted-foreground">
          チェックリストがありません。下の入力欄から作成してください。
        </p>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {lists.checkLists.map((checkList) => (
          <CheckListCard
            key={checkList.id}
            checkList={checkList}
            isRenaming={renamingId === checkList.id}
            isBusy={lists.isPending}
            onRename={(name) => lists.rename(checkList.id, name)}
            onStartRename={() => setRenamingId(checkList.id)}
            onEndRename={() => setRenamingId(null)}
            onDuplicate={() => {
              setProgressLabel("複製中");
              void lists.duplicate(checkList.id);
            }}
            onDelete={() => setDeleteTarget(checkList)}
          />
        ))}
      </div>
      <InlineText
        value=""
        ariaLabel="新しいチェックリスト名"
        placeholder="＋ 新規作成（名前を入力して確定）"
        clearOnCommit
        onCommit={lists.create}
      />
      <ConfirmDialog
        open={deleteTarget !== null}
        title={`「${deleteTarget?.name ?? ""}」を削除しますか？`}
        description="このチェックリストに登録された持ち物も併せて削除されます。この操作は取り消せません。"
        confirmLabel="削除する"
        isPending={lists.isPending}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget === null) return;
          setProgressLabel("削除中");
          setDeleteTarget(null);
          void lists.remove(deleteTarget.id);
        }}
      />
    </div>
  );
}
