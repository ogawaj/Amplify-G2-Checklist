import {
  AUTH_NEXT_STEP,
  type AuthNextStep,
} from "@/src/app/enums/auth-next-step";
import { UserFacingError } from "@/src/app/models/user-facing-error";
import {
  confirmPasswordReset,
  confirmSignUpCode,
  requestPasswordReset,
  resendSignUpConfirmationCode,
  signInWithPassword,
  signUpWithEmail,
} from "@/src/app/repositories/auth-repository";

/** パスワード要件の文言。amplify/backend.ts のユーザープールのポリシー（8文字以上・数字と記号を含む）に合わせる */
const PASSWORD_POLICY_MESSAGE =
  "パスワードは8文字以上で、数字と記号を含めてください";

/** 試行回数超過のときの文言 */
const LIMIT_EXCEEDED_MESSAGE =
  "試行回数の上限に達しました。しばらくしてからお試しください";

/** 未確認ユーザーのサインイン時の文言 */
const NOT_CONFIRMED_MESSAGE =
  "メールアドレスの確認が完了していません。サインアップ画面で確認コードを入力してください";

/** 認証情報の誤りの文言 */
const INVALID_CREDENTIALS_MESSAGE =
  "メールアドレスまたはパスワードが正しくありません";

/** 対応表にないエラーに使う文言 */
const FALLBACK_MESSAGE =
  "処理に失敗しました。時間をおいてもう一度お試しください";

/** Cognito のエラー名と利用者向け文言の対応 */
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  NotAuthorizedException: INVALID_CREDENTIALS_MESSAGE,
  UserNotFoundException: INVALID_CREDENTIALS_MESSAGE,
  UserNotConfirmedException: NOT_CONFIRMED_MESSAGE,
  UsernameExistsException: "このメールアドレスは既に登録されています",
  InvalidPasswordException: PASSWORD_POLICY_MESSAGE,
  InvalidParameterException: "入力内容が正しくありません",
  CodeMismatchException: "確認コードが正しくありません",
  ExpiredCodeException:
    "確認コードの有効期限が切れています。コードを再送してください",
  LimitExceededException: LIMIT_EXCEEDED_MESSAGE,
  TooManyRequestsException: LIMIT_EXCEEDED_MESSAGE,
  NetworkError: "通信に失敗しました。接続を確認してもう一度お試しください",
};

/**
 * 認証処理を実行し、失敗を利用者向けのエラーに変換する
 * @param action - 実行する処理
 * @returns 処理の戻り値
 * @throws {UserFacingError} 処理が失敗した場合（対応表にないエラーは汎用文言）
 */
const withAuthErrors = async <T>(action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (error) {
    const name = error instanceof Error ? error.name : "";
    throw new UserFacingError(AUTH_ERROR_MESSAGES[name] ?? FALLBACK_MESSAGE);
  }
};

/**
 * メールアドレスとパスワードでサインインする
 * @param email - メールアドレス（前後の空白は除く）
 * @param password - パスワード
 * @returns 次の手順（SIGNED_IN：認証後の画面へ / CONFIRM_SIGN_UP：メール確認が未完了）
 * @throws {UserFacingError} 認証に失敗した場合、またはこのアカウントでサインインを完了できない場合
 */
export const signIn = async (
  email: string,
  password: string,
): Promise<AuthNextStep> => {
  const result = await withAuthErrors(() =>
    signInWithPassword({ username: email.trim(), password }),
  );
  if (result.isSignedIn) return AUTH_NEXT_STEP.SIGNED_IN;
  if (result.nextStep.signInStep === "CONFIRM_SIGN_UP") {
    return AUTH_NEXT_STEP.CONFIRM_SIGN_UP;
  }
  throw new UserFacingError("このアカウントではサインインを完了できません");
};

/**
 * ユーザーを登録し、確認コードの送信へ進める
 * @param email - メールアドレス（前後の空白は除く）
 * @param password - パスワード
 * @param passwordConfirmation - 確認用パスワード
 * @returns 次の手順（常に CONFIRM_SIGN_UP：確認コードの入力）
 * @throws {UserFacingError} パスワードが確認用と一致しない場合、または登録に失敗した場合
 */
export const signUp = async (
  email: string,
  password: string,
  passwordConfirmation: string,
): Promise<AuthNextStep> => {
  if (password !== passwordConfirmation) {
    throw new UserFacingError("パスワードが一致しません");
  }
  await withAuthErrors(() =>
    signUpWithEmail({ username: email.trim(), password }),
  );
  return AUTH_NEXT_STEP.CONFIRM_SIGN_UP;
};

/**
 * 確認コードでサインアップを完了し、パスワードがあればそのままサインインする
 * @param email - メールアドレス（前後の空白は除く）
 * @param code - 確認コード（前後の空白は除く）
 * @param password - サインアップ時のパスワード。空文字ならサインインは行わない
 * @returns 次の手順（SIGNED_IN：認証後の画面へ / SIGN_IN：サインイン画面へ / CONFIRM_SIGN_UP：なお確認が未完了）
 * @throws {UserFacingError} 確認またはサインインに失敗した場合
 */
export const confirmSignUp = async (
  email: string,
  code: string,
  password: string,
): Promise<AuthNextStep> => {
  await withAuthErrors(() =>
    confirmSignUpCode({
      username: email.trim(),
      confirmationCode: code.trim(),
    }),
  );
  if (password === "") return AUTH_NEXT_STEP.SIGN_IN;
  return await signIn(email, password);
};

/**
 * サインアップの確認コードを再送する
 * @param email - メールアドレス（前後の空白は除く）
 * @throws {UserFacingError} 再送に失敗した場合
 */
export const resendSignUpCode = async (email: string): Promise<void> => {
  await withAuthErrors(() => resendSignUpConfirmationCode(email.trim()));
};

/**
 * パスワード再設定の確認コードをメールで送る
 * @param email - メールアドレス（前後の空白は除く）
 * @throws {UserFacingError} 送信に失敗した場合
 */
export const sendPasswordResetCode = async (email: string): Promise<void> => {
  await withAuthErrors(() => requestPasswordReset(email.trim()));
};

/**
 * 確認コードと新しいパスワードでパスワードを再設定する
 * @param email - メールアドレス（前後の空白は除く）
 * @param code - 確認コード（前後の空白は除く）
 * @param newPassword - 新しいパスワード
 * @throws {UserFacingError} コードが誤り・期限切れの場合、またはパスワードが要件を満たさない場合
 */
export const resetPassword = async (
  email: string,
  code: string,
  newPassword: string,
): Promise<void> => {
  await withAuthErrors(() =>
    confirmPasswordReset({
      username: email.trim(),
      confirmationCode: code.trim(),
      newPassword,
    }),
  );
};
