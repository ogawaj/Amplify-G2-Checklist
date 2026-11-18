/** 持ち物の絞り込みで表示から外しているタグ */
export type TagVisibility = {
  /** 選択を外したタグのID */
  hiddenTagIds: readonly string[];
  /** タグのない持ち物を表示から外しているか */
  isUntaggedHidden: boolean;
};
