import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/src/lib/shadcn/utils";

/**
 * 詳細画面の上部（スクロールしても残る固定バーと、その下の大きな見出し）
 * @param props - プロパティ
 * @returns ヘッダー
 */
export function DetailHeader(props: {
  /** 見出し */
  title: string;
  /** 戻り先のパス。指定すると左に戻るリンクを出す */
  backHref?: string;
  /** 戻るリンクの代わりに左へ置く操作 */
  leading?: React.ReactNode;
  /** 固定バーの中央（スクロールしても見える状態表示） */
  center?: React.ReactNode;
  /** 見出しの上に出す小さな表示 */
  eyebrow?: React.ReactNode;
  /** 固定バーに色を付けるか（編集中） */
  isTinted?: boolean;
  /** 右側の操作 */
  actions?: React.ReactNode;
}) {
  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-10 flex h-12 items-center gap-1 px-1 backdrop-blur-xl",
          props.isTinted ? "bg-brand-tint/90" : "bg-background/85",
        )}
      >
        {props.backHref ? (
          <Link
            href={props.backHref}
            aria-label="一覧へ戻る"
            className="flex h-11 items-center pr-2 text-[17px] text-brand-text active:opacity-50"
          >
            <ChevronLeft className="size-7" />
            一覧
          </Link>
        ) : (
          (props.leading ?? <span className="w-3" />)
        )}
        <span className="flex min-w-0 flex-1 justify-center">
          {props.center}
        </span>
        {props.actions}
      </header>
      <div className="px-5 pt-1 pb-3">
        {props.eyebrow && <div className="mb-0.5">{props.eyebrow}</div>}
        <h1 className="text-[28px] leading-tight font-bold text-balance break-words">
          {props.title}
        </h1>
      </div>
    </>
  );
}
