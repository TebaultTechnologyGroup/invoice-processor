import React, { useState } from "react";
import { Amplify } from "aws-amplify";
import { generateClient } from "aws-amplify/data";
import outputs from "../amplify_outputs.json";
import type { Schema } from "../amplify/data/resource";
import { INVOICES, PURCHASE_ORDERS } from "./data/fakeData";
import { AgentStatus, AgentRunResult } from "./types/agents";
import { AgentPanel } from "./components/AgentPanel";
import { InvoiceCard } from "./components/InvoiceCard";
import {
  ExtractionDetail,
  MatchingDetail,
  ComplianceDetail,
} from "./components/ResultDetail";

Amplify.configure(outputs);
const client = generateClient<Schema>();

type RunStatus = "idle" | "running" | "complete" | "error";

export default function App() {
  const [selectedId, setSelectedId] = useState(INVOICES[0].id);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [agentStatuses, setAgentStatuses] = useState<
    Record<string, AgentStatus>
  >({
    extraction: "idle",
    matching: "idle",
    compliance: "idle",
  });
  const [results, setResults] = useState<AgentRunResult>({
    extraction: null,
    matching: null,
    compliance: null,
  });
  const [error, setError] = useState<string | null>(null);

  const selectedInvoice = INVOICES.find((inv) => inv.id === selectedId)!;

  const setAgent = (agent: string, status: AgentStatus) =>
    setAgentStatuses((prev) => ({ ...prev, [agent]: status }));

  async function runAgents() {
    setRunStatus("running");
    setError(null);
    setResults({ extraction: null, matching: null, compliance: null });
    setAgentStatuses({
      extraction: "running",
      matching: "idle",
      compliance: "idle",
    });

    try {
      const { data, errors } = await client.mutations.processInvoice({
        invoiceJson: JSON.stringify(selectedInvoice),
        purchaseOrdersJson: JSON.stringify(PURCHASE_ORDERS),
      });

      if (errors?.length) throw new Error(errors[0].message);
      if (!data) throw new Error("No data returned from mutation");

      // Parse JSON strings back into typed objects
      const extraction = JSON.parse(data.extractionJson);
      const matching = JSON.parse(data.matchingJson);
      const compliance = JSON.parse(data.complianceJson);

      // Sequential reveal with delays for visual effect
      setAgent("extraction", "complete");
      setResults((prev) => ({ ...prev, extraction }));

      await delay(600);
      setAgent("matching", "running");
      await delay(800);
      setAgent("matching", "complete");
      setResults((prev) => ({ ...prev, matching }));

      await delay(600);
      setAgent("compliance", "running");
      await delay(800);
      setAgent("compliance", "complete");
      setResults((prev) => ({ ...prev, compliance }));

      setRunStatus("complete");
    } catch (err: any) {
      setError(err.message);
      setRunStatus("error");
      setAgentStatuses({
        extraction: "error",
        matching: "idle",
        compliance: "idle",
      });
    }
  }

  function reset() {
    setRunStatus("idle");
    setError(null);
    setResults({ extraction: null, matching: null, compliance: null });
    setAgentStatuses({
      extraction: "idle",
      matching: "idle",
      compliance: "idle",
    });
  }

  const decisionColor = results.compliance
    ? results.compliance.decision === "approved"
      ? "#27ae60"
      : results.compliance.decision === "flagged"
        ? "#e67e22"
        : "#c0392b"
    : undefined;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2eb; min-height: 100vh; }
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        select { appearance: none; cursor: pointer; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: "#1a1916",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 18,
              }}
            >
              📄
            </div>
            <span
              style={{
                fontFamily: "'Fraunces', serif",
                fontSize: 22,
                fontWeight: 900,
                color: "#1a1916",
                letterSpacing: "-0.03em",
              }}
            >
              AP Invoice Processor
            </span>
          </div>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#888780",
              lineHeight: 1.5,
              maxWidth: 480,
            }}
          >
            Multi-agent AI system — extraction, PO matching, and compliance
            checks run sequentially via AWS Bedrock + Claude.
          </p>
        </div>

        {/* Invoice selector */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#888780",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 8,
            }}
          >
            Select invoice
          </label>
          <div
            style={{
              position: "relative",
              display: "inline-block",
              width: "100%",
            }}
          >
            <select
              value={selectedId}
              onChange={(e) => {
                setSelectedId(e.target.value);
                reset();
              }}
              style={{
                width: "100%",
                padding: "12px 40px 12px 16px",
                border: "1px solid #d4c9b0",
                borderRadius: 12,
                background: "#fff",
                color: "#1a1916",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
              }}
            >
              {INVOICES.map((inv) => (
                <option key={inv.id} value={inv.id}>
                  {inv.vendorName} — ${inv.amount.toLocaleString()} —{" "}
                  {inv.invoiceNumber}
                  {!inv.poReference ? " ⚠ No PO" : ""}
                </option>
              ))}
            </select>
            <span
              style={{
                position: "absolute",
                right: 14,
                top: "50%",
                transform: "translateY(-50%)",
                pointerEvents: "none",
                color: "#888780",
              }}
            >
              ▾
            </span>
          </div>
        </div>

        {/* Selected invoice card */}
        <div style={{ marginBottom: 28 }}>
          <InvoiceCard invoice={selectedInvoice} />
        </div>

        {/* Run button */}
        <div style={{ marginBottom: 32, display: "flex", gap: 12 }}>
          <button
            onClick={runAgents}
            disabled={runStatus === "running"}
            style={{
              padding: "13px 28px",
              background: runStatus === "running" ? "#888780" : "#1a1916",
              color: "#f5f2eb",
              border: "none",
              borderRadius: 12,
              fontWeight: 600,
              fontSize: 14,
              transition: "all 0.2s",
              opacity: runStatus === "running" ? 0.7 : 1,
            }}
          >
            {runStatus === "running" ? "Running agents…" : "▶  Run AI Agents"}
          </button>
          {runStatus !== "idle" && (
            <button
              onClick={reset}
              style={{
                padding: "13px 20px",
                background: "transparent",
                color: "#888780",
                border: "1px solid #d4c9b0",
                borderRadius: 12,
                fontWeight: 500,
                fontSize: 14,
              }}
            >
              Reset
            </button>
          )}
        </div>

        {error && (
          <div
            style={{
              background: "#fdf0ef",
              border: "1px solid #e74c3c40",
              borderRadius: 12,
              padding: "14px 18px",
              marginBottom: 24,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              color: "#c0392b",
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* Agent panels */}
        {runStatus !== "idle" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <AgentPanel
              title="Extraction agent"
              subtitle="Parses invoice fields, validates data quality, assigns confidence score"
              icon="🔍"
              status={agentStatuses.extraction}
              accentColor="#2980b9"
            >
              {results.extraction && (
                <ExtractionDetail result={results.extraction} />
              )}
            </AgentPanel>

            <AgentPanel
              title="PO matching agent"
              subtitle="Validates against open purchase orders, checks budget availability"
              icon="🔗"
              status={agentStatuses.matching}
              accentColor="#8e44ad"
            >
              {results.matching && <MatchingDetail result={results.matching} />}
            </AgentPanel>

            <AgentPanel
              title="Compliance agent"
              subtitle="Applies policy rules, duplicate detection, generates audit trail"
              icon="⚖️"
              status={agentStatuses.compliance}
              accentColor={decisionColor ?? "#27ae60"}
            >
              {results.compliance && (
                <ComplianceDetail result={results.compliance} />
              )}
            </AgentPanel>
          </div>
        )}

        {/* Footer */}
        <div
          style={{
            marginTop: 48,
            paddingTop: 20,
            borderTop: "1px solid #e2e0d8",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 12,
            color: "#aaa9a1",
            display: "flex",
            justifyContent: "space-between",
          }}
        >
          <span>
            Built on AWS Amplify Gen2 · Bedrock · Claude claude-haiku-4-5
          </span>
          <span>Finance AI Enablement Demo</span>
        </div>
      </div>
    </>
  );
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
