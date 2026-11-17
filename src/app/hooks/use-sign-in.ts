"use client";

import { useState } from "react";

import { AUTH_NEXT_STEP } from "@/src/app/enums/auth-next-step";
import { useAuthAction } from "@/src/app/hooks/use-auth-action";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import { signIn } from "@/src/app/services/auth-service";

/**
 * サインインフォームの状態と送信を管理するフック
 * @returns フォーム値・更新関数・送信関数・実行状態
 */
export const useSignIn = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { isPending, errorMessage, run } = useAuthAction();

  const submit = async () => {
    await run(async () => {
      const nextStep = await signIn(email, password);
      if (nextStep === AUTH_NEXT_STEP.CONFIRM_SIGN_UP) {
        throw new UserFacingError(
          "メールアドレスの確認が完了していません。サインアップ画面で確認コードを入力してください",
        );
      }
    });
  };

  return {
    email,
    password,
    setEmail,
    setPassword,
    submit,
    isPending,
    errorMessage,
  };
};
