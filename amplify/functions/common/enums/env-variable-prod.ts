import type { EnvVariable } from "../models/env-variable";

/** prod 環境の変数定義 */
export const ENV_VARIABLE_PROD: EnvVariable = {
  ENV_JA_NAME: "本番",
} as const;
