import { a, type ClientSchema, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  // スキーマはモデルを1件以上必要とするため、task-02フェーズAで4モデルに置き換えるまで残す
  Todo: a
    .model({
      content: a.string(),
    })
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
