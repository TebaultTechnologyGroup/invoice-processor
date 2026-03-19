import { type ClientSchema, a, defineData } from "@aws-amplify/backend";
import { invoiceProcessor } from "../functions/invoiceProcessor/resource";

const schema = a.schema({
  // ── Persisted invoice run record ──────────────────────────────────────────
  InvoiceRecord: a
    .model({
      invoiceId:      a.string().required(),
      vendorName:     a.string().required(),
      invoiceNumber:  a.string().required(),
      amount:         a.float().required(),
      decision:       a.string().required(), // "approved" | "flagged" | "escalate"
      status:         a.string().required(), // "pending" | "approved" | "rejected"
      extractionJson: a.string().required(),
      matchingJson:   a.string().required(),
      complianceJson: a.string().required(),
      reviewedBy:     a.string(),
      reviewNote:     a.string(),
      reviewedAt:     a.string(),
    })
    .authorization(allow => [allow.publicApiKey()]),

  // ── AppSync requires at least one query ───────────────────────────────────
  health: a
    .query()
    .returns(a.string())
    .authorization(allow => [allow.publicApiKey()])
    .handler(a.handler.custom({ entry: "./health.js" })),

  // ── Return type for processInvoice mutation ───────────────────────────────
  ProcessInvoiceResult: a.customType({
    extractionJson: a.string().required(),
    matchingJson:   a.string().required(),
    complianceJson: a.string().required(),
  }),

  // ── Main mutation — runs the 3 agents ────────────────────────────────────
  processInvoice: a
    .mutation()
    .arguments({
      invoiceJson:        a.string().required(),
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
