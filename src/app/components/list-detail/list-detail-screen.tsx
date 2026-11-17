"use client";

import { DetailLoader } from "@/src/app/components/common/detail-loader";
import { ListDetailBody } from "@/src/app/components/list-detail/list-detail-body";

/**
 * チェックリスト詳細画面（S-05）。データの読み込み後に本体を描画する
 * @param props - プロパティ
 * @returns 詳細画面
 */
export function ListDetailScreen(props: {
  /** チェックリストID */
  listId: string;
}) {
  return (
    <DetailLoader listId={props.listId}>
      {(detail) => <ListDetailBody detail={detail} />}
    </DetailLoader>
  );
}
