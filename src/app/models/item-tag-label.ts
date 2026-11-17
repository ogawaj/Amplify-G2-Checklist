/** 持ち物の行に出す行き先の表示 */
export type ItemTagLabel = {
  /** 表示する文言 */
  text: string;
  /** 行き先を持たない持ち物（絞り込み中の「共通」）か */
  isCommon: boolean;
};
