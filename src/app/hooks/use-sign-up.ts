"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { APP_PATH } from "@/src/app/enums/app-path";
import {
  AUTH_FORM_STEP,
  type AuthFormStep,
} from "@/src/app/enums/auth-form-step";
import { AUTH_NEXT_STEP } from "@/src/app/enums/auth-next-step";
import { useAuthAction } from "@/src/app/hooks/use-auth-action";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  confirmSignUp,
  resendSignUpCode,
  signUp,
} from "@/src/app/services/auth-service";

/**
 * サインアップ（登録と確認コードによる本人確認）の状態と送信を管理するフック
 * @returns フォーム値・更新関数・段階・送信関数・再送可否・実行状態
 */
export const useSignUp = () => {
  const router = useRouter();
  const [step, setStep] = useState<AuthFormStep>(AUTH_FORM_STEP.INPUT);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const { isPending, errorMessage, run } = useAuthAction();

  const submitRegistration = async () => {
    setNotice(null);
    await run(async () => {
      await signUp(email, password, passwordConfirmation);
      setStep(AUTH_FORM_STEP.CONFIRM);
    });
  };

  const submitConfirmation = async () => {
    setNotice(null);
    await run(async () => {
      const nextStep = await confirmSignUp(email, code, password);
      if (nextStep === AUTH_NEXT_STEP.SIGN_IN) {
        router.replace(APP_PATH.SIGN_IN);
      } else if (nextStep === AUTH_NEXT_STEP.CONFIRM_SIGN_UP) {
        throw new UserFacingError(
          "メールアドレスの確認が完了していません。確認コードをもう一度入力してください",
        );
      }
    });
  };

  const resendCode = async () => {
    setNotice(null);
    const isSucceeded = await run(async () => {
      await resendSignUpCode(email);
    });
    if (isSucceeded) setNotice("確認コードを再送しました");
  };

  const goToConfirmation = () => {
    setNotice(null);
    setStep(AUTH_FORM_STEP.CONFIRM);
  };

  return {
    step,
    email,
    password,
    passwordConfirmation,
    code,
    notice,
    setEmail,
    setPassword,
    setPasswordConfirmation,
    setCode,
    submitRegistration,
    submitConfirmation,
    resendCode,
    goToConfirmation,
    canResendCode: email.trim() !== "",
    isPending,
    errorMessage,
  };
};
