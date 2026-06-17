---
description: 計画（plan.md）から1タスクを選び、ステアリングファイル（requirements.html, design.html, tasklist.html）を作成する。
disable-model-invocation: true
model: opus
effort: max
---

# ステアリングタスク作成

plan.md で計画されたタスクの中から1つを選び、ステアリングファイルを作成します。

## 前提確認

1. `doc/persistent/` 配下の永続的ドキュメントをすべて読み込む
2. `doc/steering/` 配下のステアリングディレクトリを一覧表示する

## 手順

以下の手順を **厳密に** 順番通り実行してください。

### Step 0: ステアリングディレクトリとタスクの選択

1. ユーザーがステアリングディレクトリを指定している場合はそれを使用する
2. 指定がない場合は `doc/steering/` 配下のディレクトリ一覧を表示し、ユーザーに選択してもらう
3. 選択されたディレクトリの `plan.md` を読み込む
4. **plan.md が存在しない場合は処理を中断する：**

> ⚠ `plan.md` が見つかりません。
> 先に `/crg-create-steering-plan` で計画を作成してください。

5. plan.md のタスク一覧から、既にサブディレクトリが作成済みのタスクを除外する
6. 未作成タスクの一覧を表示し、作成するタスクをユーザーに選択してもらう

### Step 1: タスクサブディレクトリ作成

plan.md で定義されたディレクトリ名でサブディレクトリを作成する。

```bash
mkdir -p doc/steering/[ステアリングディレクトリ]/[task-NN-title]
```

### Step 2: ステアリングファイル作成（1ファイルずつ順番に作成）

`.claude/rules/document.md` の「作業単位のドキュメント」セクションに従い、以下の3ファイルを **依存順に1つずつ** 作成する。レビュー負荷を下げるため、**まとめて作成しない**。

各ファイルは `.claude/rules/document.md` §スリム化ルール の「書く / 書かない / 行数目安」を必ず守ること。目安行数を超えそうな場合は重複・冗長を見直す。

各ファイルの作成・承認サイクル：

1. 該当ファイルを作成する
2. **ユーザーの承認を待つ**。フィードバックがあれば修正し、再度承認を得る
3. 承認後、次のファイルへ進む

作成時は plan.md の該当タスクの概要・依存関係を踏まえて記述する。

**形式:** 各ファイルは有効な HTML ドキュメントとして作成する。以下の雛形を使用する：

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>[ファイル名] — [タスク名]</title>
    <style>
      :root {
        color-scheme: light;
      }
      html,
      body {
        background: #ffffff;
        color: #222222;
      }
      body {
        font-family: sans-serif;
        max-width: 900px;
        margin: 2rem auto;
        padding: 0 1.5rem;
        line-height: 1.6;
      }
      h1,
      h2,
      h3 {
        border-bottom: 1px solid #e0e0e0;
        padding-bottom: 0.25em;
      }
      a {
        color: #0366d6;
      }
      code {
        background: #f5f5f5;
        color: #222222;
        padding: 0.1em 0.3em;
        border-radius: 3px;
      }
      pre {
        background: #f5f5f5;
        color: #222222;
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border: 1px solid #ddd;
        padding: 0.5em 0.75em;
        text-align: left;
      }
      th {
        background: #f5f5f5;
      }
    </style>
  </head>
  <body>
    <!-- コンテンツ -->
  </body>
</html>
```

#### Step 2-1: requirements.html（今回のタスクの要求内容）

作成 → ユーザー承認 → 次へ。

#### Step 2-2: design.html（変更内容の設計）

承認済みの `requirements.html` を踏まえて作成 → ユーザー承認 → 次へ。

#### Step 2-3: tasklist.html（具体的な実装タスク）

承認済みの `requirements.html` / `design.html` を踏まえて作成 → ユーザー承認 → 完了。

**重要:** 前のファイルが承認される前に次のファイルを作成してはいけない。

### Step 3: 完了報告

全ファイルが承認されたら、以下を案内してください：

1. 作成したファイルの一覧
2. タスクサブディレクトリのパス
3. 次のステップとして `/crg-implement` でサブエージェントによる実装・レビューを開始できること

## ルール

- 永続的ドキュメントおよび plan.md の内容と矛盾しないようにする
- 不明点がある場合はユーザーに質問して明確化する
- 依存タスクがある場合、依存先のタスクが完了済み（サブディレクトリ存在）か確認し、未完了なら警告する
