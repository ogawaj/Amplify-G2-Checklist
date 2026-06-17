import { ENV_VARIABLE_DEV } from "../enums/env-variable-dev";
import { ENV_VARIABLE_PROD } from "../enums/env-variable-prod";
import { ENV_VARIABLE_SANDBOX } from "../enums/env-variable-sandbox";
import { ENV_VARIABLE_STAG } from "../enums/env-variable-stag";
import { EnvVariable } from "../models/env-variable";

const ENV_MAP: Record<string, EnvVariable> = {
  dev: ENV_VARIABLE_DEV,
  stag: ENV_VARIABLE_STAG,
  prod: ENV_VARIABLE_PROD,
  sandbox: ENV_VARIABLE_SANDBOX,
};

/**
 * 環境名に対応する環境変数を取得する
 * @returns 環境変数
 */
export const getEnvVariable = (): EnvVariable => {
  const env = process.env.ENV;
  if (!env) {
    throw new Error(`env環境名が未設定です: ${env}`);
  }
  const envVariable = ENV_MAP[env];
  if (!envVariable) {
    throw new Error(`未定義の環境です: ${env}`);
  }
  return envVariable;
};
