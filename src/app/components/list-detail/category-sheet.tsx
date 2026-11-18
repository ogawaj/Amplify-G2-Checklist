import { Trash2 } from "lucide-react";

import { AddField } from "@/src/app/components/common/add-field";
import { BlockedReason } from "@/src/app/components/common/blocked-reason";
import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { IconButton } from "@/src/app/components/common/icon-button";
import { InlineText } from "@/src/app/components/common/inline-text";
import { SortableList } from "@/src/app/components/common/sortable-list";
import { SortableRow } from "@/src/app/components/common/sortable-row";
import { TextButton } from "@/src/app/components/common/text-button";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { Category } from "@/src/app/models/category";

/**
 * カテゴリの管理シート（追加・名前変更・ドラッグでの並べ替え・削除）
 * @param props - プロパティ
 * @returns カテゴリ管理シート
 */
export function CategorySheet(props: {
  /** カテゴリ（表示順） */
  categories: Category[];
  /** 削除できなかったカテゴリとその理由 */
  blocked: BlockedDeletion | null;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** 名前の確定。保存に成功したら true を返す */
  onRename: (category: Category, name: string) => Promise<boolean>;
  /** カテゴリを別のカテゴリの位置へ動かす */
  onMove: (categoryId: string, targetCategoryId: string) => void;
  /** 削除する */
  onRemove: (category: Category) => void;
  /** 追加する。保存に成功したら true を返す */
  onAdd: (name: string) => Promise<boolean>;
  /** 削除できない理由を閉じる */
  onCloseBlocked: () => void;
  /** 閉じる */
  onClose: () => void;
}) {
  return (
    <BottomSheet
      title="カテゴリ"
      action={
        <TextButton isStrong onClick={props.onClose}>
          完了
        </TextButton>
      }
      onClose={props.onClose}
    >
      <div className="flex flex-col">
        <SortableList items={props.categories} onMove={props.onMove}>
          {props.categories.map((category) => (
            <SortableRow
              key={category.id}
              id={category.id}
              name={category.name}
              isDisabled={props.isDisabled}
            >
              {(handle) => (
                <>
                  <div className="flex items-center">
                    {handle}
                    <InlineText
                      value={category.name}
                      ariaLabel="カテゴリ名"
                      appearance="bare"
                      onCommit={(name) => props.onRename(category, name)}
                    />
                    <IconButton
                      label={`${category.name}を削除`}
                      isDisabled={props.isDisabled}
                      onClick={() => props.onRemove(category)}
                    >
                      <Trash2 />
                    </IconButton>
                  </div>
                  {props.blocked?.targetId === category.id && (
                    <BlockedReason onClose={props.onCloseBlocked}>
                      {props.blocked.message}
                    </BlockedReason>
                  )}
                </>
              )}
            </SortableRow>
          ))}
        </SortableList>
        <div className="pl-2">
          <AddField label="カテゴリを追加" onCommit={props.onAdd} />
        </div>
      </div>
    </BottomSheet>
  );
}
