import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { CheckList } from "@/src/app/models/check-list";
import {
  listAllPages,
  unwrapData,
  unwrapDeletedData,
} from "@/src/app/utils/amplify-response-utils";

const client = generateClient<Schema>({ authMode: "userPool" });

/**
 * 所有者のチェックリストを全件取得する
 * @returns チェックリスト一覧
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const listCheckLists = async (): Promise<CheckList[]> => {
  return await listAllPages((nextToken) =>
    client.models.CheckList.list({ nextToken }),
  );
};

/**
 * チェックリストを1件取得する
 * @param id - チェックリストID
 * @returns チェックリスト。存在しない場合は null
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const getCheckListById = async (
  id: string,
): Promise<CheckList | null> => {
  const { data, errors } = await client.models.CheckList.get({ id });
  if (errors) throw errors;
  return data;
};

/**
 * チェックリストを作成する
 * @param input - 名称と日数
 * @returns 作成したチェックリスト
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const createCheckList = async (
  input: Pick<CheckList, "name" | "durationDays">,
): Promise<CheckList> => {
  return unwrapData(await client.models.CheckList.create(input));
};

/**
 * チェックリストを更新する。省略した項目は更新されない
 * @param input - 更新対象のIDと変更項目
 * @returns 更新後のチェックリスト
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const updateCheckList = async (
  input: Pick<CheckList, "id"> &
    Partial<Pick<CheckList, "name" | "durationDays">>,
): Promise<CheckList> => {
  return unwrapData(await client.models.CheckList.update(input));
};

/**
 * チェックリストを削除する
 * @param id - チェックリストID
 * @returns 削除したチェックリスト。対象が存在しない場合は null
 * @throws {unknown} 対象不在以外のAppSyncのエラーをそのまま投げる
 */
export const deleteCheckList = async (
  id: string,
): Promise<CheckList | null> => {
  return unwrapDeletedData(await client.models.CheckList.delete({ id }));
};
