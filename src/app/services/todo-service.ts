import {
  type ApiTodo,
  callApiSayHello,
  createApiTodo,
  observeApiTodos,
} from "@/src/app/repositories/todo-repository";

/** Todo モデルの型定義 */
export type Todo = ApiTodo;

/**
 * Todo のリアルタイム監視を開始する
 * @param callback - Todo 一覧の更新コールバック
 * @returns サブスクリプション
 */
export const observeTodos = (callback: (todos: Todo[]) => void) => {
  return observeApiTodos(callback);
};

/**
 * Todo を作成する
 * @param content - Todo の内容
 * @returns 作成結果
 */
export const createTodo = async (content: string | null) => {
  return await createApiTodo(content);
};

/**
 * sayHello Lambda 関数を呼び出す
 * @param name - 名前
 * @returns 挨拶メッセージ
 */
export const sayHello = async (name: string) => {
  const data = await callApiSayHello(name);
  return data ?? "";
};
