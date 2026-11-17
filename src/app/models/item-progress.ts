/** 持ち物の準備状況の集計 */
export type ItemProgress = {
  /** 準備済み（チェック済み）の件数 */
  checkedCount: number;
  /** 総件数 */
  totalCount: number;
};
