import { ChevronDown, ChevronUp, Trash2 } from "lucide-react";

import { AddField } from "@/src/app/components/common/add-field";
import { BlockedReason } from "@/src/app/components/common/blocked-reason";
import { BottomSheet } from "@/src/app/components/common/bottom-sheet";
import { IconButton } from "@/src/app/components/common/icon-button";
import { InlineText } from "@/src/app/components/common/inline-text";
import { TextButton } from "@/src/app/components/common/text-button";
import {
  CATEGORY_MOVE_DIRECTION,
  type CategoryMoveDirection,
} from "@/src/app/enums/category-move-direction";
import type { BlockedDeletion } from "@/src/app/models/blocked-deletion";
import type { Category } from "@/src/app/models/category";

/** 並び順を動かす矢印ボタンのクラス */
const ARROW_BUTTON_CLASS =
  "grid h-11 w-8 place-items-center text-icon active:opacity-50 disabled:opacity-25";

/**
 * カテゴリの管理シート（追加・名前変更・並べ替え・削除）
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
  /** 1つ上または下へ動かす */
  onMove: (category: Category, direction: CategoryMoveDirection) => void;
  /** 削除する */
  onRemove: (category: Category) => void;
  /** 追加する。保存に成功したら true を返す */
  onAdd: (name: string) => Promise<boolean>;
  /** 削除できない理由を閉じる */
  onCloseBlocked: () => void;
  /** 閉じる */
  onClose: () => void;
}) {
  const lastIndex = props.categories.length - 1;
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
        {props.categories.map((category, index) => (
          <div key={category.id}>
            <div className="flex items-center">
              <span className="flex shrink-0">
                <button
                  type="button"
                  aria-label={`${category.name}を1つ上へ`}
                  disabled={props.isDisabled || index === 0}
                  className={ARROW_BUTTON_CLASS}
                  onClick={() =>
                    props.onMove(category, CATEGORY_MOVE_DIRECTION.UP)
                  }
                >
                  <ChevronUp className="size-5" />
                </button>
                <button
                  type="button"
                  aria-label={`${category.name}を1つ下へ`}
                  disabled={props.isDisabled || index === lastIndex}
                  className={ARROW_BUTTON_CLASS}
                  onClick={() =>
                    props.onMove(category, CATEGORY_MOVE_DIRECTION.DOWN)
                  }
                >
                  <ChevronDown className="size-5" />
                </button>
              </span>
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
          </div>
        ))}
        <div className="pl-2">
          <AddField label="カテゴリを追加" onCommit={props.onAdd} />
        </div>
      </div>
    </BottomSheet>
  );
}
