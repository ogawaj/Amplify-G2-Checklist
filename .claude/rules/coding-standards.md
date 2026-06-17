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

**引数名も同様に呼出元コンテキストに依存させない** — Repository / Service の引数名は呼び出し元のローカル変数名（`fetchedIds` 等）に引っ張られず、「保持する ID 集合」など Repository としての汎用的な意味で命名する（例: `deleteEbayCategoriesNotIn(prisma, fetchedIds)` ✗ → `deleteEbayCategoriesNotIn(prisma, categoryIds)` ○）。

## エクスポート

- **名前付きエクスポートのみ**使用する。default export は使わない（Next.js の page.tsx / layout.tsx を除く）
- barrel ファイル（`index.ts`）は使わない。直接パスで import する

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
- **書かないもの**: 処理フロー（`1. ... 2. ...` の手順） / 実装詳細（「平文 TEXT で保存」等） / 他関数への遷移説明 / well-named な識別子で自明な内容
  - 理由: コードを読めば分かる情報はリファクタで陳腐化し、JSDoc とコードの乖離を生む
  - 例外: 外部仕様（プロトコル / 規格）への準拠や非自明な設計判断は書く価値がある

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

## YAGNI / デッドコード禁止

- **本タスク内に利用箇所が無いコードを実装しない**（架構原則 #3 YAGNI の具体化）
- **「将来必要」だけを根拠に先行実装しない** — ステアリングドキュメント（requirements.md / design.md）で「task-XX で利用予定」と記載されていても、本タスクで利用箇所が無ければ実装しない。利用するタスクで実装する
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

例: 2 つの Lambda Handler に同じ「AppSync identity から sub を取り出す」ロジックが現れた時点で、共通 Service（`amplify/functions/common/services/auth-context-service.ts` 等）に `getUserIdFromIdentity` として集約する

### インライン化（1 箇所利用の private 関数）

- private 関数（非 export）が **1 箇所からのみ呼ばれる** + **抽象化に意図的な命名価値が薄い** + **5〜10 行程度** なら **インライン化** を優先する
- 「関数化することで意図が明確になる」場合は維持してよい（例: OAuth プロトコル固有の `exchangeCodeForToken` は維持、URL 文字列組立の `buildAuthorizationUrl` は削除）

判断基準: 関数名を見ずにインライン展開した方が読みやすい / コードが短くなるなら、抽出する価値が無い。

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

## 依存パッケージの管理

- **未使用パッケージを `package.json` に残さない** — task でライブラリ採用を見送った場合（例: `Authenticator` を廃止して自前フォーム採用、`zod` 不採用 等）は、同じ PR で `dependencies` / `devDependencies` から削除する
- **追加時は本当に必要か確認** — shadcn 等の generator が peer に追加した依存も、実際に import されていなければ削除候補。`grep -rn "from \"<パッケージ名>\"" src amplify` で利用箇所の有無を確認する
- **deps と devDeps の重複定義を避ける** — `@types/*` 系は devDependencies に統一（dependencies 側に重複させない）
- **ピア依存は明示的に保持** — 他パッケージ内部で利用される peer 依存は、直接 import が無くても package.json に明記しておく
- **CSS 経由の利用を見落とさない** — `tw-animate-css` のように `globals.css` の `@import` でのみ使われるパッケージは「ソースコード grep ではヒットしないが必須」。CSS / 設定ファイルも検索範囲に含める
