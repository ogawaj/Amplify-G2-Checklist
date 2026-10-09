---
description: 直近の変更（git diff）または指定パス・ステアリングディレクトリを、レイヤー別 reviewer（backend-repository / backend-service / frontend-logic / frontend-ui / shared）の並列レビュー → reviewer-integration の統合レビューで検証し、FAIL の場合は担当 implementer による自動修正と部分再レビューまで行う。crg-implement からも呼び出される総合レビューフロー。
model: opus
---

# レビュー（レイヤー別 + 統合の総合レビュー）

変更ファイルをレイヤーで分類し、レイヤー別 reviewer を **並列** に起動して各レイヤー内の 4 観点（設計・規約 / JSDoc・文言 / セキュリティ / 品質・性能）を判定した後、`reviewer-integration` が層をまたぐ契約とステアリングの受け入れ条件を検証して総合判定を下す。`crg-implement` のレビュー部分もこのスキルを呼び出して共通化する。

DRY / 過大スコープ・YAGNI の専用レビュー（jscpd / knip ベース）は `/crg-refactor-review` の担当。JSDoc レビューは本スキルのレイヤー別 reviewer が観点 B として担う。

共通の観点・出力形式は `reviewer-common.md`（本スキルと同じディレクトリ）に定義し、各 reviewer が起動時に読む。

## Step 0: レビュー対象の選択と分類

### 対象の決定

引数の種別で分岐：

1. **ステアリングディレクトリ**（パスに `doc/steering/` を含む）→ `git diff --name-only HEAD` と `git status --short` の変更ファイルに、design.html の「変更ファイル一覧」に記載されたファイルを加えた和集合。ステアリングコンテキスト付きレビューになる
2. **ファイル / ディレクトリ** → 指定パス配下の `.ts` / `.tsx`
3. **引数なし** → `git diff --name-only HEAD` および `git status --short` から変更ファイルを抽出
4. 対象が 0 件の場合は処理を中断：

> ⚠ レビュー対象がありません。`git status` で確認するか、対象パスを引数で指定してください。

削除・移動されたファイルは対象一覧に「削除: path」「移動: 旧 → 新」として含める（旧参照の残存確認に使う）。`src/lib/**` `.amplify/**` `node_modules/**` は除外する。

### レイヤー分類

対象ファイルをパスで以下に振り分ける。該当ファイルが 0 件の reviewer は起動しない。

| reviewer | 対象パス |
| --- | --- |
| `reviewer-backend-repository` | `amplify/functions/common/repositories/**`、`amplify/data/resource.ts` |
| `reviewer-backend-service` | `amplify/functions/common/services/**`、`amplify/functions/common/models/**`、`amplify/functions/common/enums/**`、`amplify/functions/*/handler.ts`、`amplify/functions/*/resource.ts`、`amplify/backend.ts`、`amplify/data/**`、`amplify/common/services/**`、`amplify/common/models/**` |
| `reviewer-frontend-logic` | `src/app/services/**`、`src/app/repositories/**`、`src/app/utils/**`、`src/app/models/**`、`src/app/enums/**` |
| `reviewer-frontend-ui` | `src/app/components/**`、`src/app/hooks/**`、`src/app/providers/**`、`src/app/(auth-page)/**`、`src/app/(public-page)/**`、`src/app/layout.tsx`、`src/app/globals.css` |
| `reviewer-shared` | `shared/**`、`amplify/common/enums/**` |

上記に該当しないファイル（`scripts/**`、設定ファイル、ドキュメント等）は分類せず、Step 5 の報告に「レビュー対象外」として列挙する。

## Step 1: 機械検出（オーケストレータが 1 回だけ実行）

各 reviewer に再実行させないため、以下を本スキルが実行し、結果を `.crg-tmp/` に整形して書き出す（`.crg-tmp/` は gitignore 済み）。

```bash
npx tsc --noEmit                                   # src/ + shared/ + scripts/
npx tsc --noEmit -p amplify/tsconfig.json          # amplify/（root の tsc は amplify/ を検証しない）
npm run lint                                       # ESLint 全体
npx eslint <対象 .ts/.tsx ファイル> 2>&1 | grep -E '^\s+[0-9]+:[0-9]+\s+(error|warning)|jsdoc/'   # JSDoc 機械検出（ファイル名に error を含む場合の誤マッチを避けるため行番号付きの行だけ拾う）
```

いずれかが非ゼロ終了でも処理を止めず、全結果を収集する。

### `.crg-tmp/review-detection-<timestamp>.md`

```
# 型チェック / lint 結果

## tsc（src/ shared/ scripts/）
- エラー N 件: [path:line] [message]

## tsc（amplify/）
- エラー N 件: [path:line] [message]

## ESLint
- エラー N 件 / 警告 N 件: [path:line] [rule] [message]
（0 件のセクションは「エラーなし」と記載）
```

### `.crg-tmp/jsdoc-detection-<timestamp>.md`

```
# ESLint JSDoc 機械検出結果

対象ファイル: {一覧}
検出件数: N 件

- [path:line] [rule] [message]
（0 件の場合は「機械検出のエラーなし」と記載）
```

