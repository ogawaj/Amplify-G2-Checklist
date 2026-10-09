---
paths:
  - "src/**"
  - "amplify/**"
  - "shared/**"
  - "scripts/**"
---

# コーディング規約

## 命名規則

| 対象                                    | 規則                                                      | 例                                                                           |
| --------------------------------------- | --------------------------------------------------------- | ---------------------------------------------------------------------------- |
| ファイル名                              | kebab-case（役割サフィックス付き）                        | `todo-service.ts`, `todo-repository.ts`, `use-todo.ts`                       |
| ファイル名と型名/クラス名               | ファイル名 = 主要型/クラス名（**1 ファイル 1 ドメイン**） | `todo-service.ts` → `TodoService` / `db-todo.ts` → `DbTodo` (+ 派生型を同居) |
| クラス名                                | PascalCase                                                | `EnumUtils`, `StorageService`                                                |
| 関数名                                  | camelCase                                                 | `createTodo`, `observeApiTodos`                                              |
| 変数                                    | camelCase                                                 | `dailyOwners`, `accessCount`                                                 |
| ドメイン定数（as const）                | UPPER_SNAKE_CASE                                          | `BATCH_OPERATION`, `CACHE_TYPE`                                              |
| 型・type                                | PascalCase（`I` プレフィックス不要）                      | `Todo`, `ApiTodo`, `DailyAccessSummaryRecord`                                |
| Lambda ディレクトリ名                   | kebab-case（プレフィックス付き）                          | `xxx-say-hello`, `xxx-aggregate-access`                                      |
| Lambda 関数名（defineFunction の name） | camelCase（プレフィックス付き）                           | `xxxSayHello`, `xxxAggregateAccess`                                          |
| React Hook                              | `use` + PascalCase                                        | `useTodos`, `useCreateTodo`                                                  |

xxxはプロジェクト名に合わせて変更する。

### 関数名のプレフィックス規則

Repository は **データ操作の語彙**（フロント・バック共通）、Service は **ドメイン動詞** で命名する。

| レイヤー                           | プレフィックス/パターン                                                     | 例                                                                           |
| ---------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Repository（フロント・バック共通） | `get*` / `list*` / `create*` / `update*` / `merge*` / `delete*` / `search*` | `getUserById`, `listOrders`, `createOrder`, `mergeSummary`, `searchProducts` |
| Service（フロント・バック共通）    | ドメイン動詞（`get*` / `list*` / `create*` 等）                             | `getCurrentUser`, `listOrders`, `createOrder`, `aggregateAccess`             |

Repository と Service で同じ動詞を使うため、import 元で名前が衝突する場合は **import alias** で解決する（`import { getUserById as getUserRecordById } from "..."` 等）。

#### 「手段」ではなく「意図」を表す動詞を選ぶ

関数名は **何をするか（意図）** を表すべきで、**どう実現するか（手段）** を含めない。

✗ 悪い例: `callApi*` / `callDb*` / `fetchFromCache*` / `invokeRpc*` — 呼出方法（手段）を含む

○ 良い例: `get*` / `create*` — データ操作の意図のみ

データソース（API / DB / Cache 等）は **ファイル配置**（`repositories/` のディレクトリ階層）で既に表現されているため、関数名に重ねない。

#### Repository 動詞の使い分け

| 動詞                   | 用途                                        |
| ---------------------- | ------------------------------------------- |
| `get<Resource>By<Key>` | 単一取得（キー指定）                        |
| `list<Resources>`      | 複数取得（複数形にする）                    |
| `create<Resource>`     | 新規作成                                    |
| `update<Resource>`     | 更新                                        |
| `delete<Resource>`     | 削除                                        |
| `merge<Resource>`      | 存在すれば更新、なければ作成（upsert 相当） |
| `search<Resources>`    | 検索（複数キー / フィルタ）                 |

#### `is*` / `has*` プレフィックスの規約

- `is*` / `has*` プレフィックスの関数は **`boolean` を返す**（または `value is Type` の型ガード述語）
- 値そのものや `T | undefined` を返したい場合は `get*` / `find*` を使う

