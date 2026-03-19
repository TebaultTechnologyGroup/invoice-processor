import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: process.env.AWS_REGION ?? "us-east-2" });
// Cross-region inference profile ID — note "us." prefix, not direct model ID
const MODEL_ID = "us.anthropic.claude-haiku-4-5-20251001-v1:0";



async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const body = JSON.stringify({
    anthropic_version: "bedrock-2023-05-31",
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  const cmd = new InvokeModelCommand({
    modelId: MODEL_ID,
    contentType: "application/json",
    accept: "application/json",
    body,
  });

  const response = await client.send(cmd);
  const decoded = JSON.parse(new TextDecoder().decode(response.body));
  return decoded.content[0].text;
}

// ── Agent 1: Extraction ──────────────────────────────────────────────────────
async function runExtractionAgent(invoice: any) {
  const system = `You are a financial document extraction agent for an AP automation system.
Your job is to extract and validate key fields from invoice data, assess data quality, and flag any anomalies.
You must respond ONLY with a valid JSON object — no preamble, no markdown, no explanation.`;

  const user = `Extract and validate the following invoice. Return a JSON object with exactly these fields:
{
  "vendorName": string,
  "vendorId": string,
  "invoiceNumber": string,
  "invoiceDate": string,
  "dueDate": string,
  "totalAmount": number,
  "currency": string,
  "lineItemCount": number,
  "poReference": string | null,
  "confidence": number (0-1, your confidence in data quality),
  "flags": string[] (any anomalies or concerns you notice),
  "summary": string (1-2 sentence plain English summary of what you extracted and any concerns)
}

Invoice data:
${JSON.stringify(invoice, null, 2)}`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ── Agent 2: PO Matching ─────────────────────────────────────────────────────
async function runMatchingAgent(invoice: any, extraction: any, purchaseOrders: any[]) {
  const system = `You are a purchase order matching agent for an AP automation system.
Your job is to validate invoices against open purchase orders, check budget availability, and flag discrepancies.
You must respond ONLY with a valid JSON object — no preamble, no markdown, no explanation.`;

  const user = `Perform PO matching for this invoice against the available purchase orders. Return a JSON object with exactly these fields:
{
  "matchStatus": "matched" | "partial" | "no_match" | "no_po",
  "poNumber": string | null,
  "poVendorMatch": boolean,
  "amountWithinBudget": boolean,
  "remainingBalanceAfter": number | null,
  "toleranceVariance": number | null (percentage difference if amount differs from expected),
  "flags": string[] (any matching concerns),
  "summary": string (1-2 sentence plain English explanation of the match result)
}

Invoice:
${JSON.stringify(invoice, null, 2)}

Extracted data:
${JSON.stringify(extraction, null, 2)}

Available Purchase Orders:
${JSON.stringify(purchaseOrders, null, 2)}`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ── Agent 3: Compliance ──────────────────────────────────────────────────────
async function runComplianceAgent(invoice: any, extraction: any, matching: any) {
  const system = `You are a compliance and controls agent for an AP automation system.
Your job is to apply company policy rules, detect duplicates, assess risk, and make a final approval decision.
Company policies:
- Invoices over $25,000 require CFO approval
- All vendors must have a valid vendor ID in our system (format V-XXXX)
- Invoices without a PO reference over $3,000 must be escalated
- Payment terms must not exceed Net 45
- Flag any invoice where days-to-due is less than 10 from today (assume today is 2024-10-25)
You must respond ONLY with a valid JSON object — no preamble, no markdown, no explanation.`;

  const user = `Make a compliance decision for this invoice. Return a JSON object with exactly these fields:
{
  "decision": "approved" | "flagged" | "escalate",
  "vendorApproved": boolean,
  "duplicateDetected": boolean,
  "policyViolations": string[] (list each violated policy),
  "riskScore": number (0-10, where 10 is highest risk),
  "auditNote": string (formal audit log entry),
  "summary": string (1-2 sentence plain English explanation of the compliance decision)
}

Invoice:
${JSON.stringify(invoice, null, 2)}

Extraction result:
${JSON.stringify(extraction, null, 2)}

Matching result:
${JSON.stringify(matching, null, 2)}`;

  const raw = await callClaude(system, user);
  return JSON.parse(raw.replace(/```json|```/g, "").trim());
}

// ── Handler ──────────────────────────────────────────────────────────────────
// Called as an Amplify Gen2 custom mutation handler (AppSync → Lambda)
// Arguments are JSON strings — avoids a.input() version dependency
export const handler = async (event: {
  arguments: {
    invoiceJson: string;
    purchaseOrdersJson: string;
  };
}) => {
  const invoice = JSON.parse(event.arguments.invoiceJson);
  const purchaseOrders = JSON.parse(event.arguments.purchaseOrdersJson);

  // Run agents sequentially — each feeds into the next
  const extraction = await runExtractionAgent(invoice);
  const matching = await runMatchingAgent(invoice, extraction, purchaseOrders);
  const compliance = await runComplianceAgent(invoice, extraction, matching);

  // Serialize each result to JSON string — matches the flattened ProcessInvoiceResult schema
  return {
    extractionJson: JSON.stringify(extraction),
    matchingJson: JSON.stringify(matching),
    complianceJson: JSON.stringify(compliance),
  };
};
