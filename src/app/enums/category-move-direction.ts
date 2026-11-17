/** カテゴリの並び順を移動する方向 */
export const CATEGORY_MOVE_DIRECTION = {
  UP: "UP",
  DOWN: "DOWN",
} as const;

/** カテゴリの移動方向 */
export type CategoryMoveDirection =
  (typeof CATEGORY_MOVE_DIRECTION)[keyof typeof CATEGORY_MOVE_DIRECTION];