理由: 架構原則 #6 驚き最小の原則。`is*` プレフィックスから「真偽値が返る」と期待される。

✗ 悪い例:

```typescript
// 戻り値が enum メンバー or undefined なのに is* プレフィックス
export const isEnumValue = <T>(enms: T, v: unknown): T[keyof T] | undefined => { ... }
```

○ 良い例:

```typescript
// boolean を返す
export const isEnumMember = <T>(enms: T, v: unknown): boolean => { ... }
// または型ガード
export const isEnumMember = <T>(enms: T, v: unknown): v is T[keyof T] => { ... }
// 値が欲しいなら get*
export const getEnum = <T>(enms: T, v: unknown): T[keyof T] | undefined => { ... }
```

#### Service / Repository は「ドメイン軸」で命名する

Service / Repository のファイル名・関数名は **ドメイン（リソース / 機能のまとまり）軸** で命名し、画面名・機能名（UI 構造）で命名しない。画面依存命名は画面の改廃に伴うリネームを誘発し、Service の再利用性を損なう。

✗ 悪い例:

- `setting-service.ts`（「設定画面」依存）
- `dashboard-service.ts`（画面依存）
- `csv-import-service.ts`（UI 操作依存）

○ 良い例:

- `user-setting-service.ts`（ドメイン: ユーザー設定）
- `shipping-rate-service.ts`（ドメイン: 配送料）
- `inventory-service.ts`（ドメイン: 在庫）

判断基準: 「**画面を作り直しても、この Service / Repository は同じ名前で使い続けられるか**」を問う。

**関数の配置先もドメイン軸で判断する** — 単一ドメインのデータしか参照しない関数は、機能軸のファイル（`sales-report-repository` のようなレポート・画面機能単位のファイル）ではなく、そのドメインの Repository / Service に置く。機能軸のファイルを設けるのは複数ドメインにまたがる処理（横断集計等）に限る。ただし、特定ユースケース固有のクエリ群で汎用 CRUD の Repository が肥大化する場合は、**「主ドメイン + 関心事」のファイル**（`<domain>-<concern>-repository.ts`。例: 集計用の `todo-summary-repository.ts`）へ分割してよい。

#### 汎用機構の名前に初出ドメインを含めない

複数ドメインで共有しうる共通機構（ワーカーの入出力契約・ループ制御・バッチ骨格等）の型名・ファイル名は、**最初に利用したドメイン名ではなく契約の内容**で命名する（✗ `OrderSyncLoopInput`（初出ドメイン名）○ `LoopingSyncWorkerInput`（契約の内容））。JSDoc の説明文も特定ドメインの用語で書かず、契約として汎用に記述する。

**引数名も同様に呼出元コンテキストに依存させない** — Repository / Service の引数名は呼び出し元のローカル変数名（`fetchedIds` 等）に引っ張られず、「保持する ID 集合」など Repository としての汎用的な意味で命名する（例: `deleteCategoriesNotIn(fetchedIds)` ✗ → `deleteCategoriesNotIn(categoryIds)` ○）。

**変数名も外部レスポンスの構造上の名前に依存させない** — 外部 API の配列キー等（`members` / `items` / `entries` / `data`）は生レスポンス型（`*RawResponse`）のフィールドに留め、Repository の戻り値を受ける変数以降はドメインの名前にする（✗ `const members = await listReturns()` ○ `const returns = await listReturns()`。型は生レスポンス型のままでよい）。

### 単位・通貨・TZ をフィールド名のサフィックスで明示する

金額・日時など「値の解釈規約」を持つフィールドは、サフィックスで単位を自明にする（例: `shippingCostJpy` / `priceUsd`）。**システム内 UTC 保持の例外として JST 値を運ぶフィールドも同様に `Jst` サフィックスを付ける**（例: `dateFromJst` / `dateToJst`）。型（string）や JSDoc だけでは規約の例外が利用側から見えないため、無印名（`dateFrom` 等）で JST 値を運ばない。

## エクスポート

