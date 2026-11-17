import { CHECK_LIST_LIMIT } from "@/src/app/enums/check-list-limit";
import { CSV_COLUMN } from "@/src/app/enums/csv-column";
import type { BulkProgress, BulkResult } from "@/src/app/models/bulk-result";
import type { Category } from "@/src/app/models/category";
import type {
  CsvParseFailure,
  CsvParseResult,
  CsvRow,
  ImportDiff,
} from "@/src/app/models/csv";
import type { Item } from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import { createCategory } from "@/src/app/repositories/category-repository";
import { deleteItem } from "@/src/app/repositories/item-repository";
import { createTag } from "@/src/app/repositories/tag-repository";
import {
  createProgressTicker,
  mapConcurrently,
  toBulkResult,
} from "@/src/app/services/concurrency-service";
import {
  createItem,
  getItemTagIds,
  isValidQuantityPerDay,
  prepareAppendSortOrder,
  updateItem,
} from "@/src/app/services/item-service";
import { keyBy } from "@/src/app/utils/array-utils";
import { parseInteger } from "@/src/app/utils/integer-utils";

/** UTF-8のBOM。表計算ソフトで開いた際の文字化けを防ぐために先頭へ付ける */
const BOM = "﻿";

/** CSVの改行 */
const CSV_NEWLINE = "\r\n";

/** タグ列の区切り文字 */
const TAG_SEPARATOR = ";";

/** 列順に並べたヘッダー文字列 */
const HEADERS = Object.values(CSV_COLUMN).map((column) => column.header);

/** ファイル名に使えない文字 */
const UNSAFE_FILE_NAME_CHARS = /[\\/:*?"<>|\r\n]/g;

/**
 * 値にカンマ・改行・引用符が含まれる場合にダブルクォートで囲む
 * @param value - セルの値
 * @returns CSVのセル文字列
 */
const escapeCell = (value: string): string =>
  /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;

/**
 * 持ち物をCSV文字列にする。渡されたカテゴリの順、同一カテゴリ内は渡された持ち物の順に出力する
 * @param categories - チェックリストの全カテゴリ（出力順に並べたもの）
 * @param tags - チェックリストの全タグ
 * @param items - 出力する持ち物
 * @returns BOM付き・CRLF区切りのCSV文字列
 * @throws {Error} 持ち物の所属カテゴリまたはタグが存在しない場合
 */
export const generateCsv = (
  categories: readonly Category[],
  tags: readonly Tag[],
  items: readonly Item[],
): string => {
  const tagsById = keyBy(tags, (tag) => tag.id);
  const lines: string[][] = [HEADERS];
  for (const category of categories) {
    for (const item of items.filter((i) => i.categoryId === category.id)) {
      const tagNames = getItemTagIds(item).map((tagId) => {
        const tag = tagsById.get(tagId);
        if (!tag) throw new Error(`タグが見つかりません: ${tagId}`);
        return tag.name;
      });
      lines.push([
        item.id,
        category.name,
        item.name,
        item.quantityPerDay === null || item.quantityPerDay === undefined
          ? ""
          : String(item.quantityPerDay),
        tagNames.join(TAG_SEPARATOR),
      ]);
    }
  }
  const exportedIds = new Set(categories.map((category) => category.id));
  const orphan = items.find((item) => !exportedIds.has(item.categoryId));
  if (orphan) {
    throw new Error(`持ち物の所属カテゴリが見つかりません: ${orphan.id}`);
  }
  return (
    BOM +
    lines.map((line) => line.map(escapeCell).join(",")).join(CSV_NEWLINE) +
    CSV_NEWLINE
  );
};

/**
 * エクスポートするCSVのファイル名を組み立てる
 * @param checkListName - チェックリスト名（ファイル名に使えない文字は _ に置き換える）
 * @param date - ファイル名に入れる日付
 * @returns `checklist_{チェックリスト名}_{YYYYMMDD}.csv`
 */
export const buildCsvFileName = (checkListName: string, date: Date): string => {
  const yyyy = String(date.getFullYear());
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const safeName = checkListName.replace(UNSAFE_FILE_NAME_CHARS, "_");
  return `checklist_${safeName}_${yyyy}${mm}${dd}.csv`;
};

/**
 * CSV文字列をレコード（セル配列）に分解する。引用符内のカンマ・改行・`""` を解釈する
 * @param text - BOM除去済みのCSV文字列
 * @returns レコードの配列（空行も1レコードとして含む）
 */
const splitRecords = (text: string): string[][] => {
  const records: string[][] = [];
  let record: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        cell += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      record.push(cell);
      cell = "";
    } else if (char === "\r" || char === "\n") {
      if (char === "\r" && text[i + 1] === "\n") i++;
      record.push(cell);
      records.push(record);
      record = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || record.length > 0) {
    record.push(cell);
    records.push(record);
  }
  return records;
};

