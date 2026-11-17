import Link from "next/link";

import { CsvFailureList } from "@/src/app/components/csv/csv-failure-list";
import { CsvSummary } from "@/src/app/components/csv/csv-summary";
import type { BulkResult } from "@/src/app/models/bulk-result";
import type { ImportDiff } from "@/src/app/models/csv";
import { Button, buttonVariants } from "@/src/lib/shadcn/ui/button";

/**
 * 取り込み結果の表示（成功件数・失敗件数・取り込めなかった行）
 * @param props - プロパティ
 * @returns 結果表示
 */
export function CsvResult(props: {
  /** 反映した差分 */
  diff: ImportDiff;
  /** 書き込みの結果 */
  result: BulkResult;
  /** チェックリスト詳細へのパス */
  listHref: string;
  /** 入口へ戻る */
  onFinish: () => void;
}) {
  const { diff, result } = props;
  const isAllSucceeded = result.failureCount === 0;
  return (
    <div className="flex flex-col gap-4">
      <p
        role="status"
        className={`rounded-md border p-3 text-sm ${isAllSucceeded ? "border-green-300 bg-green-50 text-green-900" : "border-red-300 bg-red-50 text-red-900"}`}
      >
        {isAllSucceeded
          ? "取り込みが完了しました。"
          : `取り込みを実行しましたが、${result.failureCount}件の書き込みに失敗しました（成功${result.successCount}件）。もう一度ファイルを取り込むと、失敗した分をやり直せます。`}
      </p>
      <CsvSummary
        createCount={diff.creates.length}
        updateCount={diff.updates.length}
        deleteCount={diff.deletes.length}
        failureCount={diff.failures.length}
      />
      <p className="text-sm text-muted-foreground">
        更新された持ち物のチェック状態は取り込み前のまま維持されています。新規登録された持ち物は未チェックです。
      </p>
      <CsvFailureList failures={diff.failures} />
      <div className="flex flex-wrap justify-end gap-2">
        <Button variant="outline" onClick={props.onFinish}>
          続けて入出力する
        </Button>
        <Link href={props.listHref} className={buttonVariants()}>
          チェックリストを開く
        </Link>
      </div>
    </div>
  );
}
