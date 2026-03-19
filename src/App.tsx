import React, { useState, useEffect } from "react";
import { generateClient } from "aws-amplify/data";
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
import { ROICalculator } from "./components/ROICalculator";

const client = generateClient<Schema>();
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
type RunStatus = "idle" | "running" | "complete" | "error";
type AppTab = "processor" | "queue" | "roi";

// ── Decision colors ───────────────────────────────────────────────────────────
const DECISION_COLOR: Record<string, string> = {
  approved: "#27ae60",
  flagged: "#e67e22",
  escalate: "#c0392b",
};
const STATUS_COLOR: Record<string, { bg: string; text: string }> = {
  pending: { bg: "#FFF3CD", text: "#856404" },
  approved: { bg: "#d4edda", text: "#155724" },
  rejected: { bg: "#fde8e8", text: "#721c24" },
};

export default function App() {
  const [appTab, setAppTab] = useState<AppTab>("processor");
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
  const [queue, setQueue] = useState<Array<Schema["InvoiceRecord"]["type"]>>(
    [],
  );
  const [queueLoading, setQueueLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});

  const selectedInvoice = INVOICES.find((inv) => inv.id === selectedId)!;
  const setAgent = (agent: string, status: AgentStatus) =>
    setAgentStatuses((prev) => ({ ...prev, [agent]: status }));

  // ── Load queue ──────────────────────────────────────────────────────────────
  async function loadQueue() {
    setQueueLoading(true);
    try {
      const { data } = await client.models.InvoiceRecord.list();
      setQueue(
        (data ?? []).sort(
          (a, b) =>
            new Date(b.createdAt ?? 0).getTime() -
            new Date(a.createdAt ?? 0).getTime(),
        ),
      );
    } catch (e) {
      console.error(e);
    } finally {
      setQueueLoading(false);
    }
  }

  useEffect(() => {
    if (appTab === "queue") loadQueue();
  }, [appTab]);

  // ── Reset all demo data ─────────────────────────────────────────────────────
  async function resetQueue() {
    if (!window.confirm("Delete all invoice records? This cannot be undone."))
      return;
    setQueueLoading(true);
    try {
      const { data } = await client.models.InvoiceRecord.list();
      await Promise.all(
        (data ?? []).map((r) =>
          client.models.InvoiceRecord.delete({ id: r.id }),
        ),
      );
      setQueue([]);
    } catch (e) {
      console.error(e);
    } finally {
      setQueueLoading(false);
    }
  }

  // ── Run agents + persist result ─────────────────────────────────────────────
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

      const extraction = JSON.parse(data.extractionJson!);
      const matching = JSON.parse(data.matchingJson!);
      const compliance = JSON.parse(data.complianceJson!);

      // Sequential reveal
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

      // Persist to DynamoDB — only flagged/escalate go to review queue
      const initialStatus =
        compliance.decision === "approved" ? "approved" : "pending";
      await client.models.InvoiceRecord.create({
        invoiceId: selectedInvoice.id,
        vendorName: selectedInvoice.vendorName,
        invoiceNumber: selectedInvoice.invoiceNumber,
        amount: selectedInvoice.amount,
        decision: compliance.decision,
        status: initialStatus,
        extractionJson: data.extractionJson!,
        matchingJson: data.matchingJson!,
        complianceJson: data.complianceJson!,
      });
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

  // ── Approve / Reject ────────────────────────────────────────────────────────
  async function updateRecord(id: string, status: "approved" | "rejected") {
    await client.models.InvoiceRecord.update({
      id,
      status,
      reviewedBy: "Demo Reviewer",
      reviewNote: reviewNote[id] ?? "",
      reviewedAt: new Date().toISOString(),
    });
    loadQueue();
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
    ? (DECISION_COLOR[results.compliance.decision] ?? "#27ae60")
    : undefined;

  const pendingCount = queue.filter((r) => r.status === "pending").length;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: "9px 20px",
    borderRadius: 10,
    cursor: "pointer",
    fontFamily: "'DM Sans', sans-serif",
    fontSize: 13,
    fontWeight: 500,
    border: active ? "1px solid #1a1916" : "1px solid #d4c9b0",
    background: active ? "#1a1916" : "transparent",
    color: active ? "#f5f2eb" : "#888780",
    transition: "all .15s",
    position: "relative" as const,
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;700;900&family=DM+Sans:wght@400;500;600&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #f5f2eb; min-height: 100vh; }
        @keyframes pulse { 0%,100%{opacity:.3;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes fadeSlideIn { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
        select,textarea { appearance: none; cursor: pointer; }
        button { cursor: pointer; font-family: 'DM Sans', sans-serif; }
        textarea { resize: vertical; font-family: 'DM Sans', sans-serif; font-size: 13px; }
      `}</style>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "40px 24px" }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 6,
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
              maxWidth: 900,
            }}
          >
            Multi-agent AI system — extraction, PO matching, and compliance
            checks.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#888780",
              lineHeight: 1.5,
              maxWidth: 900,
            }}
          >
            <a
              href="https://www.linkedin.com/in/mark-tebault/"
              target="_blank"
              style={{ color: "#2980b9" }}
            >
              Created by Mark Tebault
            </a>
          </p>
        </div>

        {/* Tab nav */}
        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          <button
            style={tabStyle(appTab === "processor")}
            onClick={() => setAppTab("processor")}
          >
            Invoice processor
          </button>
          <button
            style={{
              ...tabStyle(appTab === "queue"),
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
            onClick={() => setAppTab("queue")}
          >
            Approval queue
            {pendingCount > 0 && (
              <span
                style={{
                  background: "#c0392b",
                  color: "#fff",
                  borderRadius: 99,
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "1px 7px",
                  minWidth: 20,
                  textAlign: "center",
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>
          <button
            style={tabStyle(appTab === "roi")}
            onClick={() => setAppTab("roi")}
          >
            💰 ROI calculator
          </button>
        </div>

        {/* ── PROCESSOR TAB ─────────────────────────────────────────────────── */}
        {appTab === "processor" && (
          <>
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
              <div style={{ position: "relative", width: "100%" }}>
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

            <div style={{ marginBottom: 28 }}>
              <InvoiceCard invoice={selectedInvoice} />
            </div>

            {/* Run / Reset */}
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
                  opacity: runStatus === "running" ? 0.7 : 1,
                }}
              >
                {runStatus === "running"
                  ? "Running agents…"
                  : "▶  Run AI Agents"}
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

            {runStatus !== "idle" && (
              <div
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
              >
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
                  {results.matching && (
                    <MatchingDetail result={results.matching} />
                  )}
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

            {runStatus === "complete" &&
              results.compliance?.decision !== "approved" && (
                <div
                  style={{
                    marginTop: 20,
                    padding: "14px 18px",
                    background: "#fff8f0",
                    border: "1px solid #e67e2240",
                    borderRadius: 12,
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#856404",
                  }}
                >
                  This invoice has been added to the{" "}
                  <strong>Approval Queue</strong> for review.
                </div>
              )}
          </>
        )}

        {/* ── APPROVAL QUEUE TAB ────────────────────────────────────────────── */}
        {appTab === "queue" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Fraunces', serif",
                    fontSize: 18,
                    fontWeight: 700,
                    color: "#1a1916",
                  }}
                >
                  Review queue
                </div>
                <div
                  style={{
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    color: "#888780",
                    marginTop: 2,
                  }}
                >
                  Flagged and escalated invoices requiring human review
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={loadQueue}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #d4c9b0",
                    borderRadius: 10,
                    background: "#fff",
                    color: "#3d3d3a",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                  }}
                >
                  ↻ Refresh
                </button>
                <button
                  onClick={resetQueue}
                  disabled={queue.length === 0}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #e74c3c40",
                    borderRadius: 10,
                    background: queue.length === 0 ? "#faf9f6" : "#fdf0ef",
                    color: queue.length === 0 ? "#aaa9a1" : "#c0392b",
                    fontFamily: "'DM Sans', sans-serif",
                    fontSize: 13,
                    cursor: queue.length === 0 ? "not-allowed" : "pointer",
                  }}
                >
                  🗑 Reset demo
                </button>
              </div>
            </div>

            {queueLoading && (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#888780",
                  padding: "40px 0",
                  textAlign: "center",
                }}
              >
                Loading…
              </div>
            )}

            {!queueLoading && queue.length === 0 && (
              <div
                style={{
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: 13,
                  color: "#888780",
                  padding: "60px 0",
                  textAlign: "center",
                  border: "1px dashed #d4c9b0",
                  borderRadius: 12,
                }}
              >
                No invoices in queue. Run the processor to generate results.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {queue.map((record) => {
                const compliance = JSON.parse(record.complianceJson ?? "{}");
                const sc = STATUS_COLOR[record.status ?? "pending"];
                const isCFO = record.decision === "escalate";
                const isPending = record.status === "pending";

                return (
                  <div
                    key={record.id}
                    style={{
                      border: `1px solid ${isCFO ? "#e74c3c40" : "#e2e0d8"}`,
                      borderRadius: 14,
                      background: "#fff",
                      overflow: "hidden",
                    }}
                  >
                    {/* Record header */}
                    <div
                      style={{
                        padding: "16px 20px",
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                        borderBottom: "1px solid #f0ede5",
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginBottom: 4,
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'DM Sans', sans-serif",
                              fontWeight: 600,
                              fontSize: 15,
                              color: "#1a1916",
                            }}
                          >
                            {record.vendorName}
                          </span>
                          {isCFO && (
                            <span
                              style={{
                                fontSize: 11,
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: 99,
                                background: "#fde8e8",
                                color: "#c0392b",
                              }}
                            >
                              CFO APPROVAL
                            </span>
                          )}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            color: "#888780",
                          }}
                        >
                          {record.invoiceNumber} · $
                          {(record.amount ?? 0).toLocaleString()}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 12,
                            color: "#aaa9a1",
                            marginTop: 4,
                          }}
                        >
                          {compliance.summary}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "flex-end",
                          gap: 6,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: "3px 10px",
                            borderRadius: 99,
                            background: sc.bg,
                            color: sc.text,
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                          }}
                        >
                          {record.status}
                        </span>
                        <span
                          style={{
                            fontSize: 11,
                            color: "#aaa9a1",
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          Risk {compliance.riskScore}/10
                        </span>
                      </div>
                    </div>

                    {/* Policy violations */}
                    {compliance.policyViolations?.length > 0 && (
                      <div
                        style={{
                          padding: "10px 20px",
                          background: "#fffbf0",
                          borderBottom: "1px solid #f0ede5",
                        }}
                      >
                        {compliance.policyViolations.map(
                          (v: string, i: number) => (
                            <div
                              key={i}
                              style={{
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: 12,
                                color: "#856404",
                                display: "flex",
                                gap: 6,
                                marginBottom:
                                  i < compliance.policyViolations.length - 1
                                    ? 3
                                    : 0,
                              }}
                            >
                              <span>⚠</span>
                              {v}
                            </div>
                          ),
                        )}
                      </div>
                    )}

                    {/* Review reviewed-by */}
                    {!isPending && record.reviewedBy && (
                      <div
                        style={{
                          padding: "10px 20px",
                          background: "#faf9f6",
                          borderBottom: "1px solid #f0ede5",
                          fontFamily: "'DM Sans', sans-serif",
                          fontSize: 12,
                          color: "#888780",
                        }}
                      >
                        Reviewed by {record.reviewedBy}
                        {record.reviewNote ? ` · "${record.reviewNote}"` : ""}
                      </div>
                    )}

                    {/* Approve / Reject controls */}
                    {isPending && (
                      <div
                        style={{
                          padding: "14px 20px",
                          display: "flex",
                          gap: 10,
                          alignItems: "flex-end",
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <textarea
                            placeholder="Optional review note…"
                            rows={2}
                            value={reviewNote[record.id] ?? ""}
                            onChange={(e) =>
                              setReviewNote((prev) => ({
                                ...prev,
                                [record.id]: e.target.value,
                              }))
                            }
                            style={{
                              width: "100%",
                              padding: "8px 12px",
                              border: "1px solid #d4c9b0",
                              borderRadius: 8,
                              color: "#1a1916",
                              background: "#faf9f6",
                            }}
                          />
                        </div>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button
                            onClick={() => updateRecord(record.id, "approved")}
                            style={{
                              padding: "9px 18px",
                              background: "#27ae60",
                              color: "#fff",
                              border: "none",
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            ✓ Approve
                          </button>
                          <button
                            onClick={() => updateRecord(record.id, "rejected")}
                            style={{
                              padding: "9px 18px",
                              background: "#fff",
                              color: "#c0392b",
                              border: "1px solid #c0392b40",
                              borderRadius: 10,
                              fontWeight: 600,
                              fontSize: 13,
                            }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* ── ROI TAB ──────────────────────────────────────────────────────── */}
        {appTab === "roi" && <ROICalculator />}

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
          <span>AWS Amplify Gen2 · Bedrock · Claude Haiku 4</span>
          <span>Finance AI Enablement Demo</span>
        </div>
      </div>
    </>
  );
}
