import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/lib/shadcn/ui/card";

/**
 * 認証画面のカード枠（見出しとフォームを収める）
 * @param props - プロパティ
 * @returns カード
 */
export function AuthCard(props: {
  /** 見出し */
  title: string;
  /** カード内の内容 */
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-2xl font-semibold">CheckList</p>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{props.title}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {props.children}
        </CardContent>
      </Card>
    </div>
  );
}
