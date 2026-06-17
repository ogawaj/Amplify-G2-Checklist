import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";

/** Todo モデルの型定義 */
export type ApiTodo = Schema["Todo"]["type"];

/**
 * Todo のリアルタイム監視を開始する
 * @param callback - Todo 一覧の更新コールバック
 * @returns サブスクリプション
 */
export const observeApiTodos = (callback: (todos: ApiTodo[]) => void) => {
  const client = generateClient<Schema>();
  return client.models.Todo.observeQuery().subscribe({
    next: (data) => callback([...data.items]),
  });
};

/**
 * Todo を作成する
 * @param content - Todo の内容
 * @returns 作成結果
 */
export const createApiTodo = async (content: string | null) => {
  const client = generateClient<Schema>();
  return await client.models.Todo.create({ content });
};

/**
 * sayHello Lambda 関数を呼び出す
 * @param name - 名前
 * @returns レスポンスデータ
 */
export const callApiSayHello = async (name: string) => {
  const client = generateClient<Schema>();
  const { data } = await client.queries.cklSayHello({ name });
  return data;
};