- **名前付きエクスポートのみ**使用する。default export は使わない（Next.js の page.tsx / layout.tsx を除く）
- barrel ファイル（`index.ts`）は使わない。直接パスで import する
- **同一ファイル内からのみ参照される宣言は export しない**（情報隠蔽）。外部ファイルから参照が生じた時点で export に昇格する。クエリ条件の定数・中間型（ネスト構造の内側の型等）が典型例

## データモデル

- **`type` のみ使用**する（`interface` は使わない）
- **1 ファイル 1 ドメイン** — 1 つの `.ts` ファイルには 1 つの主要モデルとその派生型（`*CreateInput` / `*UpdateInput` / `*Key` / `*Filter` 等）を同居させる。ファイル名は主要モデル名にケバブケースで一致させる（例: `sample-item.ts` → 主要型 `SampleItem` + `SampleItemKey` / `SampleItemCreateInput` / `SampleItemUpdateInput`）。**異なるドメインの型は同居させない**
  - 例外: コンポーネントファイル（`.tsx`）内に閉じる Props 型など、**当該ファイル外から参照されない非公開型** は同居可
- **配置先は `models/`** — DB 由来型・UI 由来型（フォーム入力値等）・GraphQL DTO（`*Dto`）・外部 API 連携の payload（OAuth state 等）など、**データの形状を表す型はすべて `models/` に集約する**。`components/` / `services/` / `repositories/` / `hooks/` / `utils/` / `api/` 等の他レイヤー配下に直接定義しない（例外は §1 ファイル 1 ドメイン の通り、同ファイル内に閉じる非公開型のみ）
- **共有 DTO は `shared/models/`** — フロント・バックエンド両方で参照される DTO（GraphQL の generic dispatcher で送受信する JSON 形状など）は `shared/models/` に置いて重複定義を避ける（DRY 原則）。各層で `import type { ... } from "@/shared/models/..."` で参照する
- 各プロパティに JSDoc コメントを付ける

```typescript
/** Todo モデルの型定義 */
export type ApiTodo = Schema["Todo"]["type"];
```

```typescript
/** 日別アクセス集計レコード */
export type DailyAccessSummaryRecord = {
  /** 日付（YYYY-MM-DD） */
  date: string;
  /** アクセス数 */
  accessCount: number;
};
```

### データモデルと派生命名の単複形

データモデル（主要型）の名前は **単数形** で定義し、Service / Repository / DTO / Hook の命名を揃える。複数形を使うのは「複数件を扱う関数」のみ（`list<Resources>` / `search<Resources>` の動詞部分）。

| 項目         | 形   | 例                        |
| ------------ | ---- | ------------------------- |
| データモデル | 単数 | `UserSetting`             |
| ファイル名   | 単数 | `user-setting-service.ts` |
| DTO 型       | 単数 | `UserSettingDto`          |
| Hook         | 単数 | `useUserSetting`          |
| 単一取得関数 | 単数 | `getUserSetting`          |
| 複数取得関数 | 複数 | `listUserSettings`        |

「1 ユーザー 1 行」のような **single-record モデル** も、モデル定義が単数（`UserSetting`）なら **単数形で命名する**。ストレージ層（DB テーブル名等）が複数形であってもアプリ層はモデル名（単数）に揃える（ストレージ⇔アプリ層の差はマッピング層で吸収する）。

> 本プロジェクトで採用している DB / ORM 固有の単複形整合は `coding-standards-db.md` を参照。

## ドメイン定数

**配置先:** `architecture.md` §配置ルール に従う（service / repository / model / enum 共通）。

**定義方法:** `as const` オブジェクトとして定義し、値のユニオン型を **別名（PascalCase）** で導出する。**キー名・値はいずれも UPPER_SNAKE_CASE で統一する**（DB に保存される値が小文字でも、enum 上のキー側は大文字に揃える）：

```typescript
// キー・値: いずれも UPPER_SNAKE_CASE
export const BATCH_OPERATION = {
  AGGREGATE: "AGGREGATE",
} as const;

// 型: PascalCase（値と別名）
export type BatchOperation =
  (typeof BATCH_OPERATION)[keyof typeof BATCH_OPERATION];
```

