import { a, type ClientSchema, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  /** チェックリスト */
  CheckList: a
    .model({
      name: a.string().required(),
      durationDays: a.integer().required().default(1),
      /** 準備モードの絞り込みで選択を外したタグのID。既存データに値がないため任意とし、未設定は空として扱う */
      hiddenTagIds: a.id().required().array(),
      /** 準備モードの絞り込みでタグなしの持ち物を外しているか。未設定は false として扱う */
      isUntaggedHidden: a.boolean(),
      /** 一覧での表示順。既存データに値がないため任意とし、未設定は作成日時順で末尾に並べる */
      sortOrder: a.integer(),
    })
    .authorization((allow) => [allow.owner()]),

  /** カテゴリ */
  Category: a
    .model({
      checkListId: a.id().required(),
      name: a.string().required(),
      sortOrder: a.integer().required(),
    })
    .secondaryIndexes((index) => [
      index("checkListId").queryField("listCategoriesByCheckListId"),
    ])
    .authorization((allow) => [allow.owner()]),

  /** タグ */
  Tag: a
    .model({
      checkListId: a.id().required(),
      name: a.string().required(),
      /** 表示順。既存データに値がないため任意とし、未設定は作成日時順で末尾に並べる */
      sortOrder: a.integer(),
    })
    .secondaryIndexes((index) => [
      index("checkListId").queryField("listTagsByCheckListId"),
    ])
    .authorization((allow) => [allow.owner()]),

  /** 持ち物 */
  Item: a
    .model({
      checkListId: a.id().required(),
      categoryId: a.id().required(),
      name: a.string().required(),
      quantityPerDay: a.integer(),
      isChecked: a.boolean().required().default(false),
      tagIds: a.id().required().array(),
      /** カテゴリ内の表示順。既存データに値がないため任意とし、未設定は作成日時順で末尾に並べる */
      sortOrder: a.integer(),
      /** 準備モードで表示しないか。既存データに値がないため任意とし、未設定は false として扱う */
      isHidden: a.boolean(),
    })
    .secondaryIndexes((index) => [
      index("checkListId").queryField("listItemsByCheckListId"),
    ])
    .authorization((allow) => [allow.owner()]),
});

/** GraphQL スキーマの型定義 */
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
