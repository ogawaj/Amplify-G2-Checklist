import { ListDetailScreen } from "@/src/app/components/list-detail/list-detail-screen";

/**
 * チェックリスト詳細ページ（S-05）
 * @param props - プロパティ
 * @returns ListDetailScreen コンポーネント
 */
export default async function ListDetailPage(props: {
  /** ルートパラメータ */
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await props.params;
  return <ListDetailScreen listId={listId} />;
}
