import React from "react";
import { ExtractionResult, MatchingResult, ComplianceResult } from "../types/agents";

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

const Field: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>{label}</span>
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#1a1916", fontWeight: 500 }}>{value}</span>
  </div>
);

const FieldGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", marginBottom: 14 }}>{children}</div>
);

const Summary: React.FC<{ text: string }> = ({ text }) => (
  <div style={{
    background: "#faf9f6", borderRadius: 10, padding: "12px 14px",
    fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a",
    lineHeight: 1.6, borderLeft: "3px solid #d4c9b0", marginTop: 4,
  }}>{text}</div>
);

const FlagList: React.FC<{ flags: string[]; color?: string }> = ({ flags, color = "#c0392b" }) => {
  if (!flags || flags.length === 0) return (
    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#27ae60" }}>None</span>
  );
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {flags.map((f, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "flex-start", gap: 6,
          fontFamily: "'DM Sans', sans-serif", fontSize: 13, color,
        }}>
          <span style={{ marginTop: 1, flexShrink: 0 }}>⚠</span>{f}
        </div>
      ))}
    </div>
  );
};

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? "#27ae60" : pct >= 65 ? "#f39c12" : "#c0392b";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, height: 6, background: "#ede9e0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: color, borderRadius: 99, transition: "width 0.6s ease" }} />
      </div>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color, minWidth: 36 }}>{pct}%</span>
    </div>
  );
};

// ── Extraction Result ─────────────────────────────────────────────────────────
export const ExtractionDetail: React.FC<{ result: ExtractionResult }> = ({ result }) => (
  <div>
    <FieldGrid>
      <Field label="Vendor" value={result.vendorName} />
      <Field label="Invoice #" value={result.invoiceNumber} />
      <Field label="Amount" value={fmt(result.totalAmount)} />
      <Field label="PO Reference" value={result.poReference ?? "None"} />
      <Field label="Line Items" value={result.lineItemCount} />
      <Field label="Due Date" value={result.dueDate} />
    </FieldGrid>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Data confidence</div>
      <ConfidenceBar value={result.confidence} />
    </div>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Flags</div>
      <FlagList flags={result.flags} />
    </div>
    <Summary text={result.summary} />
  </div>
);

// ── Matching Result ───────────────────────────────────────────────────────────
const matchColors: Record<string, string> = {
  matched: "#27ae60", partial: "#f39c12", no_match: "#c0392b", no_po: "#8e44ad",
};
const matchLabels: Record<string, string> = {
  matched: "Matched", partial: "Partial match", no_match: "No match", no_po: "No PO",
};

export const MatchingDetail: React.FC<{ result: MatchingResult }> = ({ result }) => (
  <div>
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
      <span style={{
        fontFamily: "'DM Sans', sans-serif",
        fontSize: 12, fontWeight: 700, padding: "4px 12px",
        borderRadius: 99, background: matchColors[result.matchStatus] + "18",
        color: matchColors[result.matchStatus],
        textTransform: "uppercase", letterSpacing: "0.04em",
      }}>{matchLabels[result.matchStatus]}</span>
      {result.poNumber && (
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a" }}>
          {result.poNumber}
        </span>
      )}
    </div>
    <FieldGrid>
      <Field label="Vendor match" value={result.poVendorMatch ? "✓ Yes" : "✗ No"} />
      <Field label="Within budget" value={result.amountWithinBudget ? "✓ Yes" : "✗ No"} />
      {result.remainingBalanceAfter !== null && (
        <Field label="Remaining PO balance" value={fmt(result.remainingBalanceAfter)} />
      )}
      {result.toleranceVariance !== null && (
        <Field label="Amount variance" value={`${result.toleranceVariance.toFixed(1)}%`} />
      )}
    </FieldGrid>
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Flags</div>
      <FlagList flags={result.flags} />
    </div>
    <Summary text={result.summary} />
  </div>
);

// ── Compliance Result ─────────────────────────────────────────────────────────
const decisionConfig: Record<string, { label: string; color: string; bg: string }> = {
  approved: { label: "Approved for payment", color: "#27ae60", bg: "#eafaf1" },
  flagged:  { label: "Flagged for review",   color: "#e67e22", bg: "#fef9f0" },
  escalate: { label: "Escalate to CFO",      color: "#c0392b", bg: "#fdf0ef" },
};

export const ComplianceDetail: React.FC<{ result: ComplianceResult }> = ({ result }) => {
  const dc = decisionConfig[result.decision];
  const riskColor = result.riskScore <= 3 ? "#27ae60" : result.riskScore <= 6 ? "#f39c12" : "#c0392b";

  return (
    <div>
      <div style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "12px 16px", borderRadius: 10, background: dc.bg,
        border: `1px solid ${dc.color}30`, marginBottom: 16,
      }}>
        <span style={{ fontSize: 20 }}>
          {result.decision === "approved" ? "✅" : result.decision === "flagged" ? "⚠️" : "🚨"}
        </span>
        <span style={{
          fontFamily: "'DM Sans', sans-serif",
          fontWeight: 700, fontSize: 15, color: dc.color,
        }}>{dc.label}</span>
      </div>

      <FieldGrid>
        <Field label="Vendor approved" value={result.vendorApproved ? "✓ Yes" : "✗ No"} />
        <Field label="Duplicate detected" value={result.duplicateDetected ? "⚠ Yes" : "✓ No"} />
        <Field label="Risk score" value={
          <span style={{ color: riskColor, fontWeight: 700 }}>{result.riskScore}/10</span>
        } />
      </FieldGrid>

      {result.policyViolations && result.policyViolations.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Policy violations</div>
          <FlagList flags={result.policyViolations} />
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Audit note</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: "#888780",
          fontStyle: "italic", lineHeight: 1.6,
        }}>{result.auditNote}</div>
      </div>
      <Summary text={result.summary} />
    </div>
  );
};
