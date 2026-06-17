---
description: リファクタリング観点（JSDoc / DRY / 過大スコープ・YAGNI）の総合レビュー。ESLint / jscpd / knip を並列実行し、reviewer-jsdoc → reviewer-dry → reviewer-scope を順次起動して 3 段階レビューと自動修正を行う。
disable-model-invocation: true
model: opus
---

# リファクタリングレビュー

リファクタリング観点（JSDoc 規約 / DRY / 過大スコープ・YAGNI）の総合レビュー + 自動修正フロー。`/crg-review`（仕様・設計レビュー）とペアになり、PR 前 / 定期メンテのタイミングで実行する想定。

判定観点詳細は各 reviewer-\* エージェント（`reviewer-jsdoc` / `reviewer-dry` / `reviewer-scope`）および `.claude/rules/coding-standards.md` が一次資料。本スキルはフロー（機械検出 → 3 段階レビュー → 修正ループ）のみを担う。

## 引数

- **引数なし**（推奨運用）→ プロジェクト全体スキャン
- **ファイル / ディレクトリ指定** → JSDoc は指定対象のみ、DRY / Scope は全体スキャン（jscpd / knip の性質上）

外部由来コード（`src/lib/shadcn/**` 等、`eslint.config.mjs` の ignores と整合する範囲）は JSDoc チェック対象から除外する。

## Step 1: 機械検出（3 ツール並列実行）

以下を **並列** で実行する：

```bash
npx eslint <対象> 2>&1 | grep -E '(jsdoc/|^/|error|warning)'  # JSDoc 機械検出
npm run check:dry                                              # jscpd（重複コード）
npm run check:scope                                            # knip（未使用要素）
```

**いずれのツールが非ゼロ終了でも処理を止めず**、全結果を収集する（knip は検出があると非ゼロ終了する）。

## Step 2: 結果集約（3 ファイル書き出し）

検出結果を `.crg-tmp/` に 3 ファイルへ Markdown 整形で書き出す。

### `.crg-tmp/jsdoc-detection-<timestamp>.md`

```
# ESLint JSDoc 機械検出結果

対象ファイル:
- {ファイル一覧}

検出件数: N 件

## 検出内容

- [path:line] [rule] [message]
...
（0 件の場合は「機械検出のエラーなし」と記載）
```

### `.crg-tmp/dry-detection-<timestamp>.md`

```
# jscpd 機械検出結果（重複コード）

## 重複ペア一覧

- ペア 1: [firstFile.name firstFile.start-firstFile.end] ↔ [secondFile.name secondFile.start-secondFile.end]
  lines: N, tokens: M
- ペア 2: ...
（0 件の場合は「重複コードの検出なし」と記載）
```

- jscpd の結果は `.jscpd-report/jscpd-report.json` の `duplicates` 配列から抽出

### `.crg-tmp/scope-detection-<timestamp>.md`

```
# knip 機械検出結果(過大スコープ / 未使用要素)

## Unused files
- {path}

## Unused dependencies
- {name}

## Unused devDependencies
- {name}

## Unused exports
- [path] [name]

## Unused exported types
- [path] [name]

## Unlisted dependencies
- {name}

(各カテゴリで検出 0 件の場合はその旨を明示)
```

- knip の結果は標準出力をパースしてカテゴリ別に分類

## Step 3: 段階 A — JSDoc レビュー

Agent ツールで `reviewer-jsdoc` サブエージェント（`.claude/agents/reviewer-jsdoc.md`）を起動する。

**プロンプト：**

```
レビュー対象ファイル:
{Step 1 で対象とした .ts / .tsx ファイル一覧}

機械検出結果（ESLint）: .crg-tmp/jsdoc-detection-<timestamp>.md

上記の対象に対し、`.claude/rules/coding-standards.md` の §JSDoc / §文言の言語 に基づいて JSDoc 規約レビューを行ってください。
```

### 結果のハンドリング

**PASS の場合**: 段階 B（Step 4）に進む。

**FAIL の場合**:

1. 検出された違反をユーザーに提示する
2. ユーザーに次のアクションを選択してもらう：
   - **自動修正**: 該当レイヤーのサブエージェントを起動して修正 → 再チェック
   - **手動修正**: 違反一覧を提示して段階 B に進む（または終了）

自動修正を選択した場合、担当範囲に応じてサブエージェントを **並列** で起動：

- `amplify/` や `shared/` → `backend-implementer`
- `src/app/services/`, `src/app/repositories/` → `frontend-logic-implementer`
- `src/app/components/`, `src/app/hooks/` → `frontend-ui-implementer`

**修正プロンプト（共通）：**

```
## JSDoc 規約違反の修正

`.claude/rules/coding-standards.md` の §JSDoc / §文言の言語 に違反している以下を修正してください。

### 修正対象

{該当エージェントの担当範囲に関する違反点をここに記載}

### 修正方針

- 日本語で記述
- 「書くべきもの」のみ残す（目的の一行サマリ / @param / @returns / @throws / 副作用）
- 「書かないもの」を削除する（処理フロー / 実装詳細 / 他関数遷移説明 / 自明な内容）
- 修正後、`npx tsc --noEmit` と `npm run lint` を実行してエラーがないことを確認
```

