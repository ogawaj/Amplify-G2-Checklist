---
description: フロントエンド UI 変更後のデザインを Claude in Chrome MCP で自己チェックする。レイアウト崩れ・状態遷移・コンソールエラー・レスポンシブ表示の 4 観点で PASS / FAIL を判定し、FAIL の場合は自動修正フローへ繋ぐ。最終確認はユーザーが行う。
disable-model-invocation: true
model: opus
---

# デザイン自己チェック（Claude in Chrome による画面確認）

フロントエンド UI（`src/app/components/` / CSS / Tailwind / `src/lib/shadcn/ui/`）の変更後、Claude in Chrome MCP で画面を開いて視覚的・機能的問題を早期検出する。`/crg-review`（コード対象）に対し、本スキルは **画面そのもの** を対象にする。最終確認はユーザーが行う。

Chrome MCP の制約・運用ノウハウは `.claude/rules/browser-automation.md` を参照。

## Step 0: 対象画面の特定

引数で分岐：

1. **URL / パス**（`http://...` / `/path`）→ そのまま対象
2. **ステアリングディレクトリ**（`doc/steering/` 配下）→ `design.html` / `tasklist.html` から変更対象画面を抽出
3. **引数なし** → `git diff` から `src/app/components/` / `src/app/(*-page)/` / CSS の変更を抽出して画面ルートを推定

対象 0 件なら処理中断（URL / ルートの指定を促す）。

## Step 1: 開発サーバー起動とブラウザ準備

dev サーバー起動（未起動なら `npm run dev` をバックグラウンド実行 + listen 待ち）→ Chrome MCP ツールを ToolSearch でロード → 既存タブ再利用または `tabs_create_mcp` で新規タブ作成 → `navigate` で対象 URL に遷移 → `read_console_messages` / `read_network_requests` を空読みして監視有効化 → 認証必須画面で未ログインならユーザー代行依頼。

## Step 2: チェック実行

### 2-1. レイアウト崩れ / 整列（必須）

デスクトップ幅（`resize_window` で 1440x900）で `read_page` を取得し、以下を確認：

- 主要要素（ヘッダー / Card / Dialog 等）が画面外にはみ出していないか
- 余白・整列が崩れていないか（要素同士の重なり）
- スクロールが意図せず発生していないか

### 2-2. 状態遷移（インタラクション）

ボタンクリック / モーダル開閉 / フォーム送信 / ホバー / disabled を `gif_creator` で操作録画しながら確認。録画ファイル名は `<feature>-<scenario>.gif`。

### 2-3. コンソールエラー

`read_console_messages` で error / warning を取得。hydration warning / a11y 警告 / アセット 404 / unhandled rejection に注意。サンプル機能由来のネットワークエラーは UI 起因かを切り分ける。

### 2-4. レスポンシブ（スマホ対応必要時のみ）

ステアリング / 要件に「モバイル / スマホ / レスポンシブ / タブレット」の言及があるか、ユーザーがスマホ利用前提と明示した場合のみ、タブレット幅（768x1024）・モバイル幅（375x812）でも 2-1 を実施。判定がつかない場合はデスクトップのみで実施し、報告で「スマホ対応要否は確認していません」と明記。

## Step 3: PASS / FAIL ハンドリング

### PASS

issue 0 件または許容できる軽微なもの（外部要因の warning 等）のみ → サマリを提示して Step 4 へ。

### FAIL

issue を観点ごとにグルーピングしてユーザーに提示し、「自動修正 / 手動修正」を選択してもらう。自動修正は `/crg-review` と同じパターンで担当範囲に応じて `frontend-ui-implementer` / `frontend-logic-implementer` を並列起動 → Step 2 を再実行。**ループは最大 2 回まで。**

## Step 4: 完了報告

対象画面 / 観点別の PASS / FAIL / 残 issue / 成果物（GIF・DOM サマリ）/ 自動修正サマリ / 「最終確認はユーザーが行う」旨を報告する。

## ルール

- 自動修正ループは最大 2 回
- 自動コミットしない
- 最終判定はユーザー（本スキルの PASS は「明らかな崩れがない」段階）
