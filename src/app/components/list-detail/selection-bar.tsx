import { ActionButton } from "@/src/app/components/common/action-button";

/**
 * 編集モードで持ち物を選んでいる間、画面下部に出す操作バー
 * @param props - プロパティ
 * @returns 操作バー
 */
export function SelectionBar(props: {
  /** 選択中の件数 */
  selectedCount: number;
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** カテゴリへ移動するシートを開く */
  onMoveToCategory: () => void;
  /** タグを付け外しするシートを開く */
  onEditTags: () => void;
  /** 選択中の持ち物がすべて非表示か（true なら表示に戻す操作になる） */
  isAllHidden: boolean;
  /** 選択中の持ち物をまとめて非表示にする、または表示に戻す */
  onToggleHidden: () => void;
  /** 選択中の持ち物を削除する */
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-20 bg-background/90 px-5 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-xl">
      <div className="mx-auto max-w-160">
        <p className="pb-1.5 text-center text-[13px] font-semibold text-muted-foreground tabular-nums">
          {props.selectedCount}件を選択中
        </p>
        <div className="flex gap-2">
          <ActionButton
            variant="outline"
            className="flex-1 px-2 text-[15px]"
            isDisabled={props.isDisabled}
            onClick={props.onMoveToCategory}
          >
            カテゴリ
          </ActionButton>
          <ActionButton
            variant="outline"
            className="flex-1 px-2 text-[15px]"
            isDisabled={props.isDisabled}
            onClick={props.onEditTags}
          >
            タグ
          </ActionButton>
          <ActionButton
            variant="outline"
            className="flex-1 px-2 text-[15px]"
            isDisabled={props.isDisabled}
            onClick={props.onToggleHidden}
          >
            {props.isAllHidden ? "表示" : "非表示"}
          </ActionButton>
          <ActionButton
            variant="danger"
            className="flex-1 px-2 text-[15px]"
            isDisabled={props.isDisabled}
            onClick={props.onDelete}
          >
            削除
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
