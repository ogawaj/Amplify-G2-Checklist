/** 一括処理の結果。ロールバックはせず、成功分はそのまま残る */
export type BulkResult = {
  /** 成功した件数 */
  successCount: number;
  /** 失敗した件数 */
  failureCount: number;
  /** 失敗の理由（投げられた値のまま。失敗した順ではなく入力順） */
  failureReasons: unknown[];
};

/** 一括処理の進捗 */
export type BulkProgress = {
  /** 完了（成功・失敗を問わず処理を終えた）件数 */
  completedCount: number;
  /** 処理対象の総件数 */
  totalCount: number;
};

/** 書き込み結果を伴う一括処理の結果 */
export type BulkWriteOutcome<T> = {
  /** 成功件数・失敗件数 */
  result: BulkResult;
  /** 書き込みに成功した値（入力順） */
  values: T[];
};

/** 処理内容の名称を伴う一括処理の進捗 */
export type LabeledBulkProgress = {
  /** 処理内容を表す文言（例: 「リセット中」） */
  label: string;
  /** 進捗 */
  progress: BulkProgress;
};
