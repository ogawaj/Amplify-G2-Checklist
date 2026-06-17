export const CACHE_TYPE = {
  TODOS: { id: "todos" },
} as const;

/** SWR キャッシュタイプ */
export type CACHE_TYPE = (typeof CACHE_TYPE)[keyof typeof CACHE_TYPE];
