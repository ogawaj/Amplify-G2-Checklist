import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { BATCH_OPERATION } from "@/shared/enums/batch-operation";

/**
 * アクセス集計バッチを実行する
 * @param type - 操作タイプ
 * @returns レスポンスデータ
 */
export const callApiAggregateAccess = async (type: BATCH_OPERATION) => {
  const client = generateClient<Schema>();
  const { data } = await client.queries.cklAggregateAccess({ type });
  return data;
};
