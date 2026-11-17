import { Trash2 } from "lucide-react";

import { AddField } from "@/src/app/components/common/add-field";
import { BlockedReason } from "@/src/app/components/common/blocked-reason";
import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { IconButton } from "@/src/app/components/common/icon-button";
import { InlineText } from "@/src/app/components/common/inline-text";
import { TextButton } from "@/src/app/components/common/text-button";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { Tag } from "@/src/app/models/tag";

/**
 * 行き先（タグ）の管理シート（追加・名前変更・削除）
 * @param props - プロパティ
 * @returns 行き先管理シート
 */
export function TagSheet(props: {
  /** 行き先 */
  tags: Tag[];
  /** 削除できなかった行き先とその理由 */
  blocked: BlockedDeletion | null;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 名前の確定。保存に成功したら true を返す */
  onRename: (tag: Tag, name: string) => Promise<boolean>;
  /** 削除する */
  onRemove: (tag: Tag) => void;
  /** 追加する。保存に成功したら true を返す */
  onAdd: (name: string) => Promise<boolean>;
  /** 削除できない理由を閉じる */
  onCloseBlocked: () => void;
  /** 閉じる */
  onClose: () => void;
}) {
  return (
    <BottomSheet
      title="行き先"
      action={
        <TextButton isStrong onClick={props.onClose}>
          完了
        </TextButton>
      }
      onClose={props.onClose}
    >
      <div className="flex flex-col">
        {props.tags.map((tag) => (
          <div key={tag.id}>
            <div className="flex items-center">
              <InlineText
                value={tag.name}
                ariaLabel="行き先の名前"
                appearance="bare"
                onCommit={(name) => props.onRename(tag, name)}
              />
              <IconButton
                label={`${tag.name}を削除`}
                isDisabled={props.isDisabled}
                onClick={() => props.onRemove(tag)}
              >
                <Trash2 />
              </IconButton>
            </div>
            {props.blocked?.targetId === tag.id && (
              <BlockedReason onClose={props.onCloseBlocked}>
                {props.blocked.message}
              </BlockedReason>
            )}
          </div>
        ))}
        <AddField label="行き先を追加" onCommit={props.onAdd} />
      </div>
    </BottomSheet>
  );
}
