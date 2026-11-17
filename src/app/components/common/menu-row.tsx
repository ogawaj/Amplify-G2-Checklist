import Link from "next/link";

import { cn } from "@/src/lib/shadcn/utils";

/** メニュー行のクラス（灰色のまとまりとして上下がつながる） */
const MENU_ROW_CLASS =
  "flex min-h-12 w-full items-center gap-3 bg-fill px-4 py-2 text-left text-[17px] first:rounded-t-xl last:rounded-b-xl active:bg-fill-strong disabled:opacity-40";

/**
 * シートのメニュー行（灰色のまとまりとして並べる）。href を指定するとリンクになる
 * @param props - プロパティ
 * @returns メニュー行
 */
export function MenuRow(props: {
  /** 先頭のアイコン */
  icon?: React.ReactNode;
  /** 遷移先。指定するとリンクになる */
  href?: string;
  /** 押せない状態か（ボタンのときのみ） */
  isDisabled?: boolean;
  /** 押したとき */
  onClick?: () => void;
  /** 追加のクラス */
  className?: string;
  /** 表示 */
  children: React.ReactNode;
}) {
  const content = (
    <>
      {props.icon && (
        <span className="shrink-0 text-brand-text [&_svg]:size-[22px]">
          {props.icon}
        </span>
      )}
      {props.children}
    </>
  );
  if (props.href !== undefined) {
    return (
      <Link
        href={props.href}
        className={cn(MENU_ROW_CLASS, props.className)}
        onClick={props.onClick}
      >
        {content}
      </Link>
    );
  }
  return (
    <button
      type="button"
      disabled={props.isDisabled}
      className={cn(MENU_ROW_CLASS, props.className)}
      onClick={props.onClick}
    >
      {content}
    </button>
  );
}
