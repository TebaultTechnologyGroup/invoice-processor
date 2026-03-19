import React, { useState, useMemo } from "react";

const fmt = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
const fmtN = (n: number) => new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (n: number) => string;
  onChange: (n: number) => void;
  hint?: string;
}

const Slider: React.FC<SliderProps> = ({ label, value, min, max, step, format, onChange, hint }) => (
  <div style={{ marginBottom: 20 }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a", fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: "#1a1916" }}>{format(value)}</span>
    </div>
    <input type="range" min={min} max={max} step={step} value={value}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: "100%", accentColor: "#1a1916" }} />
    {hint && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", marginTop: 3 }}>{hint}</div>}
  </div>
);

const MetricCard: React.FC<{ label: string; value: string; sub?: string; highlight?: boolean; color?: string }> = ({ label, value, sub, highlight, color }) => (
  <div style={{
    background: highlight ? "#1a1916" : "#fff",
    border: `1px solid ${highlight ? "#1a1916" : "#e2e0d8"}`,
    borderRadius: 14, padding: "20px 18px",
    transition: "all .2s",
  }}>
    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: highlight ? "#aaa9a1" : "#888780", marginBottom: 8 }}>{label}</div>
    <div style={{ fontFamily: "'Fraunces', serif", fontSize: 26, fontWeight: 900, color: color ?? (highlight ? "#f5f2eb" : "#1a1916"), letterSpacing: "-0.02em", lineHeight: 1 }}>{value}</div>
    {sub && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: highlight ? "#888780" : "#aaa9a1", marginTop: 6, lineHeight: 1.4 }}>{sub}</div>}
  </div>
);

// Simple bar chart drawn with divs
const BarChart: React.FC<{ months: { label: string; cumulative: number; color: string }[]; maxVal: number }> = ({ months, maxVal }) => (
  <div style={{ display: "flex", alignItems: "flex-end", gap: 6, height: 120, paddingBottom: 24, position: "relative" }}>
    <div style={{ position: "absolute", bottom: 24, left: 0, right: 0, borderTop: "1px dashed #d4c9b0" }} />
    {months.map((m, i) => (
      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
        <div style={{
          width: "100%", borderRadius: "4px 4px 0 0",
          height: `${Math.max(2, Math.abs(m.cumulative) / maxVal * 100)}px`,
          background: m.color,
          alignSelf: m.cumulative >= 0 ? "flex-end" : "flex-start",
          marginTop: m.cumulative >= 0 ? "auto" : 0,
          transition: "height .4s ease",
        }} />
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, color: "#aaa9a1", position: "absolute", bottom: 6 }}>{m.label}</span>
      </div>
    ))}
  </div>
);

const PHASES = [
  { name: "Phase 1", focus: "AP invoice processing", months: "Months 1–2", multiplier: 1.0 },
  { name: "Phase 2", focus: "Month-end close automation", months: "Months 3–4", multiplier: 1.8 },
  { name: "Phase 3", focus: "Budget variance & FP&A reporting", months: "Months 5–6", multiplier: 2.6 },
  { name: "Phase 4", focus: "Cash flow forecasting & audit prep", months: "Months 7–8", multiplier: 3.4 },
];