**利用ルール:** 定義済みのドメイン定数は **必ず enum 経由で参照** する。文字列リテラルを直接書かない。**enum 値の所属チェック / 取得は `EnumUtils.getEnum` を使う**（戻り値が `undefined` でなければ所属。`Set` を毎回構築したり `Object.values(...).includes(...)` を散らさない）。

✗ 悪い例:

```typescript
role: input.role ?? "general",
```

○ 良い例:

```typescript
import { USER_ROLE } from "@/shared/enums/user-role";
role: input.role ?? USER_ROLE.general,
```

理由: 値変更時の修正漏れ防止、IDE 補完、リファクタ耐性、型安全（架構原則 #8）。

**enum 化のトリガー:** 「**同一の意味を持つ文字列値が 2 箇所以上で参照される**」時点で `enums/` に集約する（特にフロント / バックの境界をまたぐ値は必須）：

- API のエラーコード（OAuth コールバックの `?error=<reason>` 等）
- URL クエリ / パスパラメータの識別子
- 外部システム（DB / API）と一致させる必要のあるステータス値
- フロントの switch 文で扱う「サーバー発行の状態値」

これらを enum 化することで「発行側」と「受け側」が同じ型を参照し、case 漏れ / デッドケースを TypeScript が検出する。

**外部仕様で値が固定されている場合のキー / 値の整合:** URL クエリ / DB カラム値など外部仕様で snake_case / lowercase 固定の値は **キーを UPPER_SNAKE_CASE、値を外部仕様のまま** にする（例: `TODO_STATUS.ACTIVE = "active"` / `API_ERROR.INVALID_REQUEST = "invalid_request"`）。

**付随情報を持つ enum（object-valued パターン）:** label / displayName / sortOrder 等の付随情報を持たせる場合は、値をオブジェクト `{ value, label, ... }` で定義し、**単一の型 `EnumName` = エントリ型** を export する（`*Entry` のような派生型は作らない）：

```typescript
export const TODO_PRIORITY = {
  HIGH: { value: "high", label: "高" },
  MEDIUM: { value: "medium", label: "中" },
  LOW: { value: "low", label: "低" },
} as const;
export type TodoPriority = (typeof TODO_PRIORITY)[keyof typeof TODO_PRIORITY];
```

- **wire 値（DB / DTO / URL クエリ）は `EnumName["value"]`** で参照する（別名型 `*Value` は作らない）
- **表示ラベルは `EnumName.MEMBER.label` を直接参照** する。`*_LABEL` テーブルを別途作らない
- **DTO は wire 値、ViewModel はエントリ** で表現を分け、Service 層の変換関数で `EnumUtils.getEnum(ENUM, wire, "value")` を使って解決する（境界の責務分離）

**enum 値の列挙には `Object.values(ENUM)` を使う:** `[ENUM.A, ENUM.B, ENUM.C]` のような手動列挙はメンバー追加時に同期漏れを起こす（DRY 違反）。順序固定が必要な場合は `as const` 定義の宣言順がそのまま `Object.values` の順序になるため、enum 定義側で順序を制御する。

## JSDoc

- 全 public 関数・クラス・プロパティ・型に JSDoc 必須（ESLint で強制）
- 日本語でコメントを記述する
- `@param`, `@returns` タグを使用する
- **書くべきもの**: 関数の目的（一行サマリ） / `@param` / `@returns` / `@throws` / 副作用や重要な制約
  - 集約・優先順位などの非自明な規則を持つ関数は、規則を「どの入力にどの出力を返すか」の形で書き、入力と出力の具体例を `@example` に 1 つ書く。文章・表・例で同じ規則を重ねて書かない。コメントの主張は無条件に成り立つ文だけにする（条件付きでしか正しくない言い換えを書かない）
- **書かないもの**: 処理フロー（`1. ... 2. ...` の手順） / 実装詳細（「平文 TEXT で保存」等） / 他関数への遷移説明 / well-named な識別子で自明な内容 / 呼び出し元の事情（次項）
  - 理由: コードを読めば分かる情報はリファクタで陳腐化し、JSDoc とコードの乖離を生む
  - 例外: 外部仕様（プロトコル / 規格）への準拠や非自明な設計判断は書く価値がある。業務判断を表す定数（閾値・時間予算・分割数等）は根拠（なぜその値か）を JSDoc に書く

