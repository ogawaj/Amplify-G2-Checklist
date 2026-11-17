import type { Item } from "@/src/app/models/item";
import type { Tag } from "@/src/app/models/tag";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  createTag as createTagRecord,
  deleteTag as deleteTagRecord,
  listTags as listTagRecords,
  updateTag as updateTagRecord,
} from "@/src/app/repositories/tag-repository";
import { getItemTagIds } from "@/src/app/services/item-service";
import { isNameTaken } from "@/src/app/utils/name-utils";
import { compareByCreatedAt } from "@/src/app/utils/sort-utils";

/**
 * チェックリストのタグを作成日時の昇順で取得する
 * @param checkListId - チェックリストID
 * @returns タグ一覧
 */
export const listTags = async (checkListId: string): Promise<Tag[]> => {
  return (await listTagRecords(checkListId)).sort(compareByCreatedAt);
};

/**
 * タグを作成する
 * @param checkListId - チェックリストID
 * @param name - タグ名
 * @param tags - チェックリストの既存タグ
 * @returns 作成したタグ
 * @throws {UserFacingError} タグ名が重複する場合
 */
export const createTag = async (
  checkListId: string,
  name: string,
  tags: readonly Tag[],
): Promise<Tag> => {
  if (isNameTaken(tags, name)) {
    throw new UserFacingError("同じ名前のタグが既にあります");
  }
  return await createTagRecord({ checkListId, name: name.trim() });
};

/**
 * タグ名を変更する
 * @param tagId - 対象のタグID
 * @param name - 新しい名称
 * @param tags - チェックリストの既存タグ
 * @returns 更新後のタグ
 * @throws {UserFacingError} タグ名が他のタグと重複する場合
 */
export const renameTag = async (
  tagId: string,
  name: string,
  tags: readonly Tag[],
): Promise<Tag> => {
  if (isNameTaken(tags, name, tagId)) {
    throw new UserFacingError("同じ名前のタグが既にあります");
  }
  return await updateTagRecord({ id: tagId, name: name.trim() });
};

/**
 * タグを削除できるかを判定する
 * @param tagId - タグID
 * @param items - チェックリストの全持ち物
 * @returns 付与された持ち物が1件もなければ true
 */
export const canDeleteTag = (
  tagId: string,
  items: readonly Pick<Item, "tagIds">[],
): boolean => !items.some((item) => getItemTagIds(item).includes(tagId));

/**
 * 付与された持ち物がないタグを削除する
 * @param tagId - タグID
 * @param items - チェックリストの全持ち物
 * @throws {UserFacingError} 付与された持ち物がある場合
 */
export const deleteTag = async (
  tagId: string,
  items: readonly Pick<Item, "tagIds">[],
): Promise<void> => {
  if (!canDeleteTag(tagId, items)) {
    throw new UserFacingError("持ち物に付与されているタグは削除できません");
  }
  await deleteTagRecord(tagId);
};

/**
 * 削除したタグを同じ名前で作り直す（削除の取り消し）。IDは新しくなる
 * @param tag - 削除したタグ
 * @returns 作り直したタグ
 */
export const restoreTag = async (tag: Tag): Promise<Tag> =>
  await createTagRecord({ checkListId: tag.checkListId, name: tag.name });
