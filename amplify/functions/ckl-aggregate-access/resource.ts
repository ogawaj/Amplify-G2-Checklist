import { defineFunction } from "@aws-amplify/backend";

export const cklAggregateAccess = defineFunction({
  name: "ckl-aggregate-access",
  resourceGroupName: "data",
  entry: "./index.ts",
  timeoutSeconds: 60,
});