### JSDoc は「契約」を書き、「呼び出し元の事情」を書かない

JSDoc はその関数・型が **利用側に約束する契約**（何をするか / 引数と戻り値の意味 / 事前条件 / 事後条件・副作用 / 例外）だけを説明する。**誰から・どの流れで呼ばれるか** は書かない（Clean Code の「Nonlocal Information」、A Philosophy of Software Design の interface comment の原則）。

✗ 悪い例:

```typescript
/** 複数行の商品価格を外部サービスへ反映する（CSV 取込の後段で使用） */
/** @param adRatePatch - 広告費率パッチ（1 件確定・CSV 取込の双方から渡される） */
/** 変更分を返す（フロントが REVISE_XXX で反映後に保存する） */
```

○ 良い例:

```typescript
/** 複数行の商品価格を外部サービスへ反映する。行ごとに独立して処理し、1 行の失敗は他の行に影響しない */
/** @param adRatePatch - 広告費率の確定結果（{@link reviseListingAdRate} の戻り値）。undefined なら広告費率は更新しない */
/** 現在値と異なる項目のみを返す（DB には保存しない） */
```

- 理由: 呼び出し元の情報はその関数の外にあり、呼び出し元が増減・変更されてもこの JSDoc は更新されず嘘になる。下位レイヤー（Repository 等）が上位（Service 等）の都合を説明すると、ドキュメント上で上向きの依存が生まれ、関数の汎用性が説明文で損なわれる（情報隠蔽）
- **利用側が守るべき前提は「呼び出し元の事情」ではなく「契約」なので書く**: 「トランザクション内で呼ぶこと」「事前に X を呼んで取得した値を渡すこと」「順序依存があり並列に呼ばないこと」「戻り値の index は入力配列の index に対応する」等
- **使い方を示したいときは `@example`**（呼び出し元の固有名ではなく自己完結した例）、**関連する関数を示したいときは `@see` / `{@link}`** を使う
- 複数の経路にまたがる処理の流れ（「取込 → 反映 → 保存」等）は関数の JSDoc ではなく設計ドキュメント（ステアリングの design.html / 永続の functional-design.md）に書く

## 文言の言語

ユーザー・開発者の目に触れる文言は **日本語で記述する**：

- JSDoc コメント
- `throw new Error("...")` のエラーメッセージ
- ログ出力（`console.log` / `console.error` / CloudWatch logger 等）
- UI 表示テキスト

例外: 標準的な技術用語・固有名詞（HTTP / SQL / クラス名・ライブラリ名等）はそのまま英語で可。

✗ 悪い例:

```typescript
throw new Error(`User not found: ${userId}`);
throw new Error("Forbidden: admin role required");
throw new Error("useAuth must be used within AuthProvider");
```

○ 良い例:

```typescript
throw new Error(`ユーザーが見つかりません: ${userId}`);
throw new Error("管理者権限が必要です");
throw new Error("useAuth は AuthProvider 内で使用してください");
```

## 関数の書き方

フロントエンド・バックエンドともに、Service / Repository はモジュールレベル関数（アロー関数の名前付きエクスポート）で統一する：

```typescript
/**
 * Todo を作成する
 * @param content - Todo の内容
 * @returns 作成結果
 */
export const createTodo = async (content: string | null) => {
  return await createApiTodo(content);
};
```

### 引数の型は関数が参照する項目に絞る

関数が引数オブジェクトの一部の項目しか参照しない場合は、引数の型を `Pick<...>` 等でその項目に絞る。広い型（upsert 入力全体など）を受け取ると、比較・判定の対象範囲が宣言から読めず、呼出側が型に含まれる別の項目を使い始めたときに判定漏れが起きても型エラーにならない（架構原則 #6 驚き最小の原則）。