export const ROICalculator: React.FC = () => {
  const [invoicesPerMonth, setInvoicesPerMonth]   = useState(500);
  const [minutesPerInvoice, setMinutesPerInvoice] = useState(25);
  const [analystSalary, setAnalystSalary]         = useState(75000);
  const [analystCount, setAnalystCount]           = useState(3);
  const [errorRate, setErrorRate]                 = useState(4);
  const [avgInvoiceValue, setAvgInvoiceValue]     = useState(8500);
  const [implementationCost, setImplementationCost] = useState(85000);
  const [aiCostPerMonth, setAiCostPerMonth]       = useState(2200);

  const roi = useMemo(() => {
    const hourlyRate        = analystSalary / 2080;
    const hoursPerMonth     = (invoicesPerMonth * minutesPerInvoice) / 60;
    const laborCostPerMonth = hoursPerMonth * hourlyRate;

    // AI reduces processing time by ~90%
    const aiMinutesPerInvoice = minutesPerInvoice * 0.10;
    const aiHoursPerMonth     = (invoicesPerMonth * aiMinutesPerInvoice) / 60;
    const aiLaborCost         = aiHoursPerMonth * hourlyRate;
    const laborSavingsPerMonth = laborCostPerMonth - aiLaborCost;

    // Error cost savings — errors cost ~2.5% of invoice value to resolve
    const errorsPerMonth      = invoicesPerMonth * (errorRate / 100);
    const errorCostPerMonth   = errorsPerMonth * avgInvoiceValue * 0.025;
    const aiErrorRate         = errorRate * 0.15; // AI reduces errors by 85%
    const aiErrorCost         = invoicesPerMonth * (aiErrorRate / 100) * avgInvoiceValue * 0.025;
    const errorSavingsPerMonth = errorCostPerMonth - aiErrorCost;

    // Analyst capacity freed (FTEs)
    const hoursSaved        = hoursPerMonth - aiHoursPerMonth;
    const fteFreed          = hoursSaved / (2080 / 12);

    const totalSavingsPerMonth = laborSavingsPerMonth + errorSavingsPerMonth;
    const netSavingsPerMonth   = totalSavingsPerMonth - aiCostPerMonth;

    // Payback period
    const paybackMonths = implementationCost / netSavingsPerMonth;

    // Year 1 ROI
    const year1Savings = netSavingsPerMonth * 12 - implementationCost;
    const year1ROI     = (year1Savings / implementationCost) * 100;

    // 12-month cumulative chart data
    const chartMonths = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const cumSavings = netSavingsPerMonth * month - implementationCost;
      return {
        label: `M${month}`,
        cumulative: cumSavings,
        color: cumSavings >= 0 ? "#27ae60" : "#e74c3c",
      };
    });

    return {
      laborCostPerMonth, laborSavingsPerMonth, errorSavingsPerMonth,
      totalSavingsPerMonth, netSavingsPerMonth,
      fteFreed, paybackMonths, year1ROI, year1Savings,
      hoursPerMonth, aiHoursPerMonth, chartMonths,
      annualSavings: netSavingsPerMonth * 12,
    };
  }, [invoicesPerMonth, minutesPerInvoice, analystSalary, analystCount, errorRate, avgInvoiceValue, implementationCost, aiCostPerMonth]);

  const maxChartVal = Math.max(...roi.chartMonths.map(m => Math.abs(m.cumulative)));

  return (
    <div>
      {/* Hero statement */}
      <div style={{ background: "#1a1916", borderRadius: 16, padding: "28px 32px", marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#888780", marginBottom: 10 }}>
          What you just saw — at scale
        </div>
        <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, fontWeight: 900, color: "#f5f2eb", lineHeight: 1.35, marginBottom: 12 }}>
          Three AI agents processed an invoice in under 30 seconds. Your team currently spends{" "}
          <span style={{ color: "#FAC775" }}>{fmtN(Math.round(roi.hoursPerMonth))} hours/month</span>{" "}
          doing this manually.
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: "#888780", lineHeight: 1.6 }}>
          This demo represents Phase 1 of a four-phase Finance AI enablement program. Adjust the inputs below
          to model your organization's specific opportunity.
        </div>
      </div>

      {/* Two column layout: inputs left, metrics right */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, marginBottom: 28 }}>

        {/* ── Inputs ── */}
        <div style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 16, padding: "24px 24px" }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 20 }}>
            Your organization
          </div>

          <Slider label="Invoices processed / month" value={invoicesPerMonth} min={50} max={5000} step={50}
            format={n => fmtN(n)} onChange={setInvoicesPerMonth} hint="Total AP invoices received monthly" />
          <Slider label="Avg. manual processing time" value={minutesPerInvoice} min={5} max={60} step={1}
            format={n => `${n} min`} onChange={setMinutesPerInvoice} hint="Per invoice: data entry, matching, approval routing" />
          <Slider label="AP analyst salary" value={analystSalary} min={45000} max={130000} step={5000}
            format={fmt} onChange={setAnalystSalary} hint="Fully-loaded annual cost per analyst" />
          <Slider label="Current invoice error rate" value={errorRate} min={1} max={15} step={0.5}
            format={n => `${n}%`} onChange={setErrorRate} hint="Invoices requiring rework or dispute resolution" />
          <Slider label="Average invoice value" value={avgInvoiceValue} min={500} max={50000} step={500}
            format={fmt} onChange={setAvgInvoiceValue} hint="Used to calculate error resolution cost" />

          <div style={{ borderTop: "1px solid #f0ede5", paddingTop: 20, marginTop: 4 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 16 }}>
              Implementation
            </div>
            <Slider label="One-time implementation cost" value={implementationCost} min={20000} max={250000} step={5000}
              format={fmt} onChange={setImplementationCost} hint="Development, integration, testing, training" />
            <Slider label="Monthly AI operating cost" value={aiCostPerMonth} min={500} max={10000} step={100}
              format={fmt} onChange={setAiCostPerMonth} hint="Bedrock API usage + infrastructure" />
          </div>
        </div>

        {/* ── Metrics ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <MetricCard label="Monthly net savings" value={fmt(roi.netSavingsPerMonth)} sub="After AI operating costs" highlight />
            <MetricCard label="Payback period" value={`${roi.paybackMonths < 1 ? "<1" : Math.ceil(roi.paybackMonths)} mo`} sub="Implementation cost recovered" color={roi.paybackMonths <= 6 ? "#27ae60" : roi.paybackMonths <= 12 ? "#e67e22" : "#c0392b"} />
            <MetricCard label="Year 1 ROI" value={`${Math.round(roi.year1ROI)}%`} sub="Net return on investment" color={roi.year1ROI > 0 ? "#27ae60" : "#c0392b"} />
            <MetricCard label="Analyst hours freed" value={`${fmtN(Math.round(roi.hoursPerMonth - roi.aiHoursPerMonth))} hrs`} sub="Per month, redirected to analysis" />
          </div>

          {/* Savings breakdown */}
          <div style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 14 }}>
              Monthly savings breakdown
            </div>
            {[
              { label: "Labor time savings", value: roi.laborSavingsPerMonth, pct: roi.laborSavingsPerMonth / roi.totalSavingsPerMonth },
              { label: "Error reduction savings", value: roi.errorSavingsPerMonth, pct: roi.errorSavingsPerMonth / roi.totalSavingsPerMonth },
            ].map(row => (
              <div key={row.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a" }}>{row.label}</span>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1916" }}>{fmt(row.value)}</span>
                </div>
                <div style={{ height: 6, background: "#f0ede5", borderRadius: 99 }}>
                  <div style={{ height: "100%", width: `${Math.round(row.pct * 100)}%`, background: "#1a1916", borderRadius: 99, transition: "width .4s ease" }} />
                </div>
              </div>
            ))}
            <div style={{ borderTop: "1px solid #f0ede5", marginTop: 12, paddingTop: 10, display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888780" }}>AI operating cost</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#c0392b" }}>−{fmt(aiCostPerMonth)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "#1a1916" }}>Net monthly savings</span>
              <span style={{ fontFamily: "'Fraunces', serif", fontSize: 16, fontWeight: 700, color: "#27ae60" }}>{fmt(roi.netSavingsPerMonth)}</span>
            </div>
          </div>

          {/* 12-month chart */}
          <div style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 14, padding: "18px 20px" }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 4 }}>
              12-month cumulative return
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", marginBottom: 12 }}>
              Green = payback achieved · Red = investment outstanding
            </div>
            <BarChart months={roi.chartMonths} maxVal={maxChartVal} />
          </div>
        </div>
      </div>

      {/* Phase roadmap */}
      <div style={{ background: "#fff", border: "1px solid #e2e0d8", borderRadius: 16, padding: "24px 28px", marginBottom: 28 }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 6 }}>
          Four-phase Finance AI roadmap
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888780", marginBottom: 20 }}>
          Phase 1 savings compound as each phase adds additional value on top of prior work.
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
          {PHASES.map((phase, i) => {
            const phaseSavings = roi.netSavingsPerMonth * phase.multiplier;
            const isFirst = i === 0;
            return (
              <div key={phase.name} style={{
                border: `1px solid ${isFirst ? "#1a1916" : "#e2e0d8"}`,
                borderRadius: 12, padding: "16px 14px",
                background: isFirst ? "#1a1916" : "#faf9f6",
              }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: isFirst ? "#888780" : "#aaa9a1", marginBottom: 4 }}>
                  {phase.name}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: isFirst ? "#f5f2eb" : "#1a1916", marginBottom: 2 }}>
                  {phase.focus}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: isFirst ? "#888780" : "#aaa9a1", marginBottom: 12 }}>
                  {phase.months}
                </div>
                <div style={{ fontFamily: "'Fraunces', serif", fontSize: 18, fontWeight: 700, color: isFirst ? "#FAC775" : "#27ae60" }}>
                  {fmt(phaseSavings)}<span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 400, color: isFirst ? "#888780" : "#aaa9a1" }}>/mo</span>
                </div>
                {!isFirst && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", marginTop: 2 }}>
                    +{Math.round((phase.multiplier - 1) * 100)}% vs Phase 1
                  </div>
                )}
                {isFirst && (
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#888780", marginTop: 2 }}>
                    ← This demo
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assumptions footer */}
      <div style={{ background: "#faf9f6", border: "1px solid #e2e0d8", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#888780", marginBottom: 8 }}>
          Model assumptions
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px 24px" }}>
          {[
            "AI reduces processing time by 90% (validated benchmark)",
            "AI reduces invoice error rate by 85%",
            "Error resolution cost = 2.5% of invoice value",
            "Analyst utilization: 2,080 hrs/year fully loaded",
            "Phase savings multiply as workflows compound",
            "Implementation cost is one-time; savings are recurring",
          ].map((a, i) => (
            <div key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", display: "flex", gap: 6, padding: "3px 0" }}>
              <span style={{ color: "#d4c9b0", flexShrink: 0 }}>·</span>{a}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
