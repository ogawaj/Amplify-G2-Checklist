/**
 * sandbox 環境変数ファイルの準備スクリプト
 *
 * 各 env-variable-sandbox.ts は .gitignore で管理外のため、リポジトリには
 * env-variable-sandbox.example.ts のみ含まれる。
 * このスクリプトは postinstall で実行され、sandbox.ts が存在しない環境
 * （CI 初回 npm ci / 開発者の初回 npm install）で example.ts からコピーする。
 *
 * 既存の sandbox.ts は上書きしないため、開発者がローカルで編集した内容は保持される。
 */
const fs = require("node:fs");
const path = require("node:path");

const projectRoot = path.resolve(__dirname, "..");

const targets = [
  "src/app/enums/env-variable-sandbox",
  "amplify/common/enums/env-variable-sandbox",
];

for (const target of targets) {
  const sandboxFile = path.join(projectRoot, `${target}.ts`);
  const exampleFile = path.join(projectRoot, `${target}.example.ts`);

  if (fs.existsSync(sandboxFile)) {
    continue;
  }
  if (!fs.existsSync(exampleFile)) {
    console.warn(
      `[prepare-sandbox] example が存在しないためスキップ: ${target}.example.ts`,
    );
    continue;
  }
  fs.copyFileSync(exampleFile, sandboxFile);
  console.log(`[prepare-sandbox] 作成: ${target}.ts (from .example)`);
}
