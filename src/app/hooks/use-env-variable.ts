"use client";

import { getEnvVariable } from "@/src/app/services/env-variable-service";

/**
 * フロントエンド環境変数を取得するフック
 * @returns envVariable - 環境変数
 */
export const useEnvVariable = () => {
  const envVariable = getEnvVariable();
  return { envVariable };
};