/**
 * CSV文字列を持ち物の行に解析する
 *
 * 全セルが空のレコードは無視する。形式不備の行は失敗として行番号と理由を返し、取り込み対象から除く。
 * 識別子が同一ファイル内で重複する場合は、2行目以降を失敗とする。
 * @param text - CSVファイルの内容（先頭のBOMは取り除く）
 * @returns 正常行と失敗行
 * @throws {UserFacingError} ヘッダー行が想定と異なる場合、または行数が上限を超える場合
 */
export const parseCsv = (text: string): CsvParseResult => {
  const [header, ...dataRecords] = splitRecords(
    text.startsWith(BOM) ? text.slice(BOM.length) : text,
  );
  if (
    !header ||
    header.length !== HEADERS.length ||
    header.some((cell, i) => cell.trim() !== HEADERS[i])
  ) {
    throw new UserFacingError(
      `ヘッダー行は「${HEADERS.join(",")}」としてください`,
    );
  }
  const numbered = dataRecords
    .map((cells, i) => ({ cells, rowNumber: i + 2 }))
    .filter(({ cells }) => cells.some((cell) => cell.trim() !== ""));
  if (numbered.length > CHECK_LIST_LIMIT.CSV_MAX_ROWS) {
    throw new UserFacingError(
      `行数が上限（${CHECK_LIST_LIMIT.CSV_MAX_ROWS}行）を超えています`,
    );
  }

  const rows: CsvRow[] = [];
  const failures: CsvParseFailure[] = [];
  const seenIds = new Set<string>();
  for (const { cells, rowNumber } of numbered) {
    const itemId = (cells[0] ?? "").trim() || null;
    const fail = (reason: string) =>
      failures.push({ rowNumber, itemId, reason });
    if (cells.length !== HEADERS.length) {
      fail(`列数が${HEADERS.length}列ではありません`);
      continue;
    }
    const [, categoryCell, nameCell, quantityCell, tagsCell] = cells;
    const categoryName = categoryCell.trim();
    const itemName = nameCell.trim();
    const quantityText = quantityCell.trim();
    if (categoryName === "") {
      fail("カテゴリが空です");
      continue;
    }
    if (itemName === "") {
      fail("持ち物名が空です");
      continue;
    }
    const quantityPerDay =
      quantityText === "" ? null : parseInteger(quantityText);
    if (
      quantityText !== "" &&
      (quantityPerDay === null || !isValidQuantityPerDay(quantityPerDay))
    ) {
      fail(
        `1日あたりは${CHECK_LIST_LIMIT.QUANTITY_MIN}〜${CHECK_LIST_LIMIT.QUANTITY_MAX}の整数で指定してください`,
      );
      continue;
    }
    if (itemId !== null && seenIds.has(itemId)) {
      fail("識別子が他の行と重複しています");
      continue;
    }
    if (itemId !== null) seenIds.add(itemId);
    const tagNames = tagsCell
      .split(TAG_SEPARATOR)
      .map((tagName) => tagName.trim())
      .filter((tagName) => tagName !== "")
      .filter((tagName, i, all) => all.indexOf(tagName) === i);
    rows.push({
      rowNumber,
      itemId,
      categoryName,
      itemName,
      quantityPerDay,
      tagNames,
    });
  }
  return { rows, failures };
};

