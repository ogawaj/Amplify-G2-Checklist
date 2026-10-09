---
name: crg-html-design-doc
description: >
  プロジェクトドキュメントをフォーマットに沿って生成するスキル。対象は以下の全種別：
  【HTML】requirements.html / design.html / tasklist.html（ステアリングタスク）
  【Markdown】plan.md（ステアリング計画）/ product-requirements.md / functional-design.md（永続ドキュメント）
  「設計書を生成して」「requirements.html を作って」「design.html を作成して」
  「tasklist.html を書いて」「plan.md を作成して」「要求定義書を更新して」
  「機能設計書を書いて」など、ドキュメント生成・更新を求められたときに必ず使用する。
  `/crg-create-steering-task` `/crg-create-steering-plan` `/crg-update-persistent` 内での生成にも活用する。
---

# 設計書生成スキル

## 概要

プロジェクト標準フォーマットでドキュメントを生成する。対象は HTML（steering タスク 3 種）と
Markdown（plan.md・persistent 2 種）の計 6 種別。
内容はユーザーから受け取るか、会話のコンテキストから抽出する。

---

## 生成手順

1. **ドキュメント種別を確認する**
   - 不明な場合はユーザーに確認
   - HTML 種別（requirements / design / tasklist）: タイトルは「task-NN: 〇〇」形式
   - Markdown 種別（plan / product-requirements / functional-design）

2. **対応する構成テンプレートに従ってコンテンツを組み立てる**（後述）

3. **フォーマットに従って生成する**
   - HTML 種別 → 下記の CSS テンプレートを使用
   - Markdown 種別 → 下記の Markdown 構成ガイドを使用

4. **`Write` ツールで指定パスに出力する**

---

## CSS テンプレート（全ファイル共通）

```html
<!DOCTYPE html>
<html lang="ja">
  <head>
    <meta charset="UTF-8" />
    <title>[ファイル名] — [タイトル]</title>
    <style>
      :root {
        --primary: #2563eb;
        --primary-dark: #1e40af;
        --primary-light: #eff6ff;
        --border: #e2e8f0;
        --text: #1e293b;
        --muted: #64748b;
        --code-bg: #f1f5f9;
      }
      * {
        box-sizing: border-box;
      }
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        max-width: 860px;
        margin: 2rem auto;
        padding: 0 1.5rem 3rem;
        line-height: 1.7;
        color: var(--text);
        background: #fff;
      }
      /* ─── ページヘッダー ─── */
      .page-header {
        background: linear-gradient(135deg, #1e3a5f 0%, var(--primary) 100%);
        color: #fff;
        padding: 1.5rem 2rem;
        border-radius: 10px;
        margin-bottom: 2rem;
      }
      .page-header .badge {
        display: inline-block;
        background: rgba(255, 255, 255, 0.2);
        font-size: 0.7rem;
        font-weight: 600;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        padding: 0.2em 0.7em;
        border-radius: 999px;
        margin-bottom: 0.6rem;
      }
      .page-header h1 {
        margin: 0;
        font-size: 1.35rem;
        font-weight: 700;
        color: #fff;
      }
      /* ─── セクション共通 ─── */
      section {
        margin-bottom: 1.5rem;
        padding: 1.25rem 1.5rem;
        border: 1px solid var(--border);
        border-left: 4px solid var(--primary);
        border-radius: 6px;
        background: #fff;
      }
      section h2 {
        margin: 0 0 0.9rem;
        font-size: 0.8rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--primary);
      }
      section h3 {
        margin: 1rem 0 0.4rem;
        font-size: 0.85rem;
        font-weight: 700;
        color: var(--text);
      }
      section h3:first-of-type {
        margin-top: 0;
      }
      section p {
        margin: 0 0 0.5rem;
        font-size: 0.95rem;
      }
      section p:last-child {
        margin-bottom: 0;
      }
      /* ─── コード ─── */
      code {
        background: var(--code-bg);
        color: #c2410c;
        padding: 0.1em 0.35em;
        border-radius: 3px;
        font-size: 0.87em;
        font-family: "SFMono-Regular", Consolas, monospace;
      }
      pre {
        background: var(--code-bg);
        padding: 1em;
        border-radius: 4px;
        overflow-x: auto;
        font-size: 0.87em;
      }
      /* ─── リスト共通 ─── */
      ul {
        margin: 0;
        padding: 0;
        list-style: none;
      }
      ul li {
        position: relative;
        padding: 0.35em 0 0.35em 1.8em;
        font-size: 0.95rem;
        border-bottom: 1px solid #f1f5f9;
      }
      ul li:last-child {
        border-bottom: none;
      }
      /* ユーザーストーリー */
      .stories li::before {
        content: "👤";
        position: absolute;
        left: 0;
        top: 0.3em;
        font-size: 0.9em;
      }
      /* 受け入れ条件 */
      .checklist li::before {
        content: "☐";
        position: absolute;
        left: 0;
        top: 0.3em;
        color: var(--primary);
        font-size: 1.1em;
        line-height: 1.4;
      }
      /* 制約事項 */
      .constraints li::before {
        content: "⚠️";
        position: absolute;
        left: 0;
        top: 0.35em;
        font-size: 0.8em;
      }
      /* 実装アプローチ・影響範囲 */
      .approach li::before,
      .impact li::before {
        content: "▸";
        position: absolute;
        left: 0;
        top: 0.3em;
        color: var(--primary);
        font-size: 0.9em;
      }
      /* 完了条件 */
      .done-list li::before {
        content: "✓";
        position: absolute;
        left: 0;
        top: 0.3em;
        color: #16a34a;
        font-weight: 700;
      }
      /* ─── 制約・警告セクション ─── */
      section.constraint-section {
        border-left-color: #f59e0b;
        background: #fffbeb;
      }
      section.constraint-section h2 {
        color: #92400e;
      }
      /* ─── 完了条件セクション ─── */
      section.done-section {
        border-left-color: #16a34a;
        background: #f0fdf4;
      }
      section.done-section h2 {
        color: #15803d;
      }
      /* ─── テーブル ─── */
      table {
        border-collapse: collapse;
        width: 100%;
        font-size: 0.88rem;
        margin-top: 0.25rem;
      }
      th,
      td {
        border: 1px solid var(--border);
        padding: 0.45em 0.75em;
        text-align: left;
      }
      th {
        background: #f8fafc;
        font-weight: 600;
      }
      .note {
        margin-top: 0.75rem;
        font-size: 0.88rem;
        color: var(--muted);
      }
    </style>
  </head>
  <body>
    <!-- コンテンツをここに配置 -->
  </body>
</html>
```