修正後、ESLint 機械検出と reviewer-jsdoc を再実行。**修正→チェックのループは最大 2 回まで。**

## Step 4: 段階 B — DRY レビュー

Agent ツールで `reviewer-dry` サブエージェント（`.claude/agents/reviewer-dry.md`）を起動する。

**プロンプト：**

```
機械検出結果（jscpd）: .crg-tmp/dry-detection-<timestamp>.md

上記の機械検出結果に対し、`.claude/rules/coding-standards.md` の §DRY と `.claude/rules/architecture.md` のレイヤー構成（および DB / ORM 関連の場合は `.claude/rules/architecture-db.md`）に基づいて、重複コードの共通化判断（共通化推奨 / 許容 / 要検討）を行ってください。
```

### 結果のハンドリング

**PASS の場合**: 段階 C（Step 5）に進む。

**FAIL の場合**:

1. 検出された問題点をユーザーに提示する
2. ユーザーに次のアクションを選択してもらう：
   - **自動修正**: 該当レイヤーのサブエージェントを起動して共通化 → 再チェック
   - **手動修正**: 問題点一覧を提示して段階 C に進む（または終了）

自動修正を選択した場合、担当範囲に応じてサブエージェントを **並列** で起動（段階 A と同じ振り分け）。

**修正プロンプト（共通）：**

```
## DRY 違反の修正

`.claude/rules/coding-standards.md` の §DRY に違反している以下を共通化してください。

### 修正対象

{該当エージェントの担当範囲に関する問題点をここに記載}

### 修正方針

- 共通化先のレイヤー / モジュールに合わせて配置（amplify / src/app/services / src/app/components 等）
- 修正後、`npx tsc --noEmit` と `npm run lint` を実行してエラーがないことを確認
```

修正後、jscpd と reviewer-dry を再実行。**修正→チェックのループは最大 2 回まで。**

## Step 5: 段階 C — Scope レビュー

Agent ツールで `reviewer-scope` サブエージェント（`.claude/agents/reviewer-scope.md`）を起動する。

**プロンプト：**

```
機械検出結果（knip）: .crg-tmp/scope-detection-<timestamp>.md

上記の機械検出結果に対し、`.claude/rules/coding-standards.md` の §YAGNI / §依存パッケージの管理 に基づいて、未使用要素の判定（削除推奨 / スコープ縮小 / 誤検知）を行ってください。誤検知の場合は knip.json への追加パターンを提案してください。
```

### 結果のハンドリング

**PASS の場合**: Step 6（集約サマリ）に進む。

**FAIL の場合**:

1. 検出された問題点をユーザーに提示する
2. ユーザーに次のアクションを選択してもらう：
   - **自動修正**: 該当レイヤーのサブエージェントを起動して修正 → 再チェック
   - **手動修正**: 問題点一覧を提示して終了
   - **knip.json 更新のみ**: 誤検知パターンを ignore / entry に追加して終了

自動修正を選択した場合、担当範囲に応じてサブエージェントを **並列** で起動（段階 A と同じ振り分け）。

**修正プロンプト（共通）：**

```
## 過大スコープ / 未使用要素の修正

`.claude/rules/coding-standards.md` の §YAGNI / §依存パッケージの管理 に違反している以下を修正してください。

### 修正対象

{該当エージェントの担当範囲に関する問題点をここに記載}

### 修正方針

- 削除推奨: 該当の export / ファイル / 依存を削除
- スコープ縮小: export → ローカル化、public → private 等の格下げ
- 誤検知のみ knip.json 更新で対処（コード変更なし）
- 修正後、`npx tsc --noEmit` と `npm run lint` を実行してエラーがないことを確認
```

修正後、knip と reviewer-scope を再実行。**修正→チェックのループは最大 2 回まで。**

## Step 6: 集約サマリ

3 段階すべてが完了したら、以下の集約サマリをユーザーに報告する：

```
## リファクタリングレビュー結果（集約）

### 段階 A: JSDoc
- 結果: PASS / FAIL
- 機械検出件数 / LLM 判定件数
- 残違反 / 修正サマリ

### 段階 B: DRY
- 結果: PASS / FAIL
- 残問題点 / 修正サマリ

### 段階 C: Scope
- 結果: PASS / FAIL
- 残問題点 / 修正サマリ
- knip.json 更新提案: あり / なし
```

## ルール

- 判定観点詳細は本スキルに書かない（各 `reviewer-*` および `coding-standards.md` が一次資料）
- ESLint / jscpd / knip の生出力をユーザーに直接見せない（reviewer の判定を必ず通す）
- 3 段階は **順次実行**（並列ではない）。前段階の修正ループが完了してから次段階に進む
- 修正ループは各段階で最大 2 回までとし、無限ループを防ぐ
- knip の誤検知が見つかった場合は `knip.json` 更新を提案する（自動更新はしない）
- 自動コミットしない（ユーザーが指示するまで待つ）
- レポートファイル（`.jscpd-report/`）はコミットしない（`.gitignore` 済み）
- 一時ファイル（`.crg-tmp/`）は `.gitignore` 済み。全段階完了後に削除してよい（必須ではない）
