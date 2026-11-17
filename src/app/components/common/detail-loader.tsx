"use client";

import { LoadingMessage } from "@/src/app/components/common/loading-message";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { useCheckListDetail } from "@/src/app/hooks/use-check-list-detail";
import type { CheckListDetail } from "@/src/app/models/check-list-detail";

/**
 * チェックリスト詳細を読み込み、完了後に子の描画関数へ渡す
 * @param props - プロパティ
 * @returns 読み込み中・失敗の表示、または読み込み済みの内容
 */
export function DetailLoader(props: {
  /** チェックリストID */
  listId: string;
  /** 読み込み済みの詳細を受け取って描画する関数 */
  children: (detail: CheckListDetail) => React.ReactNode;
}) {
  const state = useCheckListDetail(props.listId);
  switch (state.status) {
    case "loaded":
      return <>{props.children(state.detail)}</>;
    case "error":
      return <NoticeBanner message={state.message} />;
    case "loading":
      return <LoadingMessage />;
  }
}