---

## ドキュメント種別ごとの構成

### requirements.html（バッジ: Requirements）

| セクション         | 要素          | クラス                                      |
| ------------------ | ------------- | ------------------------------------------- |
| サマリ             | `<p>` で概要  | —                                           |
| ユーザーストーリー | `<ul>` リスト | `stories`                                   |
| 受け入れ条件       | `<ul>` リスト | `checklist`                                 |
| 制約事項           | `<ul>` リスト | `constraints`、`section.constraint-section` |

### design.html（バッジ: Design）

| セクション           | 要素          | クラス                       |
| -------------------- | ------------- | ---------------------------- |
| 実装アプローチ       | `<ul>` リスト | `approach`                   |
| 設計判断（警告）     | `<p>`         | `section.constraint-section` |
| 変更ファイル一覧     | `<table>`     | —                            |
| DDL 変更概要（任意） | `<table>`     | —                            |
| 影響範囲             | `<ul>` リスト | `impact`                     |

### tasklist.html（バッジ: Tasklist）

| セクション         | 要素                                         | 備考                   |
| ------------------ | -------------------------------------------- | ---------------------- |
| 実装チェックリスト | フェーズ別 `<h3>` + `<ul class="checklist">` | フェーズ A / B / C …   |
| 完了条件           | `<ul class="done-list">`                     | `section.done-section` |

---

## セクション・クラス早見表

| 用途                 | クラス / 属性                | アイコン / 色        |
| -------------------- | ---------------------------- | -------------------- |
| ユーザーストーリー   | `ul.stories`                 | 👤                   |
| 受け入れ条件         | `ul.checklist`               | ☐ 青                 |
| 制約・警告リスト     | `ul.constraints`             | ⚠️                   |
| 実装アプローチ       | `ul.approach`                | ▸ 青                 |
| 影響範囲             | `ul.impact`                  | ▸ 青                 |
| 完了条件リスト       | `ul.done-list`               | ✓ 緑                 |
| 制約・警告セクション | `section.constraint-section` | 左ボーダー橙・黄背景 |
| 完了条件セクション   | `section.done-section`       | 左ボーダー緑・緑背景 |

