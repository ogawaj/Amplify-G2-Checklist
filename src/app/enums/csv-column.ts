/** CSVの列定義。宣言順がそのまま出力時の列順になる */
export const CSV_COLUMN = {
  ITEM_ID: { header: "識別子" },
  CATEGORY: { header: "カテゴリ" },
  ITEM_NAME: { header: "持ち物名" },
  QUANTITY_PER_DAY: { header: "1日あたり" },
  TAGS: { header: "タグ" },
} as const;
