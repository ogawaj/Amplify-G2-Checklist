/**
 * 10進の非負整数だけからなる文字列を数値にする。範囲は検査しない
 * @param text - 変換する文字列（前後の空白は無視する）
 * @returns 数値。数字以外を含む・空の場合は null
 * @example parseInteger(" 12 ") // 12
 */
export const parseInteger = (text: string): number | null => {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
};
