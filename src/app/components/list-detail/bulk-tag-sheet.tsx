import { Check } from "lucide-react";

import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { Chip } from "@/src/app/components/common/chip";
import { TextButton } from "@/src/app/components/common/text-button";
import type { Tag } from "@/src/app/models/tag";

/**
 * 選んだ持ち物にまとめてタグを付け外しするシート
 * @param props - プロパティ
 * @returns 一括タグシート
 */
export function BulkTagSheet(props: {
  /** 選択中の件数 */
  selectedCount: number;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 選べるタグ */
  tags: Tag[];
  /** 選択中のすべての持ち物に付いているタグか */
  isAttachedToAll: (tagId: string) => boolean;
  /** タグの付け外し（全件に付いていれば外し、でなければ付ける） */
  onToggle: (tag: Tag) => void;
  /** 閉じる */
  onClose: () => void;
}) {
  return (
    <BottomSheet
      title={`タグを付ける（${props.selectedCount}件）`}
      action={
        <TextButton isStrong onClick={props.onClose}>
          完了
        </TextButton>
      }
      onClose={props.onClose}
    >
      <div className="flex flex-wrap justify-center gap-2 pb-2">
        {props.tags.map((tag) => {
          const isOn = props.isAttachedToAll(tag.id);
          return (
            <Chip
              key={tag.id}
              isOn={isOn}
              isDisabled={props.isDisabled}
              onClick={() => props.onToggle(tag)}
            >
              {isOn && <Check className="size-3.5" strokeWidth={3} />}
              {tag.name}
            </Chip>
          );
        })}
      </div>
    </BottomSheet>
  );
}
