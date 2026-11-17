import {
  confirmResetPassword,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  signIn,
  signUp,
} from "aws-amplify/auth";

/**
 * メールアドレスとパスワードでサインインする
 * @param input - メールアドレスとパスワード
 * @returns Cognitoのサインイン結果
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const signInWithPassword = async (input: {
  username: string;
  password: string;
}) => {
  return await signIn(input);
};

/**
 * メールアドレスとパスワードでユーザーを登録する
 * @param input - メールアドレスとパスワード
 * @returns Cognitoのサインアップ結果
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const signUpWithEmail = async (input: {
  username: string;
  password: string;
}) => {
  return await signUp({
    username: input.username,
    password: input.password,
    options: { userAttributes: { email: input.username } },
  });
};

/**
 * 確認コードでサインアップを完了する
 * @param input - メールアドレスと確認コード
 * @returns Cognitoの確認結果
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const confirmSignUpCode = async (input: {
  username: string;
  confirmationCode: string;
}) => {
  return await confirmSignUp(input);
};

/**
 * サインアップの確認コードを再送する
 * @param username - メールアドレス
 * @returns Cognitoの再送結果
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const resendSignUpConfirmationCode = async (username: string) => {
  return await resendSignUpCode({ username });
};

/**
 * パスワード再設定の確認コードを送信する
 * @param username - メールアドレス
 * @returns Cognitoの結果
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const requestPasswordReset = async (username: string) => {
  return await resetPassword({ username });
};

/**
 * 確認コードと新しいパスワードでパスワードを再設定する
 * @param input - メールアドレス・確認コード・新しいパスワード
 * @throws {unknown} Cognitoのエラーをそのまま投げる
 */
export const confirmPasswordReset = async (input: {
  username: string;
  confirmationCode: string;
  newPassword: string;
}): Promise<void> => {
  await confirmResetPassword(input);
};
