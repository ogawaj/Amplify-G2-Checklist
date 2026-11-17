"use client";

import Link from "next/link";

import { AuthCard } from "@/src/app/components/auth/auth-card";
import { AuthField } from "@/src/app/components/auth/auth-field";
import { NoticeBanner } from "@/src/app/components/common/notice-banner";
import { APP_PATH } from "@/src/app/enums/app-path";
import { useSignIn } from "@/src/app/hooks/use-sign-in";
import { Button } from "@/src/lib/shadcn/ui/button";

/**
 * サインインフォーム（S-01）
 * @returns サインインフォーム
 */
export function SignInForm() {
  const form = useSignIn();
  return (
    <AuthCard title="サインイン">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          void form.submit();
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
          label="パスワード"
          type="password"
          value={form.password}
          autoComplete="current-password"
          onChange={form.setPassword}
        />
        <Button type="submit" size="lg" disabled={form.isPending}>
          {form.isPending ? "サインイン中..." : "サインイン"}
        </Button>
      </form>
      <div className="flex flex-col gap-2 text-center text-sm">
        <Link className="underline" href={APP_PATH.SIGN_UP}>
          アカウントを新規登録する
        </Link>
        <Link className="underline" href={APP_PATH.PASSWORD_RESET}>
          パスワードを忘れた場合
        </Link>
      </div>
    </AuthCard>
  );
}
