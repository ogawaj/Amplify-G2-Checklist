"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_PATH } from "@/src/app/enums/app-path";
import {
  AUTH_FORM_STEP,
  type AuthFormStep,
} from "@/src/app/enums/auth-form-step";
import { useAuthAction } from "@/src/app/hooks/use-auth-action";
import {
  resetPassword,
  sendPasswordResetCode,
} from "@/src/app/services/auth-service";

/**
 * パスワード再設定（確認コードの送信と新パスワードの設定）の状態と送信を管理するフック
 * @returns フォーム値・更新関数・段階・送信関数・実行状態
 */
export const usePasswordReset = () => {
  const router = useRouter();
  const [step, setStep] = useState<AuthFormStep>(AUTH_FORM_STEP.INPUT);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const { isPending, errorMessage, run } = useAuthAction();

  const submitRequest = async () => {
    await run(async () => {
      await sendPasswordResetCode(email);
      setStep(AUTH_FORM_STEP.CONFIRM);
    });
  };

  const submitNewPassword = async () => {
    await run(async () => {
      await resetPassword(email, code, newPassword);
      router.replace(APP_PATH.SIGN_IN);
    });
  };

  return {
    step,
    email,
    code,
    newPassword,
    setEmail,
    setCode,
    setNewPassword,
    submitRequest,
    submitNewPassword,
    isPending,
    errorMessage,
  };
};
