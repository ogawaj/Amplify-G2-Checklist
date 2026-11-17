/**
 * 読み込み中の表示
 * @returns 読み込み中メッセージ
 */
export function LoadingMessage() {
  return (
    <p role="status" className="p-6 text-center text-sm text-muted-foreground">
      読み込み中...
    </p>
  );
}
