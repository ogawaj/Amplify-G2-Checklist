---
paths:
  - "src/**"
  - "amplify/**"
  - "shared/**"
  - "scripts/**"
---

# アーキテクチャ

## 設計原則

以下の 8 原則に従ってコードを設計・実装する。個別の判断に迷った場合はこれらの原則に立ち返る。

1. **DRY（Don't Repeat Yourself）** — 同じロジックを 2 箇所以上に書かない。共有レイヤーや既存ユーティリティを活用する
2. **KISS（Keep It Simple, Stupid）** — 不要なコード・条件分岐・変換・抽象化を排除し、最もシンプルな実装を選ぶ
3. **YAGNI（You Aren't Gonna Need It）** — 今必要ないコード・機能・抽象化は作らない。使っていないものは削除する
4. **関心の分離（Separation of Concerns）** — 1 ファイル 1 責務、1 メソッド 1 責務。異なる関心事を混在させない
5. **高凝集・低結合（High Cohesion, Low Coupling）** — モジュールの入出力は汎用的に設計し、他モジュールへの依存を最小限にする
6. **驚き最小の原則（Principle of Least Astonishment）** — 関数名・変数名から予測できる振る舞いにする。暗黙の副作用を持たせない
7. **レイヤードアーキテクチャ（Layered Architecture）** — 後述のレイヤー構成を守り、各レイヤーの責務を超えた処理を書かない
8. **型安全（Type Safety）** — any や型アサーション（as）で型チェックを迂回しない。コンパイラに誤りを検出させる

## プロジェクト構成

Amplify Gen 2 + Next.js のフルスタックアプリケーション。フロントエンド（Next.js）・バックエンド（Lambda）・共有コードの 3 領域で構成する。

```
src/                        - フロントエンド（Next.js App Router）
├── app/
│   ├── (auth-page)/        - 認証必須ページ
│   ├── (public-page)/      - 公開ページ
│   ├── components/         - UI コンポーネント
│   ├── enums/              - ドメイン定数
│   ├── hooks/              - React Hooks（状態管理・API 呼び出し）
│   ├── models/             - データモデル
│   ├── providers/          - Amplify・認証プロバイダー
│   ├── repositories/       - データアクセス層
│   ├── services/           - ビジネスロジック層
│   └── utils/              - ユーティリティ
└── lib/
    └── shadcn/ui/          - shadcn コンポーネントライブラリ

amplify/                    - バックエンド（Amplify Gen 2）
├── auth/                   - Cognito UserPool 定義
├── data/                   - AppSync GraphQL スキーマ・モデル定義
├── functions/              - Lambda 関数
│   ├── common/             - Lambda 共有コード
│   │   ├── enums/          - ドメイン定数
│   │   ├── models/         - データモデル
│   │   ├── repositories/   - データアクセス層
│   │   └── services/       - ビジネスロジック層
│   └── <プレフィックス>-<機能名>/  - 各 Lambda 関数ディレクトリ
│       ├── resource.ts     - Lambda リソース定義（タイムアウト等）
│       └── handler.ts      - ハンドラー（エントリーポイント）
└── backend.ts              - バックエンド統合定義（CDK 設定）

shared/                     - フロントエンド・バックエンド共有コード
├── enums/                  - ドメイン定数
├── models/                 - データモデル
├── repositories/           - データアクセス層
├── services/               - ビジネスロジック層
└── utils/                  - ユーティリティ

scripts/                    - ローカル開発ツール（npm scripts から実行）
├── enums/                  - スクリプト用定数
├── models/                 - スクリプト用型定義
└── *.ts / *.cjs            - 実行スクリプト
```

プロジェクト固有のバックエンド構成によっては追加ディレクトリ（DB スキーマ定義、ORM 生成物等）が発生する。プロジェクト固有のディレクトリ規約は別途ルールファイルで定義する。

## フロントエンドのレイヤー構成

**データフロー:** Component → Hook → Service → Repository → AWS Amplify

| レイヤー   | 配置先          | 責務                                    |
| ---------- | --------------- | --------------------------------------- |
| Component  | `components/`   | UI レンダリング・イベントバインドのみ   |
| Hook       | `hooks/`        | React 状態管理・Service の呼び出し      |
| Service    | `services/`     | ビジネスロジック・Repository の呼び出し |
| Repository | `repositories/` | データアクセス層                        |