/**
 * 既存の持ち物がCSVの行と同じ内容かを判定する（チェック状態は比較しない）
 * @param row - CSVの行
 * @param item - 既存の持ち物
 * @param categoryNames - カテゴリIDからカテゴリ名を引く Map
 * @param tagNames - タグIDからタグ名を引く Map
 * @returns 内容が一致すれば true
 * @throws {Error} 持ち物の所属カテゴリまたはタグが存在しない場合
 */
const isSameContent = (
  row: CsvRow,
  item: Item,
  categoryNames: ReadonlyMap<string, string>,
  tagNames: ReadonlyMap<string, string>,
): boolean => {
  const categoryName = categoryNames.get(item.categoryId);
  if (categoryName === undefined) {
    throw new Error(`持ち物の所属カテゴリが見つかりません: ${item.id}`);
  }
  const itemTagNames = getItemTagIds(item).map((tagId) => {
    const tagName = tagNames.get(tagId);
    if (tagName === undefined)
      throw new Error(`タグが見つかりません: ${tagId}`);
    return tagName;
  });
  return (
    row.categoryName === categoryName &&
    row.itemName === item.name &&
    row.quantityPerDay === (item.quantityPerDay ?? null) &&
    row.tagNames.length === itemTagNames.length &&
    row.tagNames.every((tagName) => itemTagNames.includes(tagName))
  );
};

/**
 * 解析結果と既存データを突き合わせ、取り込みによる差分を求める。書き込みは行わない
 *
 * 識別子が空欄、または既存の持ち物に存在しない行は新規登録とする。
 * 形式不備の行が識別子を持つ場合、その識別子の既存の持ち物は削除対象から外す。
 * @param parsed - {@link parseCsv} の結果
 * @param categories - チェックリストの全カテゴリ
 * @param tags - チェックリストの全タグ
 * @param items - チェックリストの既存の持ち物
 * @returns 新規・更新・変更なし・削除・失敗の分類
 * @throws {Error} 既存の持ち物の所属カテゴリまたはタグが存在しない場合
 */
export const computeImportDiff = (
  parsed: CsvParseResult,
  categories: readonly Category[],
  tags: readonly Tag[],
  items: readonly Item[],
): ImportDiff => {
  const itemsById = keyBy(items, (item) => item.id);
  const categoryNames = new Map(categories.map((c) => [c.id, c.name]));
  const tagNames = new Map(tags.map((t) => [t.id, t.name]));
  const diff: ImportDiff = {
    creates: [],
    updates: [],
    unchanged: [],
    deletes: [],
    failures: parsed.failures,
  };
  const retainedIds = new Set<string>();
  for (const failure of parsed.failures) {
    if (failure.itemId !== null) retainedIds.add(failure.itemId);
  }
  for (const row of parsed.rows) {
    const item = row.itemId === null ? undefined : itemsById.get(row.itemId);
    if (!item) {
      diff.creates.push(row);
      continue;
    }
    retainedIds.add(item.id);
    if (isSameContent(row, item, categoryNames, tagNames)) {
      diff.unchanged.push(row);
    } else {
      diff.updates.push({ row, item });
    }
  }
  diff.deletes = items.filter((item) => !retainedIds.has(item.id));
  return diff;
};

/**
 * 差分をチェックリストへ反映する
 *
 * 未登録のカテゴリ・タグを作成し、その後に持ち物の新規登録・更新・削除を行う。各段階内は並列に実行する。
 * 更新した持ち物のチェック状態は維持し、新規登録した持ち物は未チェックになる。
 * 一部が失敗しても成功分は残る。作成できなかったカテゴリ・タグに依存する行は失敗として数える。
 * @param checkListId - 取り込み先のチェックリストID
 * @param diff - {@link computeImportDiff} の結果
 * @param categories - チェックリストの既存カテゴリ
 * @param tags - チェックリストの既存タグ
 * @param items - チェックリストの既存の持ち物（新規登録分の表示順をカテゴリの末尾にするために使う。表示順が未設定・重複のカテゴリは連番にそろえる）
 * @param onProgress - 進捗の通知先（総件数は作成するカテゴリ・タグと持ち物の書き込み件数の合計）
 * @returns 一括処理の結果
 * @throws {unknown} 表示順をそろえる更新に失敗した場合は最初の失敗理由
 */
