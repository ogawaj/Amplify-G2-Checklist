import type { EnvVariable } from "../models/env-variable";

/** sandbox 環境の変数定義（このファイルをコピーして env-variable-sandbox.ts を作成してください） */
export const ENV_VARIABLE_SANDBOX: EnvVariable = {
  ENV_NAME: "sandbox",
} as const;
