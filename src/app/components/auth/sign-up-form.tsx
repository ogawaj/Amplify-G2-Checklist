"use client";

import Link from "next/link";

import { AuthCard } from "@/src/app/components/auth/auth-card";
import { AuthField } from "@/src/app/components/auth/auth-field";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { APP_PATH } from "@/src/app/enums/app-path";
import { AUTH_FORM_STEP } from "@/src/app/enums/auth-form-step";
import { useSignUp } from "@/src/app/hooks/use-sign-up";
import { Button } from "@/src/lib/shadcn/ui/button";

/**
 * サインアップフォーム（S-02。登録後に確認コードを入力する）
 * @returns サインアップフォーム
 */
export function SignUpForm() {
  const form = useSignUp();

  if (form.step === AUTH_FORM_STEP.CONFIRM) {
    return (
      <AuthCard title="確認コードの入力">
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            void form.submitConfirmation();
          }}
        >
          <NoticeBanner message={form.notice} tone="info" />
          <NoticeBanner message={form.errorMessage} />
          <p className="text-sm text-muted-foreground">
            メールアドレスに届いた確認コードを入力してください。
          </p>
          <AuthField
            id="email"
            label="メールアドレス"
            type="email"
            value={form.email}
            autoComplete="email"
            onChange={form.setEmail}
          />
          <AuthField
            id="code"
            label="確認コード"
            type="text"
            value={form.code}
            autoComplete="one-time-code"
            onChange={form.setCode}
          />
          <Button type="submit" size="lg" disabled={form.isPending}>
            {form.isPending ? "確認中..." : "確認してサインイン"}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={form.isPending || !form.canResendCode}
            onClick={() => void form.resendCode()}
          >
            確認コードを再送する
          </Button>
        </form>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="アカウント登録">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submitRegistration();
        }}
      >
        <NoticeBanner message={form.errorMessage} />
        <AuthField
          id="email"
          label="メールアドレス"
          type="email"
          value={form.email}
          autoComplete="email"
          onChange={form.setEmail}
        />
        <AuthField
          id="password"
          label="パスワード（8文字以上・数字と記号を含む）"
          type="password"
          value={form.password}
          autoComplete="new-password"
          onChange={form.setPassword}
        />
        <AuthField
          id="password-confirmation"
          label="パスワード（確認）"
          type="password"
          value={form.passwordConfirmation}
          autoComplete="new-password"
          onChange={form.setPasswordConfirmation}
        />
        <Button type="submit" size="lg" disabled={form.isPending}>
          {form.isPending ? "登録中..." : "登録する"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 text-center text-sm">
        <button
          type="button"
          className="underline"
          onClick={form.goToConfirmation}
        >
          確認コードを入力する（登録済みの場合）
        </button>
        <Link className="underline" href={APP_PATH.SIGN_IN}>
          サインインに戻る
        </Link>
      </div>
    </AuthCard>
  );
}
