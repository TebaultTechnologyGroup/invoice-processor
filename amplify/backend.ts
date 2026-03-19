import { defineBackend } from "@aws-amplify/backend";
import { PolicyStatement, Effect } from "aws-cdk-lib/aws-iam";
import { invoiceProcessor } from "./functions/invoiceProcessor/resource";
import { data } from "./data/resource";

const backend = defineBackend({ invoiceProcessor, data });
//const MODEL_ID = "us.anthropic.claude-sonnet-4-5-20250929-v1:0";
const MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0"; // --- IGNORE ---


// invoiceProcessor policy
backend.invoiceProcessor.resources.lambda.addToRolePolicy(
  new PolicyStatement({
    actions: [
      'bedrock:InvokeModel',
      'bedrock:InvokeModelWithResponseStream',
      'aws-marketplace:ViewSubscriptions',
      'aws-marketplace:Subscribe',
    ],
    resources: ['*'],
  })
);

