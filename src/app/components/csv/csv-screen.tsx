"use client";

import { BulkProgressBar } from "@/src/app/components/common/bulk-progress-bar";
import { DetailLoader } from "@/src/app/components/common/detail-loader";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { ScreenHeader } from "@/src/app/components/common/screen-header";
import { CsvConfirm } from "@/src/app/components/csv/csv-confirm";
import { CsvEntry } from "@/src/app/components/csv/csv-entry";
import { CsvResult } from "@/src/app/components/csv/csv-result";
import { CSV_IMPORT_STEP } from "@/src/app/enums/csv-import-step";
import { useCsv } from "@/src/app/hooks/use-csv";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import { buildListPath } from "@/src/app/utils/list-path-utils";

/**
 * CSV入出力画面の本体
 * @param props - プロパティ
 * @returns CSV入出力画面
 */
function CsvBody(props: {
  /** 読み込み済みのチェックリスト詳細 */
  detail: CheckListDetail;
}) {
  const { checkList } = props.detail;
  const csv = useCsv(props.detail);
  const listHref = buildListPath(checkList.id);

  return (
    <div className="flex flex-col gap-3">
      <ScreenHeader
        backHref={listHref}
        title="CSV入出力"
        subtitle={checkList.name}
      />
      <NoticeBanner message={csv.errorMessage} onDismiss={csv.clearError} />
      <BulkProgressBar label="取り込み中" progress={csv.progress} />
      {csv.step === CSV_IMPORT_STEP.SELECT && (
        <CsvEntry
          rowCount={csv.exportRowCount}
          isBusy={csv.isPending}
          onExport={csv.exportCsv}
          onSelectFile={(file) => void csv.selectFile(file)}
        />
      )}
      {csv.step === CSV_IMPORT_STEP.CONFIRM && csv.diff && (
        <CsvConfirm
          fileName={csv.fileName}
          checkListName={checkList.name}
          diff={csv.diff}
          isBusy={csv.isPending}
          onExecute={() => void csv.executeImport()}
          onCancel={csv.cancelImport}
        />
      )}
      {csv.step === CSV_IMPORT_STEP.RESULT && csv.outcome && (
        <CsvResult
          diff={csv.outcome.diff}
          result={csv.outcome.result}
          listHref={listHref}
          onFinish={csv.finishImport}
        />
      )}
    </div>
  );
}

/**
 * CSV入出力画面（S-09）。パソコン幅でのみ操作でき、スマートフォン幅では案内を表示する
 * @param props - プロパティ
 * @returns CSV入出力画面
 */
export function CsvScreen(props: {
  /** チェックリストID */
  listId: string;
}) {
  return (
    <>
      <div className="md:hidden">
        <ScreenHeader
          backHref={buildListPath(props.listId)}
          title="CSV入出力"
        />
        <p className="rounded-md border p-4 text-sm">
          CSV入出力はパソコンでご利用ください。
        </p>
      </div>
      <div className="hidden md:block">
        <DetailLoader listId={props.listId}>
          {(detail) => <CsvBody detail={detail} />}
        </DetailLoader>
      </div>
    </>
  );
}
