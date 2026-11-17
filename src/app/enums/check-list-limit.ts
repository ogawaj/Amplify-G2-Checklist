/** チェックリストの入力値・一括処理に関する上限値 */
export const CHECK_LIST_LIMIT = {
  /** 日数の最小値 */
  DURATION_DAYS_MIN: 1,
  /** 日数の最大値 */
  DURATION_DAYS_MAX: 60,
  /** 1日あたりの必要数の最小値 */
  QUANTITY_MIN: 1,
  /** 1日あたりの必要数の最大値 */
  QUANTITY_MAX: 999,
  /** CSVに含められる持ち物の最大行数（ヘッダー行を除く） */
  CSV_MAX_ROWS: 500,
  /**
   * 一括処理の同時実行数。AppSyncへの同時リクエストが過大にならない範囲で、
   * 150件規模の一括リセットが3秒以内に収まる値として10とする
   */
  CONCURRENCY: 10,
} as const;
