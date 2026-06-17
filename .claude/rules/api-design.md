---
paths:
  - "src/app/repositories/**"
  - "src/app/services/**"
  - "amplify/data/**"
  - "amplify/common/**"
  - "amplify/functions/**"
---

# API 設計規約

## GraphQL（AppSync）設計

Amplify Gen 2 では `amplify/data/resource.ts` で GraphQL スキーマを定義する。

### モデル命名

- **モデル名**: PascalCase の単数形（例: `Todo`, `DailyAccessSummary`）
- **フィールド名**: camelCase（例: `accessCount`, `createdAt`）
- **リレーション名**: camelCase で関連モデルを表す（例: `owner`, `comments`）

### GraphQL Enum 値

- **SCREAMING_SNAKE_CASE** を使用する（例: `ACTIVE`, `IN_PROGRESS`, `PENDING_APPROVAL`）

### Input / Output 型

- **Input 型**: `*Input` サフィックスを付ける（例: `CreateOrderInput`, `UpdateUserInput`）
- **Output 型**: ミューテーションの戻り値には `*Payload` サフィックスを付ける（例: `CreateOrderPayload`）

### カスタムクエリ・ミューテーション

- **クエリ名**: プレフィックス不要。リソース名で表現する（例: `report`, `activeUsers`）。`get` / `list` は付けない
- **ミューテーション名**: 動詞 + 名詞（例: `createOrder`, `aggregateAccess`）
- **引数**: 必要最小限にする。フィルタ条件が複雑な場合は Input 型を定義する

### 認可ルール

- **最小権限の原則**: デフォルトで拒否し、必要な操作のみ許可する
- **オーナーベースアクセス**: ユーザー固有データは `.authorization(allow => [allow.owner()])` を使用する
- **グループベースアクセス**: 管理者機能は `.authorization(allow => [allow.group('admin')])` を使用する
- **パブリックアクセスは最小限に**: 読み取り専用かつ機密性のないデータのみ

## REST API 設計（Lambda 関数）

Lambda で REST API を公開する場合の規約。

### URL 設計

- **リソース名は複数形の名詞**: `/api/v1/users`, `/api/v1/orders`
- **階層は最大 2 レベル**: `/api/v1/users/{userId}/orders` まで。3 階層以上はフラットにする
- **動詞を URL に含めない**: `POST /api/v1/orders`（○） / `POST /api/v1/createOrder`（×）
- **ケバブケースを使用**: `/api/v1/daily-summaries`（○） / `/api/v1/dailySummaries`（×）

### HTTP メソッドと冪等性

| メソッド | 用途     | 冪等性 | 備考                               |
| -------- | -------- | ------ | ---------------------------------- |
| GET      | 取得     | ○      | 副作用なし。クエリパラメータで検索 |
| POST     | 作成     | ×      | リクエストごとに新規リソース作成   |
| PUT      | 全置換   | ○      | 同じリクエストで同じ結果になる     |
| PATCH    | 部分更新 | ○      | 変更フィールドのみ送信             |
| DELETE   | 削除     | ○      | 存在しない場合も 204 を返す        |

### リクエスト・レスポンス

- **リクエストボディ**: camelCase の JSON
- **レスポンスボディ**: camelCase の JSON
- **日付形式**: ISO 8601（`2026-04-15T09:00:00Z`）
- **ページネーション**: `nextToken` パターン（Amplify 標準に合わせる）

### エラーレスポンス

統一されたエラー形式を使用する：

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "email",
        "message": "メールアドレスの形式が正しくありません"
      }
    ]
  }
}
```

### HTTP ステータスコード

| コード | 用途                                                 |
| ------ | ---------------------------------------------------- |
| 200    | 成功（GET / PUT / PATCH）                            |
| 201    | 作成成功（POST）                                     |
| 204    | 成功・レスポンスボディなし（DELETE）                 |
| 400    | バリデーションエラー                                 |
| 401    | 認証エラー（トークン未設定・期限切れ）               |
| 403    | 認可エラー（権限不足）                               |
| 404    | リソースが存在しない                                 |
| 409    | 競合（楽観的ロック失敗、重複作成）                   |
| 500    | サーバー内部エラー（クライアントに詳細を漏らさない） |

## 共通ルール

### バリデーション

- **入力バリデーションは API の境界で行う**: Handler / Repository の入口でバリデーションし、Service 内部では信頼する
- **フロントエンド**: React Hook Form + Zod でフォームバリデーション
- **バックエンド**: Handler でリクエストパラメータを検証してから Service に渡す

### 想定脅威モデルとバリデーション範囲

本プロジェクトはフロント UI 経由の認証済みユーザー操作を想定する。直接 API 呼出（curl / Postman / DevTools 経由）は想定外。

このため、フロント Repository の TypeScript 型シグネチャで保証される値（必須引数の存在 / 数値型 / 範囲）の **Service 層での再検証は YAGNI** とみなす。フロントで弾けるバリデーションはフロントに集約する。

例外（Service 層でも検証を残す）:

- 認証境界の検証（Cognito identity 構造等）
- 業務エラー（DB に既存レコードが見つからない等）
- フロントで弾けない値（外部 API レスポンス等）

### API 呼び出しの効率化

- **バッチ処理を活用する**: 複数リソースの操作はバッチ API で 1 回にまとめる
- **不要なフィールドを取得しない**: GraphQL の selection set で必要なフィールドのみ指定する
- **同一リソースへの連続更新を避ける**: 複数フィールドの更新は 1 回の API 呼び出しにまとめる
