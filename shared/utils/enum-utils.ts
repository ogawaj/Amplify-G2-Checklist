import { isEqual, sortBy } from "lodash";

/** クラスの値 */
type valueOf<T> = T[keyof T];

/** Enumのユーティリティークラスです。 */
export class EnumUtils {
  /**
   * インスタンス化を禁止するprivateなコンストラクタ
   */
  private constructor() {}

  /**
   * 引数で指定したプロパティを持つEnumを取得します。
   * @param enms Enum
   * @param propName Enumのプロパティ名（value, label等）
   * @param v 値
   * @returns Enum
   */
  public static getEnum<T>(
    enms: T,
    propName: string,
    v: unknown,
  ): valueOf<T> | undefined {
    for (const key in enms) {
      const enm: valueOf<T> = enms[key];
      if (isEqual(enm[propName as keyof typeof enm], v)) {
        return enm;
      }
    }
    return;
  }

  /**
   * 引数で指定したプロパティを持つEnumを取得します。存在しない場合は例外を投げます。
   * @param enms Enum
   * @param propName Enumのプロパティ名（value, label等）
   * @param v 値
   * @returns Enum
   */
  public static getEnumOrThrow = <T>(
    enms: T,
    propName: string,
    v: unknown,
  ): valueOf<T> => {
    const enm = EnumUtils.getEnum(enms, propName, v);
    if (!enm) {
      throw new Error(`Enumが見つかりませんでした。${propName}: ${v}`);
    }
    return enm;
  };

  /**
   * ソートしたEnum配列を取得します。
   * @param enms Enum
   * @param sortKey ソートキーとなるプロパティ名
   * @returns Enum配列
   */
  public static getSortedEnums = <T>(enms: T, sortKey: string) => {
    const ret = [];
    for (const key in enms) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enm: any = enms[key];
      ret.push(enm);
    }
    return sortBy(ret, sortKey);
  };
}
