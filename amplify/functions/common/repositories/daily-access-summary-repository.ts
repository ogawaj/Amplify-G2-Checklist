import { generateClient } from "aws-amplify/api";

import type { Schema } from "../../../data/resource";

const client = generateClient<Schema>();

/** 日別アクセス集計レコード */
export type DailyAccessSummaryRecord = {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** アクセス数 */
  accessCount: number;
};

/**
 * 日別アクセス集計を保存する（upsert）
 * @param date - 集計対象日（YYYY-MM-DD）
 * @param accessCount - アクセス数
 */
export const upsertSummary = async (
  date: string,
  accessCount: number,
): Promise<void> => {
  const { data: existing } = await client.models.DailyAccessSummary.get({
    date,
  });

  if (existing) {
    await client.models.DailyAccessSummary.update({ date, accessCount });
  } else {
    await client.models.DailyAccessSummary.create({ date, accessCount });
  }
};
