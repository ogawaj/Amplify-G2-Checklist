"use client";

import "@aws-amplify/ui-react/styles.css";

import { Authenticator, translations } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";
import { I18n } from "aws-amplify/utils";

import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);
I18n.putVocabularies(translations);
I18n.putVocabularies({
  ja: {
    "Your passwords must match": "パスワードが一致しません",
    "Password must have at least 8 characters":
      "パスワードは8文字以上で入力してください",
    "Password must have lower case letters":
      "パスワードに小文字を含めてください",
    "Password must have upper case letters":
      "パスワードに大文字を含めてください",
    "Password must have numbers": "パスワードに数字を含めてください",
    "Password must have special characters":
      "パスワードに特殊文字を含めてください",
  },
});
I18n.setLanguage("ja");

/**
 * Amplify 設定・認証プロバイダー
 * @param root0 - プロパティ
 * @param root0.children - 子コンポーネント
 * @returns Authenticator でラップされた子コンポーネント
 */
export function AmplifyProvider({
  children,
}: {
  /** 子コンポーネント */
  children: React.ReactNode;
}) {
  return <Authenticator>{children}</Authenticator>;
}
