# ブラウザ自動化（Claude in Chrome MCP）運用ルール

UI 動作確認・デザインチェック・E2E 的操作で Claude in Chrome MCP を使う際の制約・知見を集約する。`/crg-design-check` 等の個別スキルからも本ファイルを参照する。

## ToolSearch によるロード

Chrome MCP ツール（`mcp__claude-in-chrome__*`）はすべて deferred。使う前に ToolSearch の `select:` で必要なツール名を列挙してロードする。

## 認証画面

Cognito 等の認証必須画面で未ログインの場合は、ログイン操作をユーザーに代行依頼する（確認コード受信が Claude 側で不可）。認証情報（パスワード・トークン等）を Claude 側で取り扱わない。

## 既知の制約・落とし穴

### `window.fetch` フックは Amplify Data Client に効かない

`aws-amplify/data` の `generateClient` は独自経路で AppSync を呼ぶため、`javascript_tool` で `window.fetch` を上書きしてもキャプチャできない。レスポンス debug は対象 Repository に一時的な `console.log` を入れて `read_console_messages` で取得する。

### Radix UI Dialog 等は自動操作で閉じづらい

Focus Trap と React 合成イベントの関係で、`element.click()` や `dispatchEvent(KeyboardEvent('Escape'))` のプログラマティック発火が意図通り動かないことがある。Dialog の「開く + 中身検証」までを自動化し、「閉じる」検証はユーザー手動操作に委ねる。

### `tabId` は session 途中で無効化されることがある

「Tab xxx no longer exists」エラー時は `tabs_context_mcp` で再取得 → 必要なら `tabs_create_mcp` で新規作成 → 再ナビゲートする。

### console / network 監視は初回呼び出し以降のみ

`read_console_messages` / `read_network_requests` は初回呼び出し時点以降の記録のみ返す。タブ準備直後に空読みして監視を有効化してから本作業に進む。

### ブラウザ標準モーダル（alert / confirm / prompt）を避ける

これらが開くと Chrome 拡張が応答不能になり、以後のツール呼び出しが失敗する。やむを得ない場合はユーザーに警告してから実施する。

## スクリーンショット / GIF の保存先

| 状況               | 保存先                                                    |
| ------------------ | --------------------------------------------------------- |
| ステアリング特定可 | `doc/steering/<タスクサブディレクトリ>/artifacts/`        |
| ステアリングなし   | `.tmp/design-check/`（`.gitignore` 対象であることを確認） |