- **Component にビジネスロジックを書かない** — Hook 経由で Service を呼ぶ
- **Repository はデータアクセスのみ** — データ変換は Service で行う
- **Hook は Service を組み合わせる** — Repository を直接呼ばない
- **`src/lib/shadcn/ui/` 等のライブラリコンポーネントを直接編集しない** — ラッピングした独自コンポーネントを作成するか、使用箇所で対応する

## バックエンドのレイヤー構成

**データフロー:** Handler → Service → Repository → 外部システム（データストア / 外部 API 等）

| レイヤー   | 配置先                           | 責務                                       |
| ---------- | -------------------------------- | ------------------------------------------ |
| Handler    | `functions/*/handler.ts`         | イベント受信・引数取り出し・レスポンス返却 |
| Service    | `functions/common/services/`     | ビジネスロジック・Repository の呼び出し    |
| Repository | `functions/common/repositories/` | データアクセス層                           |
| Resource   | `functions/*/resource.ts`        | Lambda リソース定義（タイムアウト）        |

- **Handler にビジネスロジックを書かない** — Service に委譲する
- **Amplify.configure はハンドラーのトップレベルで実行** — Service・Repository では行わない
- **インフラ系のモジュール（外部接続クライアント等）は `services/` 配下に置く** — 標準 4 レイヤー（enums / models / repositories / services）に収まらないインフラ的なモジュールも `services/` に配置し、規約外サブディレクトリは作らない

## 配置ルール（service / repository / model / enum 共通）

| 配置先                        | 判断基準                                                                    |
| ----------------------------- | --------------------------------------------------------------------------- |
| `shared/`                     | フロントエンド・バックエンド両方から参照。上位レイヤーへの依存禁止          |
| `src/app/*/`                  | フロントエンド専用。shared/ への依存は OK                                   |
| `amplify/common/*/`           | CDK 層（backend.ts）共有。**shared/ への依存は禁止**（下記 §例外 参照）     |
| `amplify/functions/common/*/` | バックエンド共有。shared/ への依存は OK                                     |
| `amplify/functions/*/`        | 特定 Lambda 専用。common/ や shared/ への依存は OK                          |
| `scripts/*/`                  | ローカル開発ツール専用。amplify/ や src/ には依存しない（独立した型・定数） |

**判断基準:** 「どこから参照されるか」ではなく「**上位レイヤーに依存しないか**」が shared / common の条件。

**定数・ヘルパーは実際に参照するレイヤーに配置する** — 例えば Service のみが参照する定数（表示用フォールバックキー等）を Repository に置かない（Repository はデータアクセスが責務）。

### 例外: CDK 層から `@/shared/` を import しない

**CDK 評価時に実行されるファイル**（`amplify/backend.ts` / `amplify/data/resource.ts` / `amplify/common/**`）から `@/shared/...` を import してはいけない。これらは `ampx` の CDK 評価時に tsx で実行され、`@/* → ../*` の paths マッピングがランタイムで効かないため、**tsc / lint は通るが sandbox / デプロイ時に `does not provide an export named '...'` の SyntaxError** で失敗する（Lambda handler は esbuild バンドルなので shared/ import 可）。

- フロント・バック両方から参照される enum でも、CDK 層が使うものは `amplify/common/enums/` に置く（例: `api-operation.ts`。フロントは `@/amplify/common/enums/api-operation` で参照する）
- backend.ts で enum 値が必要な場合は **静的リテラルで列挙** するか `amplify/common/enums/` に置く
- CDK 層へ依存を追加したら必ず sandbox 起動で動作確認する

## Lambda 関数

- **ディレクトリ名プレフィックス:** プロジェクトを識別する接頭辞を付ける（既存の Lambda 関数名から判断する）
- **resource.ts:** `defineFunction` で Lambda を定義。タイムアウトはここで設定する
- **handler.ts（または index.ts）:** ハンドラーのエントリーポイント。トップレベルで `Amplify.configure` を実行する
- **backend.ts への登録:** 新規 Lambda は `amplify/backend.ts` にも追加する

