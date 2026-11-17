import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type { Category } from "@/src/app/models/category";
import {
  listAllPages,
  unwrapData,
  unwrapDeletedData,
} from "@/src/app/utils/amplify-response-utils";

const client = generateClient<Schema>({ authMode: "userPool" });

/**
 * チェックリストに属するカテゴリを全件取得する
 * @param checkListId - チェックリストID
 * @returns カテゴリ一覧（順序は保証しない）
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const listCategories = async (
  checkListId: string,
): Promise<Category[]> => {
  return await listAllPages((nextToken) =>
    client.models.Category.listCategoriesByCheckListId(
      { checkListId },
      { nextToken },
    ),
  );
};

/**
 * カテゴリを作成する
 * @param input - 所属チェックリストID・名称・表示順
 * @returns 作成したカテゴリ
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const createCategory = async (
  input: Pick<Category, "checkListId" | "name" | "sortOrder">,
): Promise<Category> => {
  return unwrapData(await client.models.Category.create(input));
};

/**
 * カテゴリを更新する。省略した項目は更新されない
 * @param input - 更新対象のIDと変更項目
 * @returns 更新後のカテゴリ
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const updateCategory = async (
  input: Pick<Category, "id"> & Partial<Pick<Category, "name" | "sortOrder">>,
): Promise<Category> => {
  return unwrapData(await client.models.Category.update(input));
};

/**
 * カテゴリを削除する
 * @param id - カテゴリID
 * @returns 削除したカテゴリ。対象が存在しない場合は null
 * @throws {unknown} 対象不在以外のAppSyncのエラーをそのまま投げる
 */
export const deleteCategory = async (id: string): Promise<Category | null> => {
  return unwrapDeletedData(await client.models.Category.delete({ id }));
};
