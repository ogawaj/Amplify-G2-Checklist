/** 画面下部に出す通知の内容。undo があると［元に戻す］を併せて出す */
export type UndoToastContent = {
  /** 表示する文言 */
  message: string;
  /** ［元に戻す］で行う処理。取り消せない通知では undefined */
  undo?: () => void;
};
