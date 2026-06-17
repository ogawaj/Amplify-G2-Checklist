"use client";

import { useEffect, useState } from "react";

import {
  createTodo as createTodoService,
  observeTodos,
  sayHello as sayHelloService,
  type Todo,
} from "@/src/app/services/todo-service";

/**
 * Todo 一覧を取得・リアルタイム更新するフック
 * @returns Todo 一覧
 */
export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const sub = observeTodos(setTodos);
    return () => sub.unsubscribe();
  }, []);

  return { todos };
};

/**
 * Todo 作成操作フック
 * @returns Todo 作成関数
 */
export const useCreateTodo = () => {
  const createTodo = async (content: string | null) => {
    await createTodoService(content);
  };
  return { createTodo };
};

/**
 * sayHello Lambda 呼び出しフック
 * @returns greeting メッセージと呼び出し関数
 */
export const useSayHello = () => {
  const [greeting, setGreeting] = useState("");

  const callSayHello = async (name: string) => {
    const result = await sayHelloService(name);
    setGreeting(result);
  };

  return { greeting, callSayHello };
};
