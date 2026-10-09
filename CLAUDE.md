# Amplify Gen 2 + Next.js テンプレート

## プロジェクト概要

Amplify Gen 2 + Next.js の開発テンプレート。新規プロジェクトを作成する際はこのテンプレートをベースにする。

## 開発プロセス

- 開発時は `.claude/rules/` 配下のルールに従うこと

### レビューフローの運用

チャット中のリファクタリング・指摘修正でも、以下の節目では **レイヤー別 reviewer エージェント（backend-repository / backend-service / frontend-logic / frontend-ui / shared）と統合 reviewer を自発的に起動**して規約違反を検出すること（`/crg-review` スキルを利用）：

- **複数ファイル（3 つ以上）にまたがる変更後**
- **設計判断を伴うリファクタリング後**（責務再配置 / レイヤー越境 / 命名一貫性 / 抽象化粒度 等）

ユーザーから明示的な指示がなくても、上記の節目で `/crg-review` を呼び出してから完了報告を行う。`crg-implement` 経由ではない直接編集の場合に特に重要。

### ブラウザ自動化の運用

Claude in Chrome MCP を使う際は `.claude/rules/browser-automation.md` の制約・落とし穴（`window.fetch` フック不可 / Radix Dialog の閉操作 / `tabId` 無効化 / console 監視タイミング 等）を踏まえる。`/crg-design-check` 等のスキルも本ファイルを参照する。

## 注意事項

- 新規プロジェクト作成時は必ずこのテンプレートから作る。既存プロジェクトの流用禁止
- Claude in Chrome（ブラウザ自動操作）を自発的に起動しない。ユーザーが明示的に依頼した場合のみ使用する。HTML 生成物の確認は目視レビューをユーザーに委ねるか、コード上の構造チェックに留める
  - 例外: スキル / エージェントが本文で Chrome の使用範囲（閲覧してよい URL・禁止する操作）を明記している場合、その実行中に限り記載された範囲で使用を許可する
