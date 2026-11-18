import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { Tag } from "@/src/app/models/tag";
import {
  listAllPages,
  unwrapData,
  unwrapDeletedData,
} from "@/src/app/utils/amplify-response-utils";

const client = generateClient<Schema>({ authMode: "userPool" });

/**
 * チェックリストに属するタグを全件取得する
 * @param checkListId - チェックリストID
 * @returns タグ一覧（順序は保証しない）
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const listTags = async (checkListId: string): Promise<Tag[]> => {
  return await listAllPages((nextToken) =>
    client.models.Tag.listTagsByCheckListId({ checkListId }, { nextToken }),
  );
};

/**
 * タグを作成する
 * @param input - 所属チェックリストID・名称・表示順（省略すると未設定）
 * @returns 作成したタグ
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const createTag = async (
  input: Pick<Tag, "checkListId" | "name"> & Partial<Pick<Tag, "sortOrder">>,
): Promise<Tag> => {
  return unwrapData(await client.models.Tag.create(input));
};

/**
 * タグを更新する。省略した項目は更新されない
 * @param input - 更新対象のIDと変更項目
 * @returns 更新後のタグ
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const updateTag = async (
  input: Pick<Tag, "id"> & Partial<Pick<Tag, "name" | "sortOrder">>,
): Promise<Tag> => {
  return unwrapData(await client.models.Tag.update(input));
};

/**
 * タグを削除する
 * @param id - タグID
 * @returns 削除したタグ。対象が存在しない場合は null
 * @throws {unknown} 対象不在以外のAppSyncのエラーをそのまま投げる
 */
export const deleteTag = async (id: string): Promise<Tag | null> => {
  return unwrapDeletedData(await client.models.Tag.delete({ id }));
};
