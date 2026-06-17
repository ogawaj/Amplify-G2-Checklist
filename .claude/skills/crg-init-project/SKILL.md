---
description: テンプレートから新規プロジェクトを初期化する。git clone 直後に実行し、プロジェクト名・Lambda プレフィックスの設定、不要ファイルの削除、git リポジトリの再初期化を行う。
disable-model-invocation: true
model: opus
effort: max
---

# プロジェクト初期化

テンプレート（Amplify-G2-Template）を git clone した直後に実行し、新規プロジェクトとして初期化します。

## 手順

以下の手順を **厳密に** 順番通り実行してください。

### Step 0: ヒアリング

ユーザーに以下を質問し、**すべての回答を得てから** 次に進む：

1. **システム名**（例：`MyApp`）— ディレクトリ名 `Amplify-G2-Xxxxx` の `Xxxxx` 部分、`package.json` の `name`、`backend.ts` の `PROJECT_NAME` に使用
2. **Lambda 関数プレフィックス**（例：`ma`）— Lambda ディレクトリ名・関数名のプレフィックス `g2t` を置き換える。kebab-case の短い文字列を推奨

### Step 1: git リポジトリの再初期化

テンプレートの git 履歴を削除し、新規リポジトリとして初期化する。

**このステップは Claude では実行せず、ユーザーに依頼する（`rm -rf` は Claude の実行ポリシー上、実行できないため）。** 以下のコマンドを提示し、ユーザーが実行完了を返答するまで次のステップへ進まない。

```bash
rm -rf .git
git init
```

### Step 2: 不要ファイルの削除

テンプレートのドキュメントを削除する。ディレクトリ構造（空ディレクトリ）は残す。

**このステップは Claude では実行せず、ユーザーに依頼する（`rm -rf` は Claude の実行ポリシー上、実行できないため）。** 以下のコマンドを提示し、ユーザーが実行完了を返答するまで次のステップへ進まない。

```bash
rm -f doc/idea/*
rm -f doc/persistent/*
rm -rf doc/steering/*
```

### Step 3: package.json の更新

`package.json` の `name` フィールドを新しいプロジェクト名に変更する。

- `amplify-g2-template` → `amplify-g2-<システム名（kebab-case）>`

### Step 4: backend.ts の更新

`amplify/backend.ts` の `PROJECT_NAME` 定数を新しいプロジェクト名に変更する。

- `"Amplify-G2-Template"` → `"Amplify-G2-<システム名>"`

### Step 5: Lambda 関数プレフィックスの変更

Lambda 関数のプレフィックスを `g2t` から新しいプレフィックスに一括変更する。以下のすべてを対応すること。

#### 5-1: ディレクトリ名の変更

`amplify/functions/` 配下の Lambda ディレクトリ名を `git mv` で変更する。

- `g2t-say-hello` → `<プレフィックス>-say-hello`
- `g2t-aggregate-access` → `<プレフィックス>-aggregate-access`

#### 5-2: resource.ts の更新

各 Lambda の `resource.ts` 内の関数名を変更する。

- `defineFunction` の `name` プロパティ（例：`"g2t-say-hello"` → `"<プレフィックス>-say-hello"`）
- export する変数名（例：`g2tSayHello` → `<プレフィックス(camelCase)>SayHello`）

#### 5-3: handler.ts / index.ts の更新

- `$amplify/env/g2t-*` のインポートパスを新しいプレフィックスに変更する

#### 5-4: amplify/data/resource.ts の更新

- import 文のパスとインポート名を変更
- GraphQL クエリ名（`g2tSayHello` → `<プレフィックス(camelCase)>SayHello` など）を変更
- `.authorization` 内の関数参照も変更

#### 5-5: amplify/backend.ts の更新

- import 文のパスとインポート名を変更
- `defineBackend` のオブジェクトキーを変更
- `lambdas` 配列の参照を変更

### Step 6: フロントエンドの参照更新

フロントエンド側で `g2t` プレフィックスを参照しているファイルがあれば、新しいプレフィックスに変更する。Grep で `g2t` を検索し、該当箇所をすべて更新すること。

### Step 7: 動作確認

初期化した内容が正しく動作するか確認する。ユーザーに以下のコマンドの実行を案内する：

```bash
npm run sandbox --profile=<プロファイル名>
npm run dev
```

動作確認が完了したら、初期コミットを行う。

### Step 8: 完了報告

初期化が完了したら、以下を案内する：

1. 実施した変更の一覧
2. `doc/idea/` にアイデアファイルを事前に配置しておく必要があること
3. 次のステップとして `/crg-create-persistent` で永続的ドキュメントを作成すること
4. **ディレクトリ名の変更**：以下のコマンドを手動で実行してルートディレクトリ名を変更すること

```bash
cd .. && mv Amplify-G2-Template Amplify-G2-<システム名> && cd Amplify-G2-<システム名>
```

## ルール

- ディレクトリの移動・リネームには必ず `git mv` を使用する（Step 1 で git init した後に実施するため、Step 5 のディレクトリ変更時に適用）
- Lambda プレフィックスの camelCase 変換は kebab-case から自動導出する（例：`ma` → `ma`、`my-app` → `myApp`）
- 変更後にファイル間の参照に矛盾がないか確認する
