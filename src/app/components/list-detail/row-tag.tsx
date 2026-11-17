import type { ItemTagLabel } from "@/src/app/models/item-tag-label";
import { cn } from "@/src/lib/shadcn/utils";

/**
 * 持ち物の行に出す行き先の表示（「共通」は灰色、行き先は差し色）
 * @param props - プロパティ
 * @returns 行き先の表示。label が null なら何も出さない
 */
export function RowTag(props: {
  /** 表示内容 */
  label: ItemTagLabel | null;
  /** 薄く出すか（チェック済み） */
  isDimmed?: boolean;
}) {
  if (props.label === null) return null;
  return (
    <span
      className={cn(
        "shrink-0 text-[13px] transition",
        props.label.isCommon ? "text-muted-foreground" : "text-brand-text",
        props.isDimmed && "opacity-40",
      )}
    >
      {props.label.text}
    </span>
  );
}