export const applyCsvImport = async (
  checkListId: string,
  diff: ImportDiff,
  categories: readonly Category[],
  tags: readonly Tag[],
  items: readonly Item[],
  onProgress?: (progress: BulkProgress) => void,
): Promise<BulkResult> => {
  const writtenRows = [...diff.creates, ...diff.updates.map((u) => u.row)];
  const categoryIds = new Map(categories.map((c) => [c.name, c.id]));
  const tagIds = new Map(tags.map((t) => [t.name, t.id]));
  const newCategoryNames = writtenRows
    .map((row) => row.categoryName)
    .filter((name, i, all) => all.indexOf(name) === i)
    .filter((name) => !categoryIds.has(name));
  const newTagNames = writtenRows
    .flatMap((row) => row.tagNames)
    .filter((name, i, all) => all.indexOf(name) === i)
    .filter((name) => !tagIds.has(name));

  const tick = createProgressTicker(
    newCategoryNames.length +
      newTagNames.length +
      writtenRows.length +
      diff.deletes.length,
    onProgress,
  );
  const lastSortOrder = Math.max(-1, ...categories.map((c) => c.sortOrder));
  const parentWrites: (() => Promise<void>)[] = [
    ...newCategoryNames.map((name, index) => async () => {
      const category = await createCategory({
        checkListId,
        name,
        sortOrder: lastSortOrder + 1 + index,
      });
      categoryIds.set(name, category.id);
    }),
    ...newTagNames.map((name) => async () => {
      const tag = await createTag({ checkListId, name });
      tagIds.set(name, tag.id);
    }),
  ];
  const parentResults = await mapConcurrently(
    parentWrites,
    (write) => write(),
    tick,
  );

  const resolveIds = (row: CsvRow) => {
    const categoryId = categoryIds.get(row.categoryName);
    const resolvedTagIds = row.tagNames.map((name) => tagIds.get(name));
    if (categoryId === undefined || resolvedTagIds.includes(undefined)) {
      throw new Error(
        `カテゴリまたはタグが作成できませんでした: ${row.rowNumber}行目`,
      );
    }
    return {
      categoryId,
      tagIds: resolvedTagIds.filter((id): id is string => id !== undefined),
    };
  };
  // 新規登録分は、カテゴリごとに既存の持ち物の末尾から表示順を振る
  const nextSortOrders = new Map<string, number>();
  const createTargetCategoryIds = new Set(
    diff.creates.flatMap((row) => categoryIds.get(row.categoryName) ?? []),
  );
  // 表示順の準備は1カテゴリずつ順に行う。各カテゴリの振り直しは内部で並列実行するため、
  // カテゴリをまたいで並列にすると同時実行数の上限（CHECK_LIST_LIMIT.CONCURRENCY）を超える
  for (const categoryId of Array.from(createTargetCategoryIds)) {
    const { sortOrder } = await prepareAppendSortOrder(items, categoryId);
    nextSortOrders.set(categoryId, sortOrder);
  }
  const takeSortOrder = (categoryId: string): number => {
    const next = nextSortOrders.get(categoryId);
    if (next === undefined) {
      throw new Error(`表示順が求められていません: ${categoryId}`);
    }
    nextSortOrders.set(categoryId, next + 1);
    return next;
  };
  const itemWrites: (() => Promise<unknown>)[] = [
    ...diff.creates.map((row) => () => {
      const ids = resolveIds(row);
      return createItem({
        checkListId,
        name: row.itemName,
        quantityPerDay: row.quantityPerDay ?? undefined,
        ...ids,
        sortOrder: takeSortOrder(ids.categoryId),
      });
    }),
    ...diff.updates.map(
      ({ row, item }) =>
        () =>
          updateItem({
            id: item.id,
            name: row.itemName,
            quantityPerDay: row.quantityPerDay,
            ...resolveIds(row),
          }),
    ),
    ...diff.deletes.map((item) => () => deleteItem(item.id)),
  ];
  const itemResults = await mapConcurrently(
    itemWrites,
    (write) => write(),
    tick,
  );
  return toBulkResult([...parentResults, ...itemResults]);
};
