/** CSV取り込みの進行段階 */
export const CSV_IMPORT_STEP = {
  SELECT: "SELECT",
  CONFIRM: "CONFIRM",
  RESULT: "RESULT",
} as const;

/** CSV取り込みの進行段階 */
export type CsvImportStep =
  (typeof CSV_IMPORT_STEP)[keyof typeof CSV_IMPORT_STEP];
