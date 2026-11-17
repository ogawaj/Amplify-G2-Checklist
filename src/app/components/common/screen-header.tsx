import { ChevronLeft } from "lucide-react";
import Link from "next/link";

/**
 * 画面見出し（戻る導線・タイトル・補足・操作）
 * @param props - プロパティ
 * @returns 見出し
 */
export function ScreenHeader(props: {
  /** 戻り先のパス。省略すると戻る導線を出さない */
  backHref?: string;
  /** タイトル（文字列、または直接入力欄などの要素） */
  title: React.ReactNode;
  /** タイトル下の補足 */
  subtitle?: React.ReactNode;
  /** 右端に並べる操作 */
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      {props.backHref && (
        <Link
          href={props.backHref}
          aria-label="戻る"
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-md hover:bg-accent md:size-9"
        >
          <ChevronLeft className="size-5" />
        </Link>
      )}
      <div className="min-w-0 flex-1">
        <h1 className="truncate text-lg font-semibold">{props.title}</h1>
        {props.subtitle && (
          <p className="text-sm text-muted-foreground">{props.subtitle}</p>
        )}
      </div>
      {props.actions && (
        <div className="flex shrink-0 items-center gap-1">{props.actions}</div>
      )}
    </div>
  );
}
