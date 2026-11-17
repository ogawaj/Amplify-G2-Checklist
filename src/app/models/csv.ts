import type { Item } from "@/src/app/models/item";

/** CSVの1行（形式検証済みの持ち物1件） */
export type CsvRow = {
  /** 行番号（ヘッダー行を1行目とする。表計算ソフトの行番号に一致する） */
  rowNumber: number;
  /** 持ち物の識別子。空欄（新規登録）は null */
  itemId: string | null;
  /** カテゴリ名 */
  categoryName: string;
  /** 持ち物名 */
  itemName: string;
  /** 1日あたりの必要数。空欄は null */
  quantityPerDay: number | null;
  /** タグ名（重複なし） */
  tagNames: string[];
};

/** 形式不備のためCSVから除外された行 */
export type CsvParseFailure = {
  /** 行番号（ヘッダー行を1行目とする） */
  rowNumber: number;
  /** 行に書かれていた識別子。空欄または読み取れない場合は null */
  itemId: string | null;
  /** 除外した理由 */
  reason: string;
};

/** CSVの解析結果 */
export type CsvParseResult = {
  /** 形式に問題のなかった行 */
  rows: CsvRow[];
  /** 形式不備の行 */
  failures: CsvParseFailure[];
};

/** 内容に差がある既存持ち物の更新 */
type CsvImportUpdate = {
  /** 反映するCSVの行 */
  row: CsvRow;
  /** 更新前の持ち物 */
  item: Item;
};

/** CSV取り込みによる既存データとの差分 */
export type ImportDiff = {
  /** 新規登録する行 */
  creates: CsvRow[];
  /** 更新する持ち物 */
  updates: CsvImportUpdate[];
  /** 内容に差がなく、書き込みを行わない行 */
  unchanged: CsvRow[];
  /** CSVに現れなかったため削除する既存の持ち物 */
  deletes: Item[];
  /** 形式不備で取り込まない行 */
  failures: CsvParseFailure[];
};
