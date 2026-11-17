import type { BulkProgress } from "@/src/app/models/bulk-result";

/**
 * 一括処理の進捗表示。進捗がないときは何も描画しない
 * @param props - プロパティ
 * @returns 進捗表示
 */
export function BulkProgressBar(props: {
  /** 処理内容を表す文言（例: 「複製中」） */
  label: string;
  /** 進捗。処理中でなければ null */
  progress: BulkProgress | null;
}) {
  if (props.progress === null) return null;
  const { completedCount, totalCount } = props.progress;
  return (
    <div role="status" className="mb-4 rounded-md border px-3 py-2 text-sm">
      <p>
        {props.label}... {completedCount} / {totalCount}
      </p>
      <progress
        className="mt-1 h-2 w-full"
        value={completedCount}
        max={Math.max(totalCount, 1)}
      />
    </div>
  );
}
