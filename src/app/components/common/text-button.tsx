import { cn } from "@/src/lib/shadcn/utils";

/**
 * 差し色の文字ボタン（高さ44px。ヘッダーやシートの「完了」など）
 * @param props - プロパティ
 * @returns ボタン
 */
export function TextButton(props: {
  /** 太字にするか（完了など） */
  isStrong?: boolean;
  /** 押したとき */
  onClick: () => void;
  /** 表示 */
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={cn(
        "h-11 px-3 text-[17px] text-brand-text active:opacity-50",
        props.isStrong && "font-semibold",
      )}
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
