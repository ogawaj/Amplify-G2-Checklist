/** 利用者にそのまま表示してよい文言を持つエラー（検証エラー・認証の失敗など） */
export class UserFacingError extends Error {
  /**
   * 利用者向けのエラーを作る
   * @param message - 利用者にそのまま表示する文言
   */
  public constructor(message: string) {
    super(message);
    this.name = "UserFacingError";
  }
}
