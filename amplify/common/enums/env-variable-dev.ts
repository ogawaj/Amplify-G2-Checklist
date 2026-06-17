import type { EnvVariable } from "../models/env-variable";

/** dev 環境の変数定義 */
export const ENV_VARIABLE_DEV: EnvVariable = {
  ENV_NAME: "dev",
} as const;
