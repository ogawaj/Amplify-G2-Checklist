"use client";

import { useState } from "react";

import { ActionButton } from "@/src/app/components/common/action-button";
import { BottomSheet } from "@/src/app/components/common/bottom-sheet";

/**
 * チェックリストの名前を変更するシート
 * @param props - プロパティ
 * @returns 名前変更シート
 */
export function RenameSheet(props: {
  /** 現在の名前 */
  name: string;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 保存する。保存に成功したら true を返す */
  onSave: (name: string) => Promise<boolean>;
  /** 閉じる */
  onClose: () => void;
}) {
  const { onSave, onClose } = props;
  const [draft, setDraft] = useState(props.name);
  const next = draft.trim();
  const canSave = !props.isDisabled && next !== "" && next !== props.name;

  const save = async () => {
    if (await onSave(next)) onClose();
  };

  return (
    <BottomSheet title="名前を変更" onClose={onClose}>
      <input
        aria-label="チェックリスト名"
        value={draft}
        autoFocus
        enterKeyHint="done"
        className="h-9 w-full rounded-lg bg-fill px-3 text-[17px] caret-primary outline-none"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (
            event.key === "Enter" &&
            !event.nativeEvent.isComposing &&
            canSave
          ) {
            void save();
          }
        }}
      />
      <div className="mt-5 flex gap-2">
        <ActionButton variant="outline" className="flex-1" onClick={onClose}>
          キャンセル
        </ActionButton>
        <ActionButton
          variant="primary"
          className="flex-1"
          isDisabled={!canSave}
          onClick={() => void save()}
        >
          保存
        </ActionButton>
      </div>
    </BottomSheet>
  );
}
