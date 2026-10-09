# DB アーキテクチャ規約（Amplify Data + DynamoDB）

本ファイルは本プロジェクトが採用する**Amplify Data（AppSync）+ DynamoDB**に紐づくアーキテクチャ規約（型の参照範囲 / Repositoryの境界 / スキーマ変更）を定める。汎用的なレイヤー構成・配置ルールは`architecture.md`を参照。DB固有のコーディング規約は`coding-standards-db.md`を参照。他データストア（RDS / DocumentDB等）を採用するプロジェクトでは本ファイルを差し替えて運用する。

## スキーマ生成型のフロントからの参照

`amplify/data/resource.ts`が export する`Schema`型は、フロントエンドからの型参照（`import type { Schema } from "@/amplify/data/resource"`）を許容する。ドメイン型は`models/`で`Schema["Image"]["type"]`のように派生させ、フィールドを手書きで再定義しない（DRY違反になるため）。

- `generateClient`等のランタイム機能はRepositoryだけがimportする。Component / Hook / Serviceから直接呼ばない
- `amplify/data/resource.ts`の値（`schema` / `data`）はフロントからimportしない。型のみ（`import type`）とする

## Repositoryの境界

- **データアクセスはRepositoryに閉じる** — `client.models.*` / `client.graphql`をService以上で呼ばない。データクライアントはRepositoryのモジュール内で`generateClient<Schema>({ authMode: ... })`により生成する
- **Repositoryは汎用のデータ操作だけを提供し、業務判断を持たない** — 「+1する」「上限に達したら更新しない」「競合したら再試行する」等の判断はServiceが持つ。Repositoryは更新内容（必要なら更新条件）を引数で受け取る汎用の形にし、値の計算・条件の組み立て・結果の意味づけはServiceが行う
- **読んだ値をもとに書き戻す処理は、同時更新で値が失われうる** — 読み取りと書き込みの間に他の書き込みが入ると、片方の更新が上書きされる。厳密な整合が要件にある場合だけ、読んだ値と一致する場合に限って更新する条件付き書き込みを使う（不要なら付けない。YAGNI）
- **アクセス制御はスキーマの`authorization`で定義する** — Repositoryやフロントのコードで認可を代替しない。クライアントからの入力値の範囲チェックはサーバー側で強制されないため、信頼境界が必要な制約はカスタムmutation等のサーバー側で行う

## スキーマ変更ワークフロー

`amplify/data/resource.ts`がデータスキーマの**Single Source of Truth**。DynamoDBテーブル・AppSyncのGraphQLスキーマ・`amplify_outputs.json`はsandbox / デプロイ時に生成される派生物。

### 標準フロー

1. `amplify/data/resource.ts`を編集（モデル・フィールド・`authorization`・`secondaryIndexes`）
2. テーブル設定（TTL属性等）が必要なら`amplify/backend.ts`で`backend.data.resources.cfnResources.amplifyDynamoDbTables`を通じて設定する
3. `npm run sandbox`で反映し、`amplify_outputs.json`の再生成を確認する
4. `npx tsc --noEmit`（src/・shared/）と`npx tsc --noEmit -p amplify/tsconfig.json`（amplify/配下）の両方で型エラーを確認する
5. `models/`の派生型・Repository・Serviceを追従させる
6. スキーマ変更とアプリ層の変更を1つのコミットにまとめる

### 落とし穴

- **生成物を手動編集しない** — `amplify_outputs.json`はsandbox / デプロイで上書きされる
- **モデル名の変更はテーブルの作り直しになる** — 既存データは移行されず失われる。既存データを保持する必要がある環境では、新モデルの追加と移行手順を別途設計する
- **既存アイテムがあるモデルに必須フィールドを追加しない** — 既存アイテムには値が入らず、取得時に型と実データが食い違う。任意フィールドで追加するか、既存データを埋めてから必須にする
- **TTLの削除は即時ではない** — DynamoDBのTTLは期限から削除まで最大48時間遅れる。期限切れの判定をTTLの削除に頼らず、アプリ側で日時を比較して判定する
