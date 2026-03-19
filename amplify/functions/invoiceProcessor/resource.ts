import { defineFunction } from "@aws-amplify/backend";

export const invoiceProcessor = defineFunction({
  name: "invoiceProcessor",
  entry: "./handler.ts",
  timeoutSeconds: 60,
  environment: {},
});
