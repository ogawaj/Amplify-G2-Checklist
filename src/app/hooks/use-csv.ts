"use client";

import { useState } from "react";

import {
  CSV_IMPORT_STEP,
  type CsvImportStep,
} from "@/src/app/enums/csv-import-step";
import { useOperation } from "@/src/app/hooks/use-operation";
import type { BulkProgress, BulkResult } from "@/src/app/models/bulk-result";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";
import type { ImportDiff } from "@/src/app/models/csv";
import { sortCategories } from "@/src/app/services/category-service";
import {
  applyCsvImport,
  buildCsvFileName,
  computeImportDiff,
  generateCsv,
  parseCsv,
} from "@/src/app/services/csv-service";

/** 取り込み結果の画面表示用の情報 */
type ImportOutcome = {
  /** 反映した差分 */
  diff: ImportDiff;
  /** 書き込みの結果 */
  result: BulkResult;
};

/**
 * CSV入出力画面の状態（エクスポート・ファイル解析・差分の保持・取り込み実行）を管理するフック
 * @param detail - 読み込み済みのチェックリスト詳細
 * @returns 取り込みの段階・差分・結果と各操作
 */
export const useCsv = (detail: CheckListDetail) => {
  const { checkList, categories, tags, items } = detail;
  const [step, setStep] = useState<CsvImportStep>(CSV_IMPORT_STEP.SELECT);
  const [fileName, setFileName] = useState("");
  const [diff, setDiff] = useState<ImportDiff | null>(null);
  const [outcome, setOutcome] = useState<ImportOutcome | null>(null);
  const [progress, setProgress] = useState<BulkProgress | null>(null);
  const { isPending, errorMessage, run, reportPartialFailure, clearError } =
    useOperation();

  const exportCsv = () => {
    const text = generateCsv(sortCategories(categories), tags, items);
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = buildCsvFileName(checkList.name, new Date());
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const selectFile = async (file: File): Promise<void> => {
    const isParsed = await run(async () => {
      const text = await file.text();
      setDiff(computeImportDiff(parseCsv(text), categories, tags, items));
      setFileName(file.name);
    }, "ファイルを読み込めませんでした");
    if (isParsed) setStep(CSV_IMPORT_STEP.CONFIRM);
  };

  const cancelImport = () => {
    setDiff(null);
    setFileName("");
    setStep(CSV_IMPORT_STEP.SELECT);
  };

  const executeImport = async (): Promise<void> => {
    if (diff === null) return;
    const target = diff;
    const isDone = await run(async () => {
      const result = await applyCsvImport(
        checkList.id,
        target,
        categories,
        tags,
        items,
        setProgress,
      );
      setOutcome({ diff: target, result });
      reportPartialFailure(null, await detail.reload());
    }, "取り込みを完了できませんでした");
    setProgress(null);
    if (isDone) setStep(CSV_IMPORT_STEP.RESULT);
  };

  const finishImport = () => {
    setDiff(null);
    setOutcome(null);
    setFileName("");
    setStep(CSV_IMPORT_STEP.SELECT);
  };

  return {
    step,
    fileName,
    diff,
    outcome,
    progress,
    isPending,
    errorMessage,
    clearError,
    exportRowCount: items.length,
    exportCsv,
    selectFile,
    cancelImport,
    executeImport,
    finishImport,
  };
};
