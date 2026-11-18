import { cn } from "@/src/lib/shadcn/utils";

/**
 * 持ち物の行に出すタグの表示
 * @param props - プロパティ
 * @returns タグの表示。label が null なら何も出さない
 */
export function RowTag(props: {
  /** 表示内容 */
  label: string | null;
  /** 薄く出すか（チェック済み） */
  isDimmed?: boolean;
}) {
  if (props.label === null) return null;
  return (
    <span
      className={cn(
        "shrink-0 text-[13px] text-brand-text transition",
        props.isDimmed && "opacity-40",
      )}
    >
      {props.label}
    </span>
  );
}
