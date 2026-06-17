# DB アーキテクチャ規約（Amplify Data + DynamoDB）

本ファイルは本テンプレートが採用する **Amplify Data (DynamoDB バックエンド)** に紐づくアーキテクチャ規約（DI / レイヤー境界）を定める。汎用的なレイヤー構成・配置ルールは `architecture.md` を参照。DB 固有のコーディング規約（命名等）は `coding-standards-db.md` を参照。他データストア（Aurora Postgres / DocumentDB 等）を採用するプロジェクトでは本ファイルを差し替えて運用する。

<!-- TODO: プロジェクト採用時に具体的な規約（Repository 関数シグネチャ、トランザクション境界、raw SDK 利用方針 等）を追記 -->