```typescript
// ✗ upsert 入力全体を受け取るが、比べるのは実績の項目だけ（見積を書き始めると黙って取りこぼす）
const isWriteUnchanged = (input: ShipmentUpsertInput, existing: Shipment) => ...
// ○ 比べる項目だけを型に出す
const isWriteUnchanged = (
  input: Pick<ShipmentUpsertInput, "actualShippingJpy" | "actualShippingSource">,
  existing: Shipment,
) => ...
```

### 業務パラメータを Repository にハードコードしない

取得件数（Top5 の「5」等）・閾値・対象集合（処理対象サイトの一覧等）のような **業務上のパラメータは Repository 関数にハードコードせず、引数で受け取る**。値をいくつにするか・どの集合を対象にするかは呼出側の Service が決める（Repository はデータアクセスの汎用性を保つ）。業務判断を表す定数も Repository ではなく、その判断を担う Service 側に定義する。

```typescript
// ✗ listProfitTop5 = (userId) => ...（件数 5 が関数名と実装に固定）
// ○ listProfitTopN = (userId, limit: number) => ...（件数は呼出側 Service が渡す）
```

### 単一取得関数の未取得時の戻り値

`get*` / `find*` 系の **単一取得関数** は、対象レコードが存在しない場合に以下のいずれかで返す:

- **`null`** を返す（Repository / Service 共通の標準パターン）
- **`throw new Error(...)`** で業務エラーを表明する（Service 層で「存在することが業務上の前提」の場合）

**空オブジェクト・空 DTO（全フィールド null）を返さない**。

理由: 架構原則 #6 驚き最小の原則。「未作成」と「全フィールド null（明示的に未設定）」の区別が呼出側で付かなくなる。

✗ 悪い例:

```typescript
const EMPTY_USER_SETTING_DTO: UserSettingDto = {
  consumptionTaxRefundRate: null,
  shippingFlatRate: null,
};
export const getUserSetting = async (
  userId: string,
): Promise<UserSettingDto> => {
  const record = await getUserSettingRecord(userId);
  return record ? toUserSettingDto(record) : EMPTY_USER_SETTING_DTO;
};
```

○ 良い例:

```typescript
export const getUserSetting = async (
  userId: string,
): Promise<UserSettingDto | null> => {
  const record = await getUserSettingRecord(userId);
  return record ? toUserSettingDto(record) : null;
};
```

フロント側で「未設定状態の初期値」が必要な場合は、Hook / Component 層で `?? DEFAULT_VALUES` のように吸収する（境界の責務分離）。

### 部分更新の patch 構築は `!== undefined` 判定で統一する

部分更新（patch）オブジェクトへフィールドをコピーする条件は `input.field !== undefined` で判定する。`Object.prototype.hasOwnProperty.call(...)` による「キー存在」判定は「キー無し / `null` / `undefined` 明示」の 3 状態を区別する定石だが、`undefined` を明示送信するユースケースが無い API では過剰（KISS）。`null` 明示はコピーされ「未設定へのリセット」として機能する。

### 契約上あり得ないケースに見せかけの既定値で蓋をしない

配列の再マップ・逆引きなどで「契約上は必ず見つかる」値が見つからない場合、`?? 0` / `?? ""` のような既定値で処理を続けず、データ整合性エラーとして throw する。見せかけの値で続行すると、不整合が別の箇所の誤った結果として現れ原因を追えなくなる（架構原則 #6 驚き最小の原則）。

## React Hook の書き方

```typescript
/**
 * Todo 一覧を監視する Hook
 * @returns todos - Todo 一覧
 */
export const useTodos = () => {
  const [todos, setTodos] = useState<Todo[]>([]);

  useEffect(() => {
    const sub = observeTodos((items) => setTodos(items));
    return () => sub.unsubscribe();
  }, []);

  return { todos };
};
```

- Hook 名は `use<Feature>` または `use<Action><Feature>`
- 状態と操作関数をオブジェクトで返す

## React Component の書き方

