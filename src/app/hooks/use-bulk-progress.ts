"use client";

import { useCallback, useState } from "react";

import type {
  BulkProgress,
  LabeledBulkProgress,
} from "@/src/app/models/bulk-result";

/**
 * 一括処理の進捗を保持するフック
 * @returns bulkProgress（処理中でなければ null）・trackProgress
 */
export const useBulkProgress = () => {
  const [bulkProgress, setBulkProgress] = useState<LabeledBulkProgress | null>(
    null,
  );

  const trackProgress = useCallback(
    async <T>(
      label: string,
      work: (onProgress: (progress: BulkProgress) => void) => Promise<T>,
    ): Promise<T> => {
      try {
        return await work((progress) => setBulkProgress({ label, progress }));
      } finally {
        setBulkProgress(null);
      }
    },
    [],
  );

  return { bulkProgress, trackProgress };
};
