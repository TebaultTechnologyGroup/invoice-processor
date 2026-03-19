import React from "react";
import { Invoice } from "../data/fakeData";

interface InvoiceCardProps {
  invoice: Invoice;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);

export const InvoiceCard: React.FC<InvoiceCardProps> = ({ invoice }) => (
  <div style={{
    border: "1px solid #e2e0d8", borderRadius: 16,
    padding: "24px 28px", background: "#fff",
  }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
      <div>
        <div style={{
          fontFamily: "'Fraunces', serif",
          fontSize: 20, fontWeight: 700, color: "#1a1916",
          letterSpacing: "-0.02em",
        }}>{invoice.vendorName}</div>
        <div style={{
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 13, color: "#888780", marginTop: 3,
        }}>
          Invoice #{invoice.invoiceNumber} · {invoice.invoiceDate}
        </div>
      </div>
      <div style={{
        fontFamily: "'Fraunces', serif",
        fontSize: 26, fontWeight: 700, color: "#1a1916",
      }}>{fmt(invoice.amount)}</div>
    </div>

    {/* Line items */}
    <div style={{
      background: "#faf9f6", borderRadius: 10, overflow: "hidden",
      border: "1px solid #ede9e0", marginBottom: 16,
    }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1fr auto auto",
        gap: 8, padding: "9px 14px",
        borderBottom: "1px solid #ede9e0",
      }}>
        {["Description", "Qty", "Total"].map(h => (
          <span key={h} style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 11, fontWeight: 600, color: "#888780",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}>{h}</span>
        ))}
      </div>
      {invoice.lineItems.map((li, i) => (
        <div key={i} style={{
          display: "grid", gridTemplateColumns: "1fr auto auto",
          gap: 8, padding: "9px 14px",
          borderBottom: i < invoice.lineItems.length - 1 ? "1px solid #ede9e0" : "none",
        }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a" }}>{li.description}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888780", textAlign: "right" }}>{li.qty}</span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a", textAlign: "right" }}>{fmt(li.total)}</span>
        </div>
      ))}
    </div>

    {/* Meta row */}
    <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
      {[
        { label: "PO Reference", value: invoice.poReference ?? "None" },
        { label: "Due Date", value: invoice.dueDate },
        { label: "Submitted By", value: invoice.submittedBy },
        { label: "Vendor ID", value: invoice.vendorId },
      ].map(m => (
        <div key={m.label}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: "#aaa9a1", textTransform: "uppercase", letterSpacing: "0.05em" }}>{m.label}</div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#3d3d3a", marginTop: 2, fontWeight: 500 }}>{m.value}</div>
        </div>
      ))}
    </div>
  </div>
);
