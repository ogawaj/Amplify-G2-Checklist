import { getAmplifyDataClientConfig } from "@aws-amplify/backend/function/runtime";
import { BATCH_OPERATION } from "@shared/enums/batch-operation";
import { Amplify } from "aws-amplify";

import { env } from "$amplify/env/ckl-aggregate-access";

import type { Schema } from "../../data/resource";
import { aggregateAccess } from "../common/services/aggregation-service";

const { resourceConfig, libraryOptions } =
  await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

/**
 * アクセス集計バッチの Handler
 * @param event - AppSync リゾルバーイベント
 * @returns 集計結果（JSON 文字列）
 */
export const handler: Schema["cklAggregateAccess"]["functionHandler"] = async (
  event,
) => {
  const { type } = event.arguments;

  switch (type) {
    case BATCH_OPERATION.AGGREGATE: {
      const results = await aggregateAccess();
      return JSON.stringify(results);
    }
    default:
      throw new Error(`Unknown operation: ${type}`);
  }
};