## 環境変数管理

### レイヤーごとに独立した env-variable

環境変数は実行コンテキストごとに **独立した型・定数・サービス** を持つ。レイヤー間で機械的に対称化せず、各レイヤーで実際に参照されるフィールドのみを保持する（YAGNI）。

| レイヤー                                            | 実行コンテキスト                        | 環境切替                 |
| --------------------------------------------------- | --------------------------------------- | ------------------------ |
| `amplify/common/{models,enums,services}/`           | CDK 実行時（`backend.ts` の評価）       | `process.env.AWS_BRANCH` |
| `amplify/functions/common/{models,enums,services}/` | Lambda ランタイム（バンドルに含まれる） | `process.env.ENV`        |
| `src/app/{models,enums,services}/`                  | Next.js（クライアント・SSR）            | ビルド時注入             |
| `scripts/{models,enums,services}/`                  | ローカル開発スクリプト                  | sandbox 固定または独自   |

各レイヤーの enum ファイル群は環境ごとに分離する（`env-variable-{sandbox.example,sandbox,dev,stag,prod}.ts`）。`env-variable-sandbox.ts` は gitignore とし、`scripts/prepare-sandbox.cjs` の postinstall で `.example.ts` から自動生成する。

利用しない環境ファイルは作らない（例: scripts/ が sandbox 専用なら dev/stag/prod は作らない）。

### Lambda の環境変数注入（backend.ts）

- **`addEnvironment("KEY", value)` を使う** — Amplify フレームワークが自動注入する環境変数（AppSync エンドポイント等）を保持したまま追加できる
- **`cfnFunction.environment = { variables: {...} }` の直接代入は禁止** — Amplify 自動注入分を上書きしてしまうため
- **個別の DB 接続情報など環境ごとに変わる値は `addEnvironment` で個別注入しない** — Lambda バンドルに含まれる `amplify/functions/common/enums/env-variable-*.ts` を `getEnvVariable()` で読む方式に統一する。`addEnvironment` で必要なのは「どの env ファイルを読むか」を決める `ENV` のみ
- **`AWS_REGION` は Lambda ランタイムが自動設定する予約環境変数なので注入不要**

## 性能・バッチ処理

- **N+1 を避ける**: ループ内で Repository / 外部 API を 1 件ずつ呼ばない。バッチ前段で対象をまとめて取得し、Map 化して参照する
- **行単位の独立性と全体停止を使い分ける**: 行ごとに独立して処理すべきバッチ（CSV 取込・同期等）は 1 行の例外で全体を止めず、行の失敗として記録して続行する。逆に DB 接続断など全体に及ぶ例外は行単位で握りつぶさず throw する
- **AppSync 経由の同期 operation は 30 秒制限を前提に設計する**（引き上げ不可）: 件数に比例する処理は分割送信、または時間予算による打ち切りと継続（処理済み件数を返し、呼出側が未処理分を再送）で収める。継続処理の進行条件は無限ループの余地がない形にする（処理済み 0 件はエラーにする）
- **同一呼び出し内で同じ取得を重複させない**: 外部 API の Call Limits・DB 読み取りを浪費する。1 度取得した値（トークン・レート等）は引き回す
- **独立した取得は `Promise.all` で並列化し、順序依存のある処理は並列化しない**（既定リソースの作成 → 後続が利用、等）
- **Lambda のタイムアウト（`resource.ts`）は処理の想定所要時間と整合させる**

## バックエンド実装の選択肢

データストア・ORM・リゾルバーパターン等の選択はプロジェクトごとに異なる。本プロジェクトのデータストアは DynamoDB（Amplify Data）で、モデル定義は `amplify/data/resource.ts` に集約し、DynamoDB へのアクセスは Repository 層に閉じる。DB 固有のアーキテクチャ規約は `architecture-db.md`、コーディング規約は `coding-standards-db.md` を参照。

## Next.js ルーティング

- **Route Groups** で認証有無を分離: `(auth-page)/` と `(public-page)/`

## モジュールエイリアス

| エイリアス   | 解決先                    |
| ------------ | ------------------------- |
| `@/*`        | プロジェクトルート（`/`） |
| `$amplify/*` | `.amplify/generated/*`    |
