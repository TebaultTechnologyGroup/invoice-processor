export type AgentStatus = "idle" | "running" | "complete" | "error";

export interface ExtractionResult {
  vendorName: string;
  vendorId: string;
  invoiceNumber: string;
  invoiceDate: string;
  dueDate: string;
  totalAmount: number;
  currency: string;
  lineItemCount: number;
  poReference: string | null;
  confidence: number;
  flags: string[];
  summary: string;
}

export interface MatchingResult {
  matchStatus: "matched" | "partial" | "no_match" | "no_po";
  poNumber: string | null;
  poVendorMatch: boolean;
  amountWithinBudget: boolean;
  remainingBalanceAfter: number | null;
  toleranceVariance: number | null;
  flags: string[];
  summary: string;
}

export interface ComplianceResult {
  decision: "approved" | "flagged" | "escalate";
  vendorApproved: boolean;
  duplicateDetected: boolean;
  policyViolations: string[];
  riskScore: number;
  auditNote: string;
  summary: string;
}

export interface AgentRunResult {
  extraction: ExtractionResult | null;
  matching: MatchingResult | null;
  compliance: ComplianceResult | null;
}
