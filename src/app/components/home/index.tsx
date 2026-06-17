"use client";

import { useAuthenticator } from "@aws-amplify/ui-react";
import { useState } from "react";

import { useAggregateAccess } from "@/src/app/hooks/use-access-summary";
import { useEnvVariable } from "@/src/app/hooks/use-env-variable";
import { useCreateTodo, useSayHello, useTodos } from "@/src/app/hooks/use-todo";
import { Button } from "@/src/lib/shadcn/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/lib/shadcn/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/lib/shadcn/ui/dialog";
import { Input } from "@/src/lib/shadcn/ui/input";
import { Label } from "@/src/lib/shadcn/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/lib/shadcn/ui/table";

/**
 * ホーム画面コンポーネント（Todo サンプル + Lambda サンプル + アクセス集計バッチ）
 * @returns ホーム画面
 */
export function Home() {
  const { signOut } = useAuthenticator();
  const { envVariable } = useEnvVariable();
  const { todos } = useTodos();
  const { createTodo } = useCreateTodo();
  const { greeting, callSayHello } = useSayHello();
  const {
    summaries,
    isLoading,
    execute: executeAggregate,
  } = useAggregateAccess();

  const [todoDialogOpen, setTodoDialogOpen] = useState(false);
  const [todoInput, setTodoInput] = useState("");
  const [sayHelloDialogOpen, setSayHelloDialogOpen] = useState(false);
  const [sayHelloInput, setSayHelloInput] = useState("");

  /**
   * Todo 作成 Dialog の送信ハンドラー
   */
  const handleTodoSubmit = async () => {
    const content = todoInput.trim();
    if (content === "") return;
    await createTodo(content);
    setTodoInput("");
    setTodoDialogOpen(false);
  };

  /**
   * Say Hello Dialog の送信ハンドラー
   */
  const handleSayHelloSubmit = async () => {
    const name = sayHelloInput.trim();
    if (name === "") return;
    await callSayHello(name);
    setSayHelloInput("");
    setSayHelloDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-semibold">Amplify-G2-CheckList</h1>
          <span className="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
            {envVariable.ENV_JA_NAME}
          </span>
        </div>
        <Button variant="outline" onClick={signOut}>
          サインアウト
        </Button>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>My Todos</CardTitle>
            <CardAction>
              <Button size="sm" onClick={() => setTodoDialogOpen(true)}>
                + new
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            {todos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todo はまだありません
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {todos.map((todo) => (
                  <li key={todo.id} className="px-4 py-2 text-sm">
                    {todo.content}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Lambda Say Hello サンプル</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button onClick={() => setSayHelloDialogOpen(true)}>
              Say Hello
            </Button>
            {greeting && (
              <p className="text-sm text-muted-foreground">{greeting}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>アクセス集計バッチ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={executeAggregate} disabled={isLoading}>
              {isLoading ? "集計中..." : "集計を実行"}
            </Button>
            {summaries.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>日付</TableHead>
                    <TableHead>アクセス数</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.map((s) => (
                    <TableRow key={s.date}>
                      <TableCell>{s.date}</TableCell>
                      <TableCell>{s.accessCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      <Dialog open={todoDialogOpen} onOpenChange={setTodoDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Todo を追加</DialogTitle>
            <DialogDescription>
              新しい Todo の内容を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="todo-input">内容</Label>
            <Input
              id="todo-input"
              value={todoInput}
              onChange={(e) => setTodoInput(e.target.value)}
              placeholder="やることを入力してください"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTodoDialogOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={handleTodoSubmit}>追加</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sayHelloDialogOpen} onOpenChange={setSayHelloDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>名前を入力</DialogTitle>
            <DialogDescription>
              Lambda 関数に渡す名前を入力してください。
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="say-hello-input">名前</Label>
            <Input
              id="say-hello-input"
              value={sayHelloInput}
              onChange={(e) => setSayHelloInput(e.target.value)}
              placeholder="あなたの名前"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSayHelloDialogOpen(false)}
            >
              キャンセル
            </Button>
            <Button onClick={handleSayHelloSubmit}>送信</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