- **`useEffect` の依存配列を正しく保つ**: 不足（stale な値の参照）・過剰（毎回実行）・オブジェクトリテラル依存（毎レンダー再実行）を避ける
- **メモ化は再レンダリング抑止に効く場合のみ**: `useMemo` / `useCallback` はメモ化された子に渡す値・コールバックに使う。効果のないメモ化は可読性を下げるだけなので書かない
- **並び替え・削除のあるリストの `key` に index を使わない**
- **非同期処理中はローディング表示と連打防止**: 処理中フラグでボタンを disabled にし、失敗はユーザーに見える形で伝える

## YAGNI / デッドコード禁止

- **本タスク内に利用箇所が無いコードを実装しない**（架構原則 #3 YAGNI の具体化）
- **「将来必要」だけを根拠に先行実装しない** — ステアリングドキュメント（requirements.html / design.html）で「task-XX で利用予定」と記載されていても、本タスクで利用箇所が無ければ実装しない。利用するタスクで実装する
- **別タスク用の変更を本タスクに混ぜない（scope creep 禁止）** — OAuth scope 追加・設定値変更など「後続タスクで使う」変更は、利用するタスクの PR で行う
- **`as const` 定数のユニオン型導出も参照が生じてから書く** — `export type Xxx = (typeof XXX)[keyof typeof XXX]` の型導出行は、型として参照する箇所が無ければ追加しない（値側のみ利用の enum に型導出を機械的に付けない）
- **デッドコードを残さない** — 機能削除・設計変更で使われなくなった関数 / 型 / ファイル / import は同じ PR 内で削除する。コメントアウトで残さない（履歴は git で追える）
- **関数の戻り値型は実際に return する値の union のみ書く** — ライブラリ側の prop 型をそのままコピーしない。型に「将来返すかも」の値を含めない
  - ✗ 悪い例: 関数が `"default" | "secondary" | "destructive"` しか返さないのに、`Badge` の variant prop 型 `"default" | "secondary" | "destructive" | "outline"` をそのまま戻り値型にする
  - ○ 良い例: 実装が返す union のみを宣言。代入互換性は呼び出し側で保証される
- **switch / case の網羅性を保つ** — 発行側で出ない case を残さない（**デッドケース**）。発行側で出る値が case に無い（default 落ち）状態にしない
  - 発行側と受け側で同じ enum を参照すれば、新規追加時の漏れを TypeScript が検出できる（後述「ドメイン定数」§フロント・バック共通の文字列値）
- **空オブジェクト / 空文字 / undefined 等への分岐は実際に到達するパスのみ書く** — 「念のため」で複数パターンを残さない（例: AppSync `AWSJSON` 引数は Lambda には **parse 済みオブジェクト** として届くため、Handler 側で文字列 parse 分岐を書く必要は無い）

## DRY: 共通化 / インライン化のトリガー

**「2 箇所重複したら共通化、1 箇所利用ならインライン化」** を基準に判断する（架構原則 #1 DRY と #3 YAGNI のバランス）。

### 共通化（2 箇所以上で同じロジック）

- **同一責務のロジックが 2 箇所以上に登場した時点で関数化** し、適切なレイヤー（`services/` / `utils/`）に置く
- 配置先判断: フロント・バック共有なら `shared/utils/` または `shared/services/`、Lambda 内のみなら `amplify/functions/common/services/`
- 「将来 3 箇所目が来るかも」だけを根拠に **先行抽出しない**（YAGNI）
- **配列の汎用処理（groupBy / keyBy / chunk / uniq / sumBy 等）は `shared/utils/array-utils.ts` の自前ユーティリティを使い、lodash は使わない**（lodash は `isEqual` のみ）。無い関数はそこに足す（ファイルが無ければ作成する。まとめる系は `Map` を返す）

例: 2 つの Lambda Handler に同じ「AppSync identity から sub を取り出す」ロジックが現れた時点で、共通 Service（`amplify/functions/common/services/auth-context-service.ts` 等）に `getUserIdFromIdentity` として集約する

### インライン化（1 箇所利用の private 関数）

