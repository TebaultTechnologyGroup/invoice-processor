import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { invoiceProcessor } from "../functions/invoiceProcessor/resource";

const schema = a.schema({
  // AppSync requires at least one query — this dummy satisfies that requirement
  health: a
    .query()
    .returns(a.string())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.custom({ entry: "./health.js" })),

  // Return type — three agent results serialized as JSON strings
  ProcessInvoiceResult: a.customType({
    extractionJson: a.string().required(),
    matchingJson: a.string().required(),
    complianceJson: a.string().required(),
  }),

  // Mutation — arguments passed as JSON strings
  processInvoice: a
    .mutation()
    .arguments({
      invoiceJson: a.string().required(),
      purchaseOrdersJson: a.string().required(),
    })
    .returns(a.ref("ProcessInvoiceResult"))
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.function(invoiceProcessor)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: { expiresInDays: 30 },
  },
});
