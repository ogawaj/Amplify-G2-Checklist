import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "@/src/lib/shadcn/utils";

/**
 * 詳細画面の上部の固定バー（中央に見出しと状態表示を2段で出す）
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
  /** 見出しの下に出す状態表示 */
  subtitle: React.ReactNode;
  /** 固定バーに色を付けるか（編集中） */
  isTinted?: boolean;
  /** 右側の操作 */
  actions?: React.ReactNode;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-10 flex h-14 items-center gap-1 px-1 backdrop-blur-xl",
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
      <div className="flex min-w-0 flex-1 flex-col items-center">
        <h1 className="max-w-full truncate text-[17px] leading-tight font-semibold">
          {props.title}
        </h1>
        {props.subtitle}
      </div>
      {props.actions}
    </header>
  );
}
