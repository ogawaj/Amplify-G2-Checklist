import type { Schema } from "@/amplify/data/resource";

/** 持ち物モデルの型定義 */
export type Item = Schema["Item"]["type"];

/** 持ち物の作成入力。isChecked は省略するとスキーマの既定値（未チェック）になる */
export type ItemCreateInput = Schema["Item"]["createType"] & {
  /** 1日あたりの必要数。省略すると未設定（作成時は null を受け付けない） */
  quantityPerDay?: number;
};

/** 持ち物の更新入力。省略した項目は更新されず、任意項目に null を渡すと未設定に戻す */
export type ItemUpdateInput = Schema["Item"]["updateType"];
