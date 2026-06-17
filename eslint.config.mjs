import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import tailwindcss from "eslint-plugin-tailwindcss";
import unusedImports from "eslint-plugin-unused-imports";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  {
    ignores: [
      "node_modules/**",
      "amplify/node_modules/**",
      ".amplify/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "src/lib/shadcn/**/*.{ts,tsx,js,jsx}",
      "scripts/**",
    ],
  },
  // 既存の Next.js 推奨設定
  ...nextCoreWebVitals,
  ...nextTypescript,
  // eslint-plugin-jsdoc の推奨設定を追加
  jsdoc.configs["flat/recommended-typescript"],
  // eslint-plugin-tailwindcss の推奨設定を追加
  ...tailwindcss.configs["flat/recommended"].map((config) => ({
    ...config,
    settings: {
      ...config.settings,
      tailwindcss: {
        ...config.settings?.tailwindcss,
        config: `${__dirname}/src/app/globals.css`,
      },
    },
  })),
  {
    files: [
      "amplify/**/*.ts",
      "src/app/**/*.{ts,tsx,js,jsx}",
      "./eslint.config.mjs",
    ],
    plugins: {
      jsdoc,
      "simple-import-sort": simpleImportSort,
      "unused-imports": unusedImports,
    },
    // ここからカスタムルール
    rules: {
      // anyを禁止
      "@typescript-eslint/no-explicit-any": ["warn", { ignoreRestArgs: true }],
      // メンバーのアクセス修飾子を必須にする
      "@typescript-eslint/explicit-member-accessibility": "error",
      // await忘れを防止
      // "@typescript-eslint/no-floating-promises": "error",
      // Promise/await の誤用を防止（バグになりがちな使用方法を防ぐ）
      // "@typescript-eslint/no-misused-promises": "error",
      // importをファイル先頭に記述
      "import/first": "error",
      // 最後のimportの後に空行を追加
      "import/newline-after-import": "error",
      // 使用しないimportを削除
      "unused-imports/no-unused-imports": "error",
      // 最大行数を制限(デフォルトの500行)
      "max-lines": ["error", { max: 500 }],
      // 最大ネスト数を制限(デフォルトの深さ5)
      "max-depth": "error",
      // ===を推奨
      eqeqeq: ["error"],
      // import文をソート
      "simple-import-sort/imports": "error",
      // export文をソート
      "simple-import-sort/exports": "error",
      // 未使用のimportを禁止
      "unused-imports/no-unused-imports": "error",
      // 未使用の変数を禁止
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // JsDoc推奨ルールの上書き
      "jsdoc/require-jsdoc": [
        "error",
        {
          publicOnly: true,
          require: {
            ArrowFunctionExpression: true,
            ClassDeclaration: true,
            ClassExpression: true,
            FunctionDeclaration: true,
            FunctionExpression: true,
            MethodDefinition: true,
          },
          contexts: [
            "ArrowFunctionExpression",
            "ClassDeclaration",
            "ClassExpression",
            "FunctionDeclaration",
            "FunctionExpression",
            "MethodDefinition",
            "PropertyDefinition",
            // "VariableDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSPropertySignature",
            "TSMethodSignature",
          ],
        },
      ],
      "jsdoc/require-description": [
        "error",
        {
          contexts: [
            "ArrowFunctionExpression",
            "ClassDeclaration",
            "ClassExpression",
            "FunctionDeclaration",
            "FunctionExpression",
            "MethodDefinition",
            "PropertyDefinition",
            "VariableDeclaration",
            "TSInterfaceDeclaration",
            "TSTypeAliasDeclaration",
            "TSPropertySignature",
            "TSMethodSignature",
          ],
        },
      ],
      "jsdoc/check-param-names": ["error", { checkDestructured: false }],
      "jsdoc/require-param": ["error", { checkDestructured: false }],
    },
    settings: {
      tailwindcss: {
        config: `${__dirname}/src/app/globals.css`, // tailwind の設定ファイルパス
        // cn関数でのtailwindCSS ESLintサポートを有効化
        callees: ["cn", "clsx", "classnames", "twMerge"],
        classRegex: "^(class(Name)|tw)$", // className属性やtw属性をチェック
      },
    },
  },
];

export default eslintConfig;
