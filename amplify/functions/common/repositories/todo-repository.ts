import { generateClient } from "aws-amplify/api";

import type { Schema } from "../../../data/resource";

const client = generateClient<Schema>();

/** Todo モデルの型定義 */
export type TodoRecord = Schema["Todo"]["type"];

/**
 * Todo テーブルから全件取得する（ページネーション対応）
 * @returns Todo レコード一覧
 */
export const listAllTodos = async (): Promise<TodoRecord[]> => {
  const items: TodoRecord[] = [];
  let nextToken: string | null | undefined;

  do {
    const result = await client.models.Todo.list({
      nextToken: nextToken ?? undefined,
    });
    items.push(...result.data);
    nextToken = result.nextToken;
  } while (nextToken);

  return items;
};
