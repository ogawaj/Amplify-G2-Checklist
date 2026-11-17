import { generateClient } from "aws-amplify/data";

import type { Schema } from "@/amplify/data/resource";
import type {
  Item,
  ItemCreateInput,
  ItemUpdateInput,
} from "@/src/app/models/item";
import {
  listAllPages,
  unwrapData,
  unwrapDeletedData,
} from "@/src/app/utils/amplify-response-utils";

const client = generateClient<Schema>({ authMode: "userPool" });

/**
 * チェックリストに属する持ち物を全件取得する
 * @param checkListId - チェックリストID
 * @returns 持ち物一覧（順序は保証しない）
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const listItems = async (checkListId: string): Promise<Item[]> => {
  return await listAllPages((nextToken) =>
    client.models.Item.listItemsByCheckListId({ checkListId }, { nextToken }),
  );
};

/**
 * 持ち物を作成する
 * @param input - 作成する持ち物の項目
 * @returns 作成した持ち物
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const createItem = async (input: ItemCreateInput): Promise<Item> => {
  return unwrapData(await client.models.Item.create(input));
};

/**
 * 持ち物を更新する。省略（undefined）した項目は更新されず、quantityPerDay に null を渡すと値を消す
 * @param input - 更新対象のIDと変更項目
 * @returns 更新後の持ち物
 * @throws {unknown} AppSyncのエラーをそのまま投げる
 */
export const updateItem = async (input: ItemUpdateInput): Promise<Item> => {
  return unwrapData(await client.models.Item.update(input));
};

/**
 * 持ち物を削除する
 * @param id - 持ち物ID
 * @returns 削除した持ち物。対象が存在しない場合は null
 * @throws {unknown} 対象不在以外のAppSyncのエラーをそのまま投げる
 */
export const deleteItem = async (id: string): Promise<Item | null> => {
  return unwrapDeletedData(await client.models.Item.delete({ id }));
};
