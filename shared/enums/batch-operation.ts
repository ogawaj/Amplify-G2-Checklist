export const BATCH_OPERATION = {
  AGGREGATE: "AGGREGATE",
} as const;

export type BATCH_OPERATION =
  (typeof BATCH_OPERATION)[keyof typeof BATCH_OPERATION];
