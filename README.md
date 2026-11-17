# README

## Claude Code による開発フロー

Claude Code のカスタムコマンド(`crg-`で始まるコマンド。`crg`は courage の意味)を使って開発を進めます。

### 初期開発

テンプレートを clone し、プロジェクト初期化から永続的ドキュメント・ステアリングドキュメントの作成、実装までを行います。

初期開発を始める前に、`doc/idea/` 配下にアイデアを記述したファイルを作成してください。
形式は自由です（Markdown、テキスト等）。

| ステップ | コマンド                          | 説明                                                                |
| -------- | --------------------------------- | ------------------------------------------------------------------- |
| 1-1      | `/crg-init-project`               | システム名・Lambda プレフィックスを設定し、テンプレートを初期化する |
| 1-2      | `/crg-create-persistent`          | `doc/idea/` のアイデアファイルをもとに永続的ドキュメントを作成      |
| 1-3      | `/crg-create-steering-plan`       | 開発作業をタスクに分解し計画（plan.md）を作成                       |
| 1-4      | `/crg-create-steering-task`       | plan.md から1タスクを選びステアリングファイルを作成                 |
| 1-5      | `/crg-implement`                  | tasklist.md に基づいて実装・レビュー                                |
| 1-6      | 手動                              | テスト                                                              |
|          | ↑ 1-4〜1-6 をタスクごとに繰り返す |                                                                     |

### 改修

既存機能の追加・修正を行う際のフローです。ステアリングドキュメントを作成して実装した後、改修内容を永続的ドキュメントに反映します。

| ステップ | コマンド                          | 説明                                                |
| -------- | --------------------------------- | --------------------------------------------------- |
| 2-1      | `/crg-create-steering-plan`       | 改修作業をタスクに分解し計画（plan.md）を作成       |
| 2-2      | `/crg-create-steering-task`       | plan.md から1タスクを選びステアリングファイルを作成 |
| 2-3      | `/crg-implement`                  | tasklist.md に基づいて実装・レビュー                |
| 2-4      | 手動                              | テスト                                              |
|          | ↑ 2-2〜2-4 をタスクごとに繰り返す |                                                     |
| 2-5      | `/crg-update-persistent`          | 改修内容を永続的ドキュメントに反映                  |

### 補助コマンド

初期開発・改修のメインフローから呼ばれる、または任意のタイミングで利用する補助コマンドです。

| コマンド               | 説明                                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/crg-review`          | 直近の変更（git diff）または指定パスを仕様・設計 / セキュリティ / 品質の 3 ペルソナでレビューし、FAIL 時は自動修正まで行う。`/crg-implement` からも呼ばれる |
| `/crg-refactor-review` | JSDoc / DRY / 過大スコープ・YAGNI の総合リファクタリングレビュー。PR 前 / 定期メンテのタイミングで実行する                                                  |
| `/crg-design-check`    | フロントエンド UI 変更後の自己デザインチェック（Claude in Chrome MCP）。レイアウト崩れ・状態遷移・コンソールエラー・レスポンシブの 4 観点                   |
| `/crg-update-rules`    | チャットで得られた指摘・教訓を `.claude/rules/` 配下のルールファイルに反映する                                                                              |

## 前提ツール

このテンプレートを動かすには以下が必要です。

| ツール         | バージョン / 条件             | 用途                                            |
| -------------- | ----------------------------- | ----------------------------------------------- |
| Claude Code    | -                             | `/crg-*` カスタムコマンドによる開発フローの実行 |
| git            | -                             | リポジトリ操作                                  |
| Node.js        | 18 以上（Amplify Gen 2 要件） | Next.js / Amplify バックエンドの実行            |
| npm            | Node.js 同梱版                | パッケージ管理（`package-lock.json` を使用）    |
| AWS アカウント | -                             | Amplify サンドボックス / デプロイ先             |
| AWS CLI        | v2 推奨                       | AWS プロファイル設定（`--profile` で参照）      |

Claude Code は `npm install -g @anthropic-ai/claude-code` でインストールします（詳細は [公式ドキュメント](https://docs.claude.com/claude-code)）。

> Amplify Gen 2 は `npx ampx` 経由でツールを実行するため、**Amplify CLI のグローバルインストールは不要**です（旧 Gen 1 とは異なる）。`@aws-amplify/backend-cli` は `devDependencies` に含まれます。

AWS 認証情報は事前に `aws configure --profile <プロファイル名>` などで設定しておき、後述の `--profile` オプションで参照します。

## 動作方法

### 環境変数の設定

#### サンドボックス環境（ローカル開発）

`npm install`（または `npm ci`）の **postinstall** で `scripts/prepare-sandbox.cjs` が実行され、各 `env-variable-sandbox.example.ts` から `env-variable-sandbox.ts` が自動生成されます（既存ファイルは上書きしません）。

対象は以下の 2 箇所：

- `src/app/enums/env-variable-sandbox.ts`
- `amplify/common/enums/env-variable-sandbox.ts`

各 `env-variable-sandbox.ts` は `.gitignore` で管理外のため、**個人の値で編集してもコミット対象になりません**。値を変更したいときは生成されたファイルを直接編集してください。

#### dev / stag / prod 環境

Amplify Hosting の管理画面でブランチごとに `NEXT_PUBLIC_ENV=dev` 等を設定してください。
多分、設定後に再ビルドしないと反映されないので、その場合は再ビルドしてください。

### 起動コマンド

`npm run sandbox` → `npm run dev` の順に起動してください。

| 順番 | コマンド          | 説明                             |
| ---- | ----------------- | -------------------------------- |
| 1    | `npm run sandbox` | Amplify サンドボックス環境を起動 |
| 2    | `npm run dev`     | Next.js 開発サーバーを起動       |

AWS CLIのプロファイルは`nima`に固定しています（`package.json`の`sandbox`スクリプト）。
