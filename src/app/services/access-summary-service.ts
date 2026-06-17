import { BATCH_OPERATION } from "@/shared/enums/batch-operation";
import { callApiAggregateAccess } from "@/src/app/repositories/access-summary-repository";

/** 日別アクセス集計の型定義 */
export type DailyAccessSummary = {
  /** 集計対象日（YYYY-MM-DD） */
  date: string;
  /** アクセス数（ユニーク owner 数） */
  accessCount: number;
};

/**
 * アクセス集計バッチを実行し、結果を返す
 * @returns 日別アクセス集計一覧
 */
export const aggregateAccess = async (): Promise<DailyAccessSummary[]> => {
  const data = await callApiAggregateAccess(BATCH_OPERATION.AGGREGATE);
  return data ? (JSON.parse(data) as DailyAccessSummary[]) : [];
};
