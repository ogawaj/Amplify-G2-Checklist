/** Amplify Dataの型付きクライアントが返す応答のうち、本モジュールが参照する部分 */
type DataResponse<T> = {
  data: T | null;
  errors?: readonly { errorType?: string }[];
};

/** 一覧取得の1ページ分の応答 */
type ListResponse<T> = {
  data: T[];
  nextToken?: string | null;
  errors?: readonly { errorType?: string }[];
};

/** 条件付き書き込みの不成立を表すエラー種別 */
const CONDITIONAL_CHECK_FAILED = "DynamoDB:ConditionalCheckFailedException";

/**
 * 応答の errors を加工せずに投げ、成功時はデータを返す
 * @param response - 型付きクライアントの応答
 * @returns 応答のデータ
 * @throws {unknown} errors が存在する場合は errors（GraphQLエラーの配列）をそのまま投げる。data が null の場合は Error
 */
export const unwrapData = <T>(response: DataResponse<T>): T => {
  if (response.errors) throw response.errors;
  if (response.data === null) {
    throw new Error("データが返されませんでした");
  }
  return response.data;
};

/**
 * 削除応答の errors を加工せずに投げ、成功時は削除したデータを返す
 * @param response - 型付きクライアントの削除応答
 * @returns 削除したデータ。対象が存在しない場合（条件付き書き込みの不成立）は null
 * @throws {unknown} 対象不在以外の errors をそのまま投げる
 */
export const unwrapDeletedData = <T>(response: DataResponse<T>): T | null => {
  if (response.errors) {
    const isOnlyNotFound = response.errors.every(
      (error) => error.errorType === CONDITIONAL_CHECK_FAILED,
    );
    if (isOnlyNotFound) return null;
    throw response.errors;
  }
  return response.data;
};

/**
 * nextToken を辿って全ページを取得する
 * @param fetchPage - nextToken を受け取り1ページ分を返す関数
 * @returns 全ページのデータ
 * @throws {unknown} いずれかのページの errors をそのまま投げる
 */
export const listAllPages = async <T>(
  fetchPage: (nextToken: string | null) => Promise<ListResponse<T>>,
): Promise<T[]> => {
  const all: T[] = [];
  let nextToken: string | null = null;
  do {
    const response: ListResponse<T> = await fetchPage(nextToken);
    if (response.errors) throw response.errors;
    all.push(...response.data);
    nextToken = response.nextToken ?? null;
  } while (nextToken !== null);
  return all;
};
