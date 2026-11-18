import { Check } from "lucide-react";

import { RowTag } from "@/src/app/components/list-detail/row-tag";
import type { Item } from "@/src/app/models/item";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * 準備モードの持ち物1件の行。行全体を押してチェックを切り替える
 * @param props - プロパティ
 * @returns チェック行
 */
export function CheckRow(props: {
  /** 持ち物 */
  item: Item;
  /** 日数を乗じた必要数。数量が未設定なら null */
  requiredQuantity: number | null;
  /** 日数 */
  durationDays: number;
  /** 右端に出すタグ */
  tagLabel: string | null;
  /** チェック状態の切り替え */
  onToggle: () => void;
}) {
  const { item } = props;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={item.isChecked}
      className="flex min-h-11 w-full items-center gap-3 text-left active:bg-fill"
      onClick={props.onToggle}
    >
      <span
        className={cn(
          "grid size-6 shrink-0 place-items-center rounded-full transition duration-200",
          item.isChecked
            ? "bg-primary text-white"
            : "ring-[1.5px] ring-subtle ring-inset",
        )}
      >
        {item.isChecked && <Check className="size-4" strokeWidth={3} />}
      </span>
      <span
        className={cn(
          "flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 transition",
          item.isChecked && "opacity-40",
        )}
      >
        <span className="text-[17px] break-words">{item.name}</span>
        {props.requiredQuantity !== null && (
          <span
            aria-label={`${props.requiredQuantity}個（1日${item.quantityPerDay}×${props.durationDays}日）`}
            className="text-[17px] text-muted-foreground tabular-nums"
          >
            <span className="mr-0.5">×</span>
            {props.requiredQuantity}
          </span>
        )}
      </span>
      <RowTag label={props.tagLabel} isDimmed={item.isChecked} />
    </button>
  );
}
