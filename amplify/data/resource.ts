import { a, type ClientSchema, defineData } from "@aws-amplify/backend";

import { cklAggregateAccess } from "../functions/ckl-aggregate-access/resource";
import { cklSayHello } from "../functions/ckl-say-hello/resource";

const schema = a
  .schema({
    Todo: a
      .model({
        content: a.string(),
      })
      .authorization((allow) => [allow.owner()]),

    DailyAccessSummary: a
      .model({
        date: a.string().required(),
        accessCount: a.integer().required(),
      })
      .identifier(["date"])
      .authorization((allow) => [allow.authenticated()]),

    cklSayHello: a
      .query()
      .arguments({ name: a.string().required() })
      .returns(a.string())
      .handler(a.handler.function(cklSayHello))
      .authorization((allow) => [allow.authenticated()]),

    cklAggregateAccess: a
      .query()
      .arguments({ type: a.string().required() })
      .returns(a.string())
      .handler(a.handler.function(cklAggregateAccess))
      .authorization((allow) => [allow.authenticated()]),
  })
  .authorization((allow) => [allow.resource(cklAggregateAccess)]);

/** GraphQL スキーマの型定義 */
export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "userPool",
  },
});
