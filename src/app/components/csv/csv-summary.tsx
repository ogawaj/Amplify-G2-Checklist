/**
 * 取り込み差分の件数サマリ
 * @param props - プロパティ
 * @returns 件数の並び
 */
export function CsvSummary(props: {
  /** 新規登録の件数 */
  createCount: number;
  /** 更新の件数 */
  updateCount: number;
  /** 削除の件数 */
  deleteCount: number;
  /** 取り込めない行の件数 */
  failureCount: number;
  /** 変更なしの件数。省略すると表示しない */
  unchangedCount?: number;
}) {
  const entries = [
    { label: "新規登録", count: props.createCount },
    { label: "更新", count: props.updateCount },
    { label: "削除", count: props.deleteCount },
    { label: "取り込めない行", count: props.failureCount },
  ];
  if (props.unchangedCount !== undefined) {
    entries.splice(2, 0, { label: "変更なし", count: props.unchangedCount });
  }
  return (
    <dl className="grid grid-cols-2 gap-2 md:grid-cols-5">
      {entries.map((entry) => (
        <div key={entry.label} className="rounded-md border p-3 text-center">
          <dd className="text-2xl font-semibold">{entry.count}</dd>
          <dt className="text-xs text-muted-foreground">{entry.label}</dt>
        </div>
      ))}
    </dl>
  );
}