tsc にエラーがある場合はレビューに進まず、エラー一覧をユーザーに提示して終了する（型エラーのあるコードをレビューしても指摘が無駄になるため）。

## Step 2: レイヤー別 reviewer の並列起動

Step 0 で該当ファイルのある reviewer を、Agent ツールで **1 つのメッセージ内で並列** に起動する。

**プロンプト（共通。`{}` を埋める）：**

```
{ステアリングディレクトリ指定の場合のみ:}
ステアリングディレクトリ: {タスクサブディレクトリのパス}

レビュー対象ファイル（あなたの担当レイヤー分のみ）:
{該当ファイルの一覧。削除・移動は「削除: path」「移動: 旧 → 新」}

変更ファイル全体（参考。境界違反の逆引きに使う）:
{Step 0 の全対象一覧}

機械検出結果:
- 型チェック / lint: .crg-tmp/review-detection-<timestamp>.md
- ESLint JSDoc: .crg-tmp/jsdoc-detection-<timestamp>.md

`.claude/skills/crg-review/reviewer-common.md` と、あなたの定義ファイルに記載された規約に基づいてレビューしてください。担当レイヤー外のファイルの規約違反は指摘せず、層をまたぐ懸念は「統合 reviewer への申し送り」に書いてください。
```

## Step 3: 統合レビュー

全レイヤー reviewer の結果が揃ったら、Agent ツールで `reviewer-integration` を起動する。

**プロンプト：**

```
{ステアリングディレクトリ指定の場合のみ:}
ステアリングディレクトリ: {タスクサブディレクトリのパス}

変更ファイル一覧（レイヤー分類つき）:
{Step 0 の分類結果。削除・移動を含む}

機械検出結果（型チェック / lint）: .crg-tmp/review-detection-<timestamp>.md

レイヤー別 reviewer の結果:
--- reviewer-backend-repository ---
{結果全文。起動していない場合は「対象なし」}
--- reviewer-backend-service ---
{...}
--- reviewer-frontend-logic ---
{...}
--- reviewer-frontend-ui ---
{...}
--- reviewer-shared ---
{...}

層をまたぐ契約（DTO / operation / enum の両側整合）と、ステアリング指定時は受け入れ条件の端から端までの充足を検証し、総合判定と担当別の修正タスクを出してください。各レイヤー内の規約は再チェックしないでください。
```

## Step 4: 結果のハンドリング

### 総合判定が PASS の場合

Step 5 に進む。

### FAIL の場合

1. `reviewer-integration` の総合判定表と担当別の修正タスクをユーザーに提示する
2. ユーザーに次のアクションを選択してもらう：
   - **自動修正**: 担当 implementer を起動して修正し、部分再レビューする
   - **手動修正**: 修正タスク一覧を提示して終了する

### 自動修正を選択した場合

修正タスクの担当ごとにサブエージェントを **並列** で起動する：

| 担当 | 対象 |
| --- | --- |
| `backend-implementer` | `amplify/**`、`shared/**` |
| `frontend-logic-implementer` | `src/app/services/**`、`repositories/**`、`utils/**`、`models/**`、`enums/**` |
| `frontend-ui-implementer` | `src/app/components/**`、`hooks/**`、`providers/**`、`(auth-page)/**`、`(public-page)/**` |

**各サブエージェントへのプロンプト（共通）：**

```
{ステアリングディレクトリ指定の場合のみ:}
ステアリングディレクトリ: {タスクサブディレクトリのパス}

## レビューで指摘された問題点

{該当エージェントの担当範囲に関する修正タスク（path:line と内容、違反した規約の節）}

上記の問題点をすべて修正してください。修正後、`npx tsc --noEmit`（amplify/ を変更した場合は `npx tsc --noEmit -p amplify/tsconfig.json` も）と `npm run lint` を実行してエラーがないことを確認してください。
```

### 部分再レビュー

修正後、Step 1 の機械検出を再実行したうえで、**FAIL だったレイヤー reviewer と、修正でファイルが変わったレイヤーの reviewer だけ** を Step 2 の要領で再起動し、その後 `reviewer-integration` を再起動する（PASS だったレイヤーで修正によるファイル変更が無ければ、前回の結果をそのまま統合に渡す）。

**修正→再レビューのループは最大 2 回まで。** 2 回目の再レビューでも FAIL の場合は、残りの問題点をユーザーに報告して終了する。

## Step 5: 完了報告

以下を報告する：

- レビュー対象（ステアリングディレクトリ / ファイル一覧とレイヤー分類 / レビュー対象外のファイル）
- reviewer ごとの結果（PASS / FAIL / 対象なし）と総合判定
- 残問題点（あれば）
- 自動修正を実施した場合は修正内容のサマリと再レビューの回数

## ルール

- レイヤー reviewer は必ず並列起動する（直列にしない）
- サブエージェントのプロンプトには対象（ステアリングディレクトリ or ファイル一覧）を必ず含める
- 機械検出は本スキルが 1 回だけ実行し、reviewer に再実行させない
- 修正ループは最大 2 回までとし、無限ループを防ぐ
- 自動コミットしない（ユーザーが指示するまで待つ）
- 観点の定義・出力形式を変えるときは `reviewer-common.md` を変更し、各 reviewer 定義には固有項目だけを書く
