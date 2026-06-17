"use client";

import { useState } from "react";

import {
  aggregateAccess,
  type DailyAccessSummary,
} from "@/src/app/services/access-summary-service";

/**
 * アクセス集計バッチ実行フック
 * @returns 集計結果・ローディング状態・実行関数
 */
export const useAggregateAccess = () => {
  const [summaries, setSummaries] = useState<DailyAccessSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const execute = async () => {
    setIsLoading(true);
    try {
      const result = await aggregateAccess();
      setSummaries(result);
    } finally {
      setIsLoading(false);
    }
  };

  return { summaries, isLoading, execute };
};
