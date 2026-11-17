"use client";

import { Download, Upload } from "lucide-react";
import { useRef } from "react";

import { Button } from "@/src/lib/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/lib/shadcn/ui/card";

/**
 * CSV入出力の入口（エクスポートと、取り込みファイルの選択・注意表示）
 * @param props - プロパティ
 * @returns 入口
 */
export function CsvEntry(props: {
  /** エクスポートされる持ち物の件数 */
  rowCount: number;
  /** 操作を受け付けない状態か */
  isBusy: boolean;
  /** エクスポートの実行 */
  onExport: () => void;
  /** 取り込みファイルの選択 */
  onSelectFile: (file: File) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>CSVエクスポート</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            登録済みの持ち物をCSVとして書き出します。表計算ソフトで編集し、そのまま取り込み直せます。
          </p>
          <p className="text-muted-foreground">
            列は「識別子,カテゴリ,持ち物名,1日あたり,タグ」です。文字コードはBOM付きUTF-8で、表計算ソフトで開いても日本語が文字化けしません。「1日あたり」が空欄の行は数量なしの持ち物です。タグは「;」区切りです。
          </p>
          <Button onClick={props.onExport}>
            <Download />
            CSVをダウンロード（{props.rowCount}行）
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>CSVインポート</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 text-sm">
          <p>
            CSVファイルから持ち物を取り込みます。取り込み前に内容を確認できます。
          </p>
          <div
            role="note"
            className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900"
          >
            <p className="font-medium">
              取り込み後の持ち物はCSVの内容と一致します。
            </p>
            <ul className="mt-1 list-disc pl-5">
              <li>
                識別子が一致する行は更新、識別子が空の行は新規登録します。
              </li>
              <li>CSVに現れなかった既存の持ち物は削除されます。</li>
              <li>
                識別子の列は書き換えないでください。書き換えた行・消した行は別の持ち物として扱われ、元の持ち物は削除されチェック状態も失われます。
              </li>
              <li>
                まずエクスポートし、そのファイルを編集して取り込んでください。
              </li>
            </ul>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            aria-label="取り込むCSVファイル"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) props.onSelectFile(file);
            }}
          />
          <Button
            variant="outline"
            disabled={props.isBusy}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload />
            ファイルを選択して内容を確認する
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