- private 関数（非 export）が **1 箇所からのみ呼ばれる** + **抽象化に意図的な命名価値が薄い** + **5〜10 行程度** なら **インライン化** を優先する
- 「関数化することで意図が明確になる」場合は維持してよい（例: OAuth プロトコル固有の `exchangeCodeForToken` は維持、集約・優先順位などの非自明な規則を持つループは抽出して規則を JSDoc に書く、URL 文字列組立の `buildAuthorizationUrl` は削除）。抽出する際、次の工程のためだけに存在する変換（集約結果の再グルーピング等）は同じ関数に含め、中間構造を呼出側に見せない

判断基準: 関数名を見ずにインライン展開した方が読みやすい / コードが短くなるなら、抽出する価値が無い。

### 2 つの定義の整合は「型で守る」より「定義元を 1 つに減らす」

対応表と対象一覧のように **乖離しうる 2 つの定義** がある場合、整合を検証するための型・チェックを追加するのではなく、**片方を Single Source of Truth とし、他方を `Object.keys(...)` 等で導出する**。定義元が 1 つになれば乖離は構造的に起こりえず、整合を守るための型自体が不要になる。

## 外部 API 連携の型分離

外部 API（決済 / 認証 / 為替 等）と連携する場合の責務分離:

- **Repository が外部 API の生レスポンスをそのまま返す**（変換しない、データソースとの境界）
- **Service が生レスポンスを受け取り、ドメイン型へ変換**する

型の配置:

- **生レスポンス型**（命名は `*RawResponse` を推奨）: 外部 API が返す JSON 構造をそのまま型化。snake_case / nullable / ネスト構造を反映。`models/` 配下に配置し export する
- **ドメイン型**（`*Info` / `*Dto` 等）: Service が変換した整形済みの型。camelCase / 必須フィールドの正規化済み。`models/` 配下に配置し export する

例: `repositories/<vendor>-api-repository.ts:get<Vendor>User` が `<Vendor>IdentityRawResponse` を返し、Service が必要に応じてドメイン型に変換する

## UI 表示用語の統一

ユーザーの目に触れる文字列は表記揺れを起こさないようにすること。

## 型チェックの検証スコープ

root の `tsconfig.json` は `amplify` を `exclude` しているため、**`npx tsc --noEmit` だけでは amplify/ 配下（Handler / Service / Repository）は型チェックされない**（vitest も esbuild 変換のため型エラーを拾わない）。変更完了の報告前に、変更範囲に応じて以下の両方を実行する：

```bash
npx tsc --noEmit                            # src/ + shared/ + scripts/
npx tsc --noEmit -p amplify/tsconfig.json   # amplify/ 配下
```

## 識別子リネーム時の注意（フォーマッタによる import 削除）

本リポジトリは PostToolUse フックで prettier / eslint（unused-imports 相当）が **ファイル保存ごとに** 走る。リネーム中に「import 名は新名・使用箇所は旧名」の瞬間があると、新名の import が「未使用」と判定され **import 行ごと削除される**（結果 `Cannot find name 'X'` で tsc が落ちる）。

- リネームは **使用箇所を先に、import を後に** 変更する。または同一の置換内に import と使用箇所を含めて原子的に変更する
- リネーム後は §型チェックの検証スコープ の両 tsc で検証し、消えた import があれば復元する

## 依存パッケージの管理

- **未使用パッケージを `package.json` に残さない** — task でライブラリ採用を見送った場合（例: `Authenticator` を廃止して自前フォーム採用、`zod` 不採用 等）は、同じ PR で `dependencies` / `devDependencies` から削除する
- **追加時は本当に必要か確認** — shadcn 等の generator が peer に追加した依存も、実際に import されていなければ削除候補。`grep -rn "from \"<パッケージ名>\"" src amplify` で利用箇所の有無を確認する
- **deps と devDeps の重複定義を避ける** — `@types/*` 系は devDependencies に統一（dependencies 側に重複させない）
- **ピア依存は明示的に保持** — 他パッケージ内部で利用される peer 依存は、直接 import が無くても package.json に明記しておく
- **CSS 経由の利用を見落とさない** — `tw-animate-css` のように `globals.css` の `@import` でのみ使われるパッケージは「ソースコード grep ではヒットしないが必須」。CSS / 設定ファイルも検索範囲に含める
