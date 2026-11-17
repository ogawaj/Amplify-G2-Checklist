"use client";

import { Authenticator } from "@aws-amplify/ui-react";
import { Amplify } from "aws-amplify";

import outputs from "@/amplify_outputs.json";

Amplify.configure(outputs);

/**
 * Amplify 設定・認証状態プロバイダー
 * @param props - プロパティ
 * @returns 認証状態を子コンポーネントへ提供するプロバイダー
 */
export function AmplifyProvider(props: {
  /** 子コンポーネント */
  children: React.ReactNode;
}) {
  return <Authenticator.Provider>{props.children}</Authenticator.Provider>;
}
