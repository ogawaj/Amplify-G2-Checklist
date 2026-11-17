import { X } from "lucide-react";

/**
 * エラーや結果を知らせるバナー。メッセージがないときは何も描画しない
 * @param props - プロパティ
 * @returns バナー
 */
export function NoticeBanner(props: {
  /** 表示するメッセージ */
  message: string | null;
  /** 閉じる操作。指定すると閉じるボタンを出す */
  onDismiss?: () => void;
  /** 色の種類。既定はエラー */
  tone?: "error" | "info";
}) {
  if (props.message === null) return null;
  const toneClass =
    props.tone === "info"
      ? "border-green-300 bg-green-50 text-green-900"
      : "border-red-300 bg-red-50 text-red-900";
  return (
    <div
      role={props.tone === "info" ? "status" : "alert"}
      className={`flex items-start justify-between gap-2 rounded-md border px-3 py-2 text-sm ${toneClass}`}
    >
      <span>{props.message}</span>
      {props.onDismiss && (
        <button
          type="button"
          aria-label="閉じる"
          className="shrink-0 rounded p-1"
          onClick={props.onDismiss}
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
