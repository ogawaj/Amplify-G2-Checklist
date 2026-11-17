import { cn } from "@/src/lib/shadcn/utils";

/**
 * 選択式のチップ（見た目は高さ32px、押せる範囲は上下に広げて44px）
 * @param props - プロパティ
 * @returns チップ
 */
export function Chip(props: {
  /** 選択中か */
  isOn: boolean;
  /** 押せない状態か */
  isDisabled?: boolean;
  /** 押したとき */
  onClick: () => void;
  /** 表示 */
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.isOn}
      disabled={props.isDisabled}
      className={cn(
        "relative inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-3.5 text-[15px] transition after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] active:opacity-60 disabled:opacity-50",
        props.isOn
          ? "bg-brand-tint font-semibold text-brand-text"
          : "bg-fill text-foreground",
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
