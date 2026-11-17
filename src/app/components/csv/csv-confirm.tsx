"use client";

import { useState } from "react";

import { ConfirmDialog } from "@/src/app/components/common/confirm-dialog";
import { CsvFailureList } from "@/src/app/components/csv/csv-failure-list";
import { CsvSummary } from "@/src/app/components/csv/csv-summary";
import type { ImportDiff } from "@/src/app/models/csv";
import { Button } from "@/src/lib/shadcn/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/lib/shadcn/ui/table";

/**
 * 取り込み前の確認（件数・取り込まれる内容・取り込めない行）
 * @param props - プロパティ
 * @returns 確認表示
 */
export function CsvConfirm(props: {
  /** 選択したファイル名 */
  fileName: string;
  /** チェックリスト名 */
  checkListName: string;
  /** 取り込みによる差分 */
  diff: ImportDiff;
  /** 取り込み中か */
  isBusy: boolean;
  /** 取り込みの実行 */
  onExecute: () => void;
  /** 取り込みの取りやめ */
  onCancel: () => void;
}) {
  const { diff } = props;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const label = `新規${diff.creates.length}・更新${diff.updates.length}・削除${diff.deletes.length}`;
  const writeCount =
    diff.creates.length + diff.updates.length + diff.deletes.length;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm">
        {props.fileName} ／ 取り込み先: {props.checkListName}
      </p>
      <CsvSummary
        createCount={diff.creates.length}
        updateCount={diff.updates.length}
        deleteCount={diff.deletes.length}
        unchangedCount={diff.unchanged.length}
        failureCount={diff.failures.length}
      />
      <div>
        <h3 className="mb-1 text-sm font-semibold">取り込まれる内容</h3>
        <div className="max-h-96 overflow-auto rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>行</TableHead>
                <TableHead>扱い</TableHead>
                <TableHead>カテゴリ</TableHead>
                <TableHead>持ち物名</TableHead>
                <TableHead>数量</TableHead>
                <TableHead>タグ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {diff.creates.map((row) => (
                <TableRow key={`create-${row.rowNumber}`}>
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell>新規</TableCell>
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>{row.itemName}</TableCell>
                  <TableCell>
                    {row.quantityPerDay === null
                      ? "なし"
                      : `${row.quantityPerDay}/日`}
                  </TableCell>
                  <TableCell>{row.tagNames.join(";")}</TableCell>
                </TableRow>
              ))}
              {diff.updates.map(({ row, item }) => (
                <TableRow key={`update-${row.rowNumber}`}>
                  <TableCell>{row.rowNumber}</TableCell>
                  <TableCell>更新</TableCell>
                  <TableCell>{row.categoryName}</TableCell>
                  <TableCell>
                    {row.itemName}
                    {row.itemName !== item.name && (
                      <span className="block text-xs text-muted-foreground">
                        変更前: {item.name}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.quantityPerDay === null
                      ? "なし"
                      : `${row.quantityPerDay}/日`}
                    {row.quantityPerDay !== (item.quantityPerDay ?? null) && (
                      <span className="block text-xs text-muted-foreground">
                        変更前: {item.quantityPerDay ?? "なし"}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>{row.tagNames.join(";")}</TableCell>
                </TableRow>
              ))}
              {diff.deletes.map((item) => (
                <TableRow key={`delete-${item.id}`}>
                  <TableCell>—</TableCell>
                  <TableCell className="text-destructive">削除</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>—</TableCell>
                  <TableCell>CSVに行がないため削除</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
      <CsvFailureList failures={diff.failures} />
      {diff.deletes.length > 0 && (
        <p
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-900"
        >
          CSVに行がないため、既存の持ち物{diff.deletes.length}
          件が削除されます。削除される持ち物のチェック状態も併せて失われます。この操作は取り消せません。
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="outline"
          disabled={props.isBusy}
          onClick={props.onCancel}
        >
          キャンセル
        </Button>
        <Button
          disabled={props.isBusy || writeCount === 0}
          onClick={() =>
            diff.deletes.length > 0
              ? setIsDeleteDialogOpen(true)
              : props.onExecute()
          }
        >
          この内容で取り込む（{label}）
        </Button>
      </div>
      <ConfirmDialog
        open={isDeleteDialogOpen}
        title={`既存の持ち物${diff.deletes.length}件を削除して取り込みますか？`}
        description={`CSVに現れなかった持ち物${diff.deletes.length}件を削除します（${label}）。この操作は取り消せません。`}
        confirmLabel="取り込む"
        isPending={props.isBusy}
        onCancel={() => setIsDeleteDialogOpen(false)}
        onConfirm={() => {
          setIsDeleteDialogOpen(false);
          props.onExecute();
        }}
      />
    </div>
  );
}
