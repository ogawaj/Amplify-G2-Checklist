import type { Schema } from "../../data/resource";
import { getEnvVariable } from "../common/services/env-variable-service";

/**
 * sayHello クエリのハンドラー
 * @param event - AppSync リゾルバーイベント
 * @returns 挨拶メッセージ
 */
export const handler: Schema["cklSayHello"]["functionHandler"] = async (
  event,
) => {
  const envVariable = getEnvVariable();
  const { name } = event.arguments;
  return `Hello, ${name}! (from ${envVariable.ENV_JA_NAME})`;
};
