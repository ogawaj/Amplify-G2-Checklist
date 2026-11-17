"use client";

import Link from "next/link";

import { AuthCard } from "@/src/app/components/auth/auth-card";
import { AuthField } from "@/src/app/components/auth/auth-field";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { APP_PATH } from "@/src/app/enums/app-path";
import { AUTH_FORM_STEP } from "@/src/app/enums/auth-form-step";
import { usePasswordReset } from "@/src/app/hooks/use-password-reset";
import { Button } from "@/src/lib/shadcn/ui/button";

/**
 * パスワード再設定フォーム（S-03。確認コードの送信後に新しいパスワードを設定する）
 * @returns パスワード再設定フォーム
 */
export function PasswordResetForm() {
  const form = usePasswordReset();
  const isConfirming = form.step === AUTH_FORM_STEP.CONFIRM;

  return (
    <AuthCard title="パスワードの再設定">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void (isConfirming ? form.submitNewPassword() : form.submitRequest());
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
        {isConfirming && (
          <>
            <p className="text-sm text-muted-foreground">
              メールアドレスに届いた確認コードと、新しいパスワードを入力してください。
            </p>
            <AuthField
              id="code"
              label="確認コード"
              type="text"
              value={form.code}
              autoComplete="one-time-code"
              onChange={form.setCode}
            />
            <AuthField
              id="new-password"
              label="新しいパスワード（8文字以上・数字と記号を含む）"
              type="password"
              value={form.newPassword}
              autoComplete="new-password"
              onChange={form.setNewPassword}
            />
          </>
        )}
        <Button type="submit" size="lg" disabled={form.isPending}>
          {isConfirming ? "パスワードを再設定する" : "確認コードを送信する"}
        </Button>
      </form>
      <div className="text-center text-sm">
        <Link className="underline" href={APP_PATH.SIGN_IN}>
          サインインに戻る
        </Link>
      </div>
    </AuthCard>
  );
}
