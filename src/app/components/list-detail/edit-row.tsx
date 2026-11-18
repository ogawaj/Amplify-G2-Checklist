import { Check, ChevronRight } from "lucide-react";

import { SortableRow } from "@/src/app/components/common/sortable-row";
import { RowTag } from "@/src/app/components/list-detail/row-tag";
import type { Item } from "@/src/app/models/item";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * 編集モードの持ち物1件の行。左の四角で選択し、行を押すと持ち物の編集シートを開き、右端のつまみをドラッグして並べ替える。
 * 非表示の持ち物は薄く出して「非表示」と添える。SortableList の中に置く
 * @param props - プロパティ
 * @returns 編集行
 */
export function EditRow(props: {
  /** 持ち物 */
  item: Item;
  /** 名前の横に出すタグ */
  tagLabel: string | null;
  /** 非表示（準備モードで表示しない）か */
  isHidden: boolean;
  /** 選択中か */
  isSelected: boolean;
  /** 追加直後の強調表示をするか */
  isHighlighted: boolean;
  /** 並べ替えを受け付けない状態か（処理中） */
  isDragDisabled: boolean;
  /** 選択を切り替えるとき */
  onToggleSelected: () => void;
  /** 編集シートを開くとき */
  onOpen: () => void;
}) {
  const { item } = props;
  return (
    <SortableRow
      id={item.id}
      name={item.name}
      isDisabled={props.isDragDisabled}
      className={cn(
        "-ml-2 flex min-h-11 items-center rounded-lg transition-colors duration-700",
        props.isHighlighted && "bg-brand-tint duration-0",
      )}
    >
      {(handle) => (
        <>
          <button
            type="button"
            role="checkbox"
            aria-checked={props.isSelected}
            aria-label={`${item.name}を選択`}
            className="grid h-11 w-10 shrink-0 place-items-center"
            onClick={props.onToggleSelected}
          >
            <span
              className={cn(
                "grid size-[22px] place-items-center rounded-md transition",
                props.isSelected
                  ? "bg-primary text-white"
                  : "ring-[1.5px] ring-subtle ring-inset",
              )}
            >
              {props.isSelected && <Check className="size-4" strokeWidth={3} />}
            </span>
          </button>
          <button
            type="button"
            aria-label={`${item.name}を編集`}
            className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left active:opacity-50"
            onClick={props.onOpen}
          >
            <span
              className={cn(
                "flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2",
                props.isHidden && "opacity-40",
              )}
            >
              <span className="text-[17px] break-words">{item.name}</span>
              {item.quantityPerDay !== null && (
                <span className="text-[15px] text-muted-foreground tabular-nums">
                  {item.quantityPerDay}/日
                </span>
              )}
              <RowTag label={props.tagLabel} />
            </span>
            {props.isHidden && (
              <span className="shrink-0 text-[13px] text-muted-foreground">
                非表示
              </span>
            )}
            <ChevronRight className="size-5 shrink-0 text-subtle" />
          </button>
          {handle}
        </>
      )}
    </SortableRow>
  );
}
