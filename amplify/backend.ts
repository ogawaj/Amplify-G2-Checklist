import { defineBackend } from "@aws-amplify/backend";
import { Tags } from "aws-cdk-lib";
import { Function as LambdaFunction } from "aws-cdk-lib/aws-lambda";

import { auth } from "./auth/resource";
import { getEnvVariable } from "./common/services/env-variable-service";
import { data } from "./data/resource";
import { cklAggregateAccess } from "./functions/ckl-aggregate-access/resource";
import { cklSayHello } from "./functions/ckl-say-hello/resource";

const PROJECT_NAME = "Amplify-G2-CheckList";

const backend = defineBackend({
  auth,
  data,
  cklSayHello,
  cklAggregateAccess,
});

// 環境名 prod, stag, dev, sandbox等
const env = getEnvVariable().ENV_NAME;

// Lambda関数リスト
const lambdas = [backend.cklSayHello, backend.cklAggregateAccess];

for (const lambda of lambdas) {
  // L2 Function の addEnvironment を使い、defineFunction で設定済みの環境変数に ENV をマージする
  // （cfnFunction.environment への直接代入は Amplify 自動注入分（AMPLIFY_DATA_* 等）を上書きしてしまうため使用しない）
  (lambda.resources.lambda as LambdaFunction).addEnvironment("ENV", env);
}

// ユーザープールのポリシーを設定
const { cfnUserPool } = backend.auth.resources.cfnResources;
cfnUserPool.policies = {
  passwordPolicy: {
    minimumLength: 8,
    requireLowercase: false,
    requireUppercase: false,
    requireNumbers: true,
    requireSymbols: true,
  },
};

// 上記で定義されたバックエンド全体にタグを付与
const backendTags = Tags.of(backend.stack);
backendTags.add("user:Application", PROJECT_NAME);
backendTags.add("user:Stack", env);
