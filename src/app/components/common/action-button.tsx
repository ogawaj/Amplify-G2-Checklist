import { cn } from "@/src/lib/shadcn/utils";

/** ボタンの種類ごとの配色 */
const VARIANT_CLASS = {
  primary: "bg-primary text-primary-foreground",
  outline: "bg-fill text-foreground",
  danger: "bg-destructive text-white",
  dangerOutline: "bg-destructive-tint text-destructive",
} as const;

/**
 * 角丸の塗りボタン（高さ44px）
 * @param props - プロパティ
 * @returns ボタン
 */
export function ActionButton(props: {
  /** 種類 */
  variant: keyof typeof VARIANT_CLASS;
  /** 押せない状態か */
  isDisabled?: boolean;
  /** 追加のクラス */
  className?: string;
  /** 押したとき */
  onClick: () => void;
  /** 表示 */
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      disabled={props.isDisabled}
      className={cn(
        "inline-flex h-11 items-center justify-center rounded-xl px-5 text-[17px] font-semibold transition active:opacity-60 disabled:opacity-40",
        VARIANT_CLASS[props.variant],
        props.className,
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
