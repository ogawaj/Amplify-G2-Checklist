import { Check, Minus, Plus } from "lucide-react";

import { ActionButton } from "@/src/app/components/common/action-button";
import { InlineText } from "@/src/app/components/common/inline-text";
import { CategoryGroup } from "@/src/app/components/list-detail/category-group";
import { CheckRow } from "@/src/app/components/list-detail/check-row";
import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import type { CategoryItemGroup } from "@/src/app/models/category-item-group";
import type { Item } from "@/src/app/models/item";
import { cn } from "@/src/lib/shadcn/utils";

/** 日数の増減ボタンのクラス（見た目は高さ32px、押せる範囲は上下に広げて44px） */
const STEPPER_BUTTON_CLASS =
  "relative grid h-8 w-11 place-items-center rounded-md after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] active:bg-fill-strong disabled:opacity-30";

/**
 * 準備モードの内容（タグの絞り込み・日数・チェックを外す・チェック行）
 * @param props - プロパティ
 * @returns 準備モードの内容
 */
export function PrepareView(props: {
  /** 操作を受け付けない状態か（処理中） */
  isDisabled: boolean;
  /** タグの絞り込みチップ */
  tagFilter: React.ReactNode;
  /** 日数 */
  durationDays: number;
  /** 日数を1日ずつ増減する */
  onStepDays: (delta: -1 | 1) => void;
  /** 日数の直接入力の確定。保存に成功したら true を返す */
  onCommitDays: (text: string) => Promise<boolean>;
  /** 表示するカテゴリごとの持ち物（0件のカテゴリを除く） */
  groups: CategoryItemGroup[];
  /** 持ち物が1件もないか */
  isEmpty: boolean;
  /** 表示中の持ち物がすべてチェック済みか */
  isAllDone: boolean;
  /** チェック済みの持ち物の総数 */
  checkedCount: number;
  /** 一括でチェックを外す */
  onReset: () => void;
  /** 編集モードに入って持ち物を追加し始める */
  onStartAdding: () => void;
  /** 持ち物の必要数（日数を乗じた値）。数量が未設定なら null */
  getRequiredQuantity: (item: Item) => number | null;
  /** 行に出すタグ */
  getTagLabel: (item: Item) => string | null;
  /** チェックの切り替え */
  onToggleChecked: (item: Item) => void;
}) {
  const resetButtonClass =
    "inline-flex h-11 items-center text-[15px] text-brand-text active:opacity-50";
  return (
    <>
      <div className="flex flex-col gap-3">
        {props.tagFilter}

        <div className="flex flex-wrap items-center gap-x-3">
          <span className="text-[17px]">日数</span>
          <div className="flex items-center rounded-lg bg-fill p-0.5">
            <button
              type="button"
              aria-label="1日減らす"
              disabled={
                props.durationDays <= CHECK_LIST_LIMIT.DURATION_DAYS_MIN
              }
              className={STEPPER_BUTTON_CLASS}
              onClick={() => props.onStepDays(-1)}
            >
              <Minus className="size-4" />
            </button>
            <div className="w-10">
              <InlineText
                value={String(props.durationDays)}
                ariaLabel="日数"
                inputMode="numeric"
                appearance="bare"
                className="h-8 px-0 text-center font-semibold tabular-nums focus:px-0"
                onCommit={props.onCommitDays}
              />
            </div>
            <button
              type="button"
              aria-label="1日増やす"
              disabled={
                props.durationDays >= CHECK_LIST_LIMIT.DURATION_DAYS_MAX
              }
              className={STEPPER_BUTTON_CLASS}
              onClick={() => props.onStepDays(1)}
            >
              <Plus className="size-4" />
            </button>
          </div>
          <span className="flex-1" />
          {props.checkedCount > 0 && !props.isAllDone && (
            <button
              type="button"
              className={resetButtonClass}
              disabled={props.isDisabled}
              onClick={props.onReset}
            >
              チェックを外す
            </button>
          )}
        </div>

        {props.isAllDone && (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="mb-3 grid size-12 place-items-center rounded-full bg-primary text-primary-foreground">
              <Check className="size-6" strokeWidth={3} />
            </span>
            <p className="text-[17px] font-semibold">準備完了</p>
            <button
              type="button"
              className={cn(resetButtonClass, "mt-3 px-2")}
              disabled={props.isDisabled}
              onClick={props.onReset}
            >
              チェックを外す
            </button>
          </div>
        )}
      </div>

      {props.groups.length === 0 && (
        <div className="flex flex-col items-center py-10 text-center">
          {props.isEmpty ? (
            <>
              <p className="text-[17px] font-semibold">
                持ち物がまだありません
              </p>
              <ActionButton
                variant="primary"
                className="mt-5"
                onClick={props.onStartAdding}
              >
                <Plus className="mr-1 size-5" />
                持ち物を追加
              </ActionButton>
            </>
          ) : (
            <p className="text-[15px] text-muted-foreground">
              表示する持ち物がありません
            </p>
          )}
        </div>
      )}

      {props.groups.map(({ category, items }) => (
        <CategoryGroup key={category.id} name={category.name}>
          {items.map((item) => (
            <CheckRow
              key={item.id}
              item={item}
              requiredQuantity={props.getRequiredQuantity(item)}
              durationDays={props.durationDays}
              tagLabel={props.getTagLabel(item)}
              onToggle={() => props.onToggleChecked(item)}
            />
          ))}
        </CategoryGroup>
      ))}
    </>
  );
}
