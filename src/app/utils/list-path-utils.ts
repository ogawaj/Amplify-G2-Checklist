import { APP_PATH, type ListSection } from "@/src/app/enums/app-path";

/** チェックリストIDとして受け付ける形式（UUID） */
const LIST_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * チェックリストIDが Amplify Data の採番する UUID 形式かを判定する
 * @param listId - 検査するチェックリストID
 * @returns UUID 形式であれば true
 */
export const isValidListId = (listId: string): boolean =>
  LIST_ID_PATTERN.test(listId);

/**
 * チェックリスト配下の画面のパスを組み立てる
 * @param listId - チェックリストID
 * @param section - 配下の画面。省略するとチェックリスト詳細
 * @returns 画面のパス
 * @example buildListPath("abc", "csv") // "/lists/abc/csv"
 */
export const buildListPath = (listId: string, section?: ListSection): string =>
  section === undefined
    ? `${APP_PATH.LISTS}/${listId}`
    : `${APP_PATH.LISTS}/${listId}/${section}`;
