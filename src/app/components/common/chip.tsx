import { cn } from "@/src/lib/shadcn/utils";

/**
 * 選択式のチップ（見た目は高さ32px、小さい表示は28px。押せる範囲はどちらも上下に広げて44px）
 * @param props - プロパティ
 * @returns チップ
 */
export function Chip(props: {
  /** 選択中か */
  isOn: boolean;
  /** 押せない状態か */
  isDisabled?: boolean;
  /** 小さく表示するか */
  isSmall?: boolean;
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
        "relative inline-flex shrink-0 items-center rounded-full transition after:absolute after:inset-x-0 after:content-[''] active:opacity-60 disabled:opacity-50",
        props.isSmall
          ? "h-7 gap-0.5 px-2.5 text-[13px] after:-inset-y-2"
          : "h-8 gap-1 px-3.5 text-[15px] after:-inset-y-1.5",
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
