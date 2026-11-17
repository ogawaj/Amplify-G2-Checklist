import { CsvScreen } from "@/src/app/components/csv/csv-screen";

/**
 * CSV入出力ページ（S-09）
 * @param props - プロパティ
 * @returns CsvScreen コンポーネント
 */
export default async function CsvPage(props: {
  /** ルートパラメータ */
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await props.params;
  return <CsvScreen listId={listId} />;
}