---

---

## Markdown 種別の構成ガイド

### plan.md（ステアリング計画）

**配置先:** `doc/steering/[YYYYMMDD][連番]-[タイトル]/plan.md`

```markdown
# [開発タイトル] 計画

## 目的・スコープ

（全体の目的・対象範囲・スコープ外の明示）

## タスク一覧

### task-NN-タイトル（機能・画面名）

- **概要**: 何を実装するか（2〜5行）
- **依存**: task-XX（依存タスク名）

（タスクごとに繰り返す）

---

## 推奨実行順序

| 順  | タスク      | 着手条件 | 並列実行可能性 |
| --- | ----------- | -------- | -------------- |
| 1   | task-NN-xxx | —        | —              |
```

**留意点:**

- タスク番号は 2 桁ゼロ埋め（task-01, task-02 …）
- 依存関係は「task-XX が完了後に着手可能」を着手条件欄に記載
- スコープ外は「### スコープ外」セクションに箇条書き

---

### product-requirements.md（プロダクト要求定義書）

**配置先:** `doc/persistent/product-requirements.md`

主要セクション構成（`document.md` §永続的ドキュメント 参照）:

| セクション                       | 内容                                                         |
| -------------------------------- | ------------------------------------------------------------ |
| プロダクトビジョンと目的         | ビジョン・目的・背景                                         |
| ターゲットユーザーと課題・ニーズ | ユーザー像・課題表（#/課題/詳細）・ニーズ                    |
| 主要な機能一覧                   | ID/機能名/概要 の表                                          |
| バッチ処理・Webhook 一覧         | ID/処理名/処理内容/対応機能 の表                             |
| 画面一覧                         | ID/画面名/対応機能/認証 の表                                 |
| 成功の定義                       | 番号付き箇条書き                                             |
| ビジネス要件                     | ID/要件/詳細 の表                                            |
| ユーザーストーリー               | ドメイン別に ID/ストーリー の表                              |
| 受け入れ条件                     | AC-NN ごとに箇条書き                                         |
| 機能要件                         | FR-NN ごとに箇条書き（何ができるかのみ、実装方式は書かない） |
| 非機能要件                       | パフォーマンス目標・セキュリティ要件の表                     |

**禁止事項:** 技術固有名称（Lambda / Cognito / Prisma 等）を書かない。「どう実現するか」は functional-design.md の領分。

---

### functional-design.md（機能設計書）

**配置先:** `doc/persistent/functional-design.md`

主要セクション構成（`document.md` §永続的ドキュメント 参照）:

| セクション               | 内容                                                     |
| ------------------------ | -------------------------------------------------------- |
| 技術スタック             | レイヤー/技術 の表                                       |
| システム構成図           | Mermaid flowchart                                        |
| アーキテクチャレイヤー   | フロント・バックのレイヤー表                             |
| 画面設計                 | ルートパス定義表・レイアウト構成・画面遷移図（Mermaid）  |
| データモデル定義         | ER 図（Mermaid erDiagram）+ テーブル定義表               |
| API 設計                 | operation 一覧表（operation/入力/戻り値/対応機能/説明）  |
| Lambda 関数一覧          | 関数名/タイムアウト/メモリ/トリガー/説明 の表            |
| バッチ処理・Webhook 設計 | 実装方式・頻度・テーブル書き込みマトリクス・処理フロー図 |
| 外部 API 連携            | API 一覧・メソッド一覧・Call Limits                      |

**留意点:** 「何が必要か」は product-requirements.md の領分。ここには技術的な実現方法のみ記載。

---

## 注意事項

- HTML 種別の行数目安: requirements ≤100行、design ≤300行、tasklist ≤200行（`document.md` §スリム化ルール）
- コード例・型定義のコピーは禁止。パスのみ記載
- 同じ情報を複数ファイルに書かない
- Markdown 種別は `document.md` §永続的ドキュメント §作業単位のドキュメント の分離基準に従う
