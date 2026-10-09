# レイヤー別 reviewer 共通定義

`/crg-review` が起動するレイヤー別 reviewer（`reviewer-backend-repository` / `reviewer-backend-service` / `reviewer-frontend-logic` / `reviewer-frontend-ui` / `reviewer-shared`）の共通ルール。判定基準は `.claude/rules/` が一次資料であり、本ファイルと各 reviewer 定義には **規約本文を書かない**（読む節の指定と、規約に無い検出手順・観点だけを書く）。

## 共通の前提

- ファイルの編集は一切行わない（読み取りと分析のみ）
- レビュー対象ファイルは呼出側のプロンプトで指定される。指定されたファイルだけを判定し、他レイヤーのファイルの規約違反は指摘しない
- 型チェック・lint・ESLint JSDoc の機械検出は呼出側が実行済みで、整形結果のパス（detection-result）が渡される。reviewer 自身では再実行しない
- **境界違反の逆引きは許可する**: レイヤー境界の違反は「呼ばれる側」ではなく「呼ぶ側」に現れる。自レイヤーへの import 元を `grep` で逆引きし、違反があれば呼ぶ側のファイルを指摘してよい
- ステアリングディレクトリが指定された場合は design.html を読み、自レイヤーのファイル構成・データフロー・命名が設計どおりかを観点 A に含める。受け入れ条件の充足は統合 reviewer の担当

## 4 つの観点

| 観点 | 判定基準（一次資料） |
| --- | --- |
| A: 設計・規約 | `.claude/rules/architecture.md`・`coding-standards.md`（DB 関連は `architecture-db.md`・`coding-standards-db.md`、API 関連は `api-design.md`）。各 reviewer 定義が指定する節を読み、対象ファイルを照合する |
| B: JSDoc・文言 | `coding-standards.md` §JSDoc / §文言の言語。detection-result の機械検出は要約のみ記載し、意味的判定（言語・書くべきもの・書かないもの・コードとの乖離）を LLM が担う。機械検出 0 件でも必ず実施する |
| C: セキュリティ | `api-design.md` §セキュリティ、`architecture-db.md` §Repository の境界（認可・サーバー側の強制）。自レイヤーで起きうる項目に絞って照合する |
| D: 品質・性能 | `architecture.md` §性能・バッチ処理、`coding-standards-db.md` §クエリの効率、`coding-standards.md` §契約上あり得ないケースに見せかけの既定値で蓋をしない / §React Component の書き方。加えて `any` / `as` / `!` による型チェックの迂回（`architecture.md` §設計原則 #8） |

## 出力形式

```
### レビュー結果（{reviewer 名}）: PASS / FAIL

対象: N ファイル（一覧）

#### 観点 A: 設計・規約
1. [問題の説明] — [path:line]（違反した規約の節）

#### 観点 B: JSDoc・文言
機械検出（ESLint）: N 件（要約）
1. [問題の説明] — [path:line]

#### 観点 C: セキュリティ
1. [問題の説明] — [path:line]

#### 観点 D: 品質・性能
1. [問題の説明] — [path:line]

#### 改善推奨（任意・FAIL 要因にしない）
- [path:line] → 改善案

#### 統合 reviewer への申し送り
- 層をまたぐ懸念（DTO の契約 / operation の整合 / 他レイヤーの呼び出し側で確認が必要な点）。無ければ「なし」
```

- 各観点で問題が無ければ「問題なし」とだけ書く
- **総合判定**: 観点 A〜D のいずれかに修正必須の指摘が 1 件でもあれば FAIL。改善推奨のみなら PASS
