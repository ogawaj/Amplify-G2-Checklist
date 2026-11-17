/** 削除できない理由 */
export type BlockedDeletion = {
  /** 削除できない対象のID */
  targetId: string;
  /** 利用者に見せる削除できない理由 */
  message: string;
};
