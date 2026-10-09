# DB コーディング規約（Amplify Data + DynamoDB）

本ファイルは本プロジェクトが採用する**Amplify Data（AppSync）+ DynamoDB**に紐づくコーディング規約を定める。汎用的なコーディング規約は`coding-standards.md`を参照。他データストア（RDS / DocumentDB等）を採用するプロジェクトでは本ファイルを差し替えて運用する。アーキテクチャ規約（型の参照範囲 / Repositoryの境界）は`architecture-db.md`を参照。

## モデル名とテーブル名

- **モデル名は単数形のPascalCase**で定義する（例: `Image`、`UserSetting`）
- DynamoDBのテーブル名はAmplifyが`<モデル名>-<API ID>-<環境>`の形で自動生成するため、アプリ層から参照しない
- アプリ層（Service / Repository / Hook）の命名はモデル名（単数）に揃える。汎用規則は`coding-standards.md`§データモデルと派生命名の単複形を参照

## 型付きクライアント優先・生のGraphQLは最後の手段

- **`client.models.<Model>.get` / `list` / `create` / `update` / `delete`で表現できる操作に生のGraphQL（`client.graphql`）を書かない**。戻り値の型がスキーマから自動で付き、選択フィールドとの食い違いが起きないため
- 生のGraphQLは、型付きクライアントが対応していない機能に限る（例: 更新・削除の`condition`引数。型付きクライアントの`update`は`condition`を受け付けない）
- 生のGraphQLを書く場合は、`client.graphql<GraphQLQuery<{ updateImage: Image }>>(...)`のように型引数で応答を型付けし、`as`で迂回しない。**選択フィールドは型引数に指定したモデル型のフィールドと一致させる**（不足すると型の上では存在するフィールドが実行時に`undefined`になる）

## エラーの扱い

Repositoryは**AppSync（データクライアント）のエラーを加工せずに投げる**。メッセージの組み立てや`Error`での包み直しはしない。元のエラー種別やパスがそのままログに残り、調査しやすいため。利用者向けの文言は画面側が固定で持つ。

- **型付きクライアントはGraphQLのエラーを例外にせず`{ data, errors }`で返す**（キャンセル等の`errors`を持たない失敗は投げる） — `errors`を無視すると失敗が黙って`data: null`として扱われるため、`if (errors) throw errors;`で投げる
- **`client.graphql`は応答に`errors`があれば必ずthrowする** — catchしない。catchが必要な場合（次項）も、対象外のエラーは`throw e;`でそのまま投げ直す
- **条件付き書き込みの不成立は例外にしない** — `errors`がすべてエラー種別`DynamoDB:ConditionalCheckFailedException`のときは`null`等の汎用的な戻り値で返し、業務上の意味（競合・上限到達等）はServiceが決める。対象アイテムが存在しない場合も、Amplifyの更新・削除リゾルバが付ける存在条件により同じ扱いになる
- **AppSyncで投げられる値は`Error`ではない** — エラーの配列や`{ data, errors }`の素のオブジェクトで、配列やオブジェクト自体にスタックトレースはない（Storageの失敗は`Error`のサブクラスを投げる）。呼出側は`unknown`として受け取り、`instanceof Error`で判定しない。JSDocの`@throws`には実際に投げる値の型を書く

## null / undefined の挙動

- **`update`の入力で省略した（`undefined`の）フィールドは更新されない**。`null`を渡すと値を消す（任意フィールドのみ）。クリアする意図の`null`を`?? undefined`で潰さない
- 必須フィールド（`.required()`）に`null`は渡せない。`create`の任意フィールドは省略すれば未設定になるため、`?? null`は不要

## クエリの効率

- **キーで取れるものは`get`で取る** — `get`は主キー指定の単一取得（GetItem）で、条件に関係なくコストが一定
- **`list`の`filter`はテーブル全体の走査（Scan）になる** — 絞り込みは読み取った後に適用されるため、件数に比例してコストと時間がかかる。主キー以外の項目で検索する必要が生じたら、スキーマに`secondaryIndexes`を定義してインデックスで取得する
- **`list`は1回で全件を返さない** — `nextToken`で続きを取得する。1ページ目だけで全件とみなさない
- **必要なフィールドだけ取る** — 型付きクライアントでは`selectionSet`、生のGraphQLでは選択フィールドで、使わないフィールドを取得しない
- **1件ずつのループ呼び出しを避ける** — 型付きクライアントには一括取得・一括書き込みがないため、件数が多い処理はカスタムクエリ / mutationでサーバー側にまとめることを検討する
- **読み取りは結果整合性を前提にする** — 書き込み直後の読み取りに最新値が返る保証はない。厳密な整合が要件にある更新だけ、読んだ値を条件にした条件付き書き込みで行う（`architecture-db.md` §Repositoryの境界）
