import { defineBackend } from "@aws-amplify/backend";
import { Tags } from "aws-cdk-lib";

import { auth } from "./auth/resource";
import { getEnvVariable } from "./common/services/env-variable-service";
import { data } from "./data/resource";

const PROJECT_NAME = "Amplify-G2-CheckList";

const backend = defineBackend({
  auth,
  data,
});

// 環境名 prod, stag, dev, sandbox等
const env = getEnvVariable().ENV_NAME;

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
