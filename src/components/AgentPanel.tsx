import React from "react";
import { AgentStatus } from "../types/agents";

interface AgentPanelProps {
  title: string;
  subtitle: string;
  icon: string;
  status: AgentStatus;
  children?: React.ReactNode;
  accentColor: string;
}

export const AgentPanel: React.FC<AgentPanelProps> = ({
  title, subtitle, icon, status, children, accentColor,
}) => {
  const isRunning = status === "running";
  const isComplete = status === "complete";
  const isIdle = status === "idle";

  return (
    <div style={{
      border: `1px solid ${isComplete ? accentColor + "60" : "#e2e0d8"}`,
      borderRadius: 16,
      padding: "24px 28px",
      background: isComplete ? "#fff" : "#faf9f6",
      transition: "all 0.4s ease",
      opacity: isIdle ? 0.45 : 1,
      transform: isComplete ? "translateY(0)" : "translateY(2px)",
      boxShadow: isComplete ? `0 4px 24px ${accentColor}18` : "none",
    }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: isComplete ? accentColor + "18" : "#ede9e0",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22, flexShrink: 0,
          transition: "background 0.4s",
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 600, fontSize: 15,
              color: "#1a1916",
              letterSpacing: "-0.01em",
            }}>{title}</span>
            <StatusBadge status={status} accentColor={accentColor} />
          </div>
          <div style={{
            fontFamily: "'DM Sans', sans-serif",
            fontSize: 13, color: "#888780", marginTop: 2,
          }}>{subtitle}</div>
        </div>
      </div>

      {/* Running pulse */}
      {isRunning && (
        <div style={{ display: "flex", gap: 6, alignItems: "center", padding: "10px 0" }}>
          {[0, 1, 2].map(i => (
            <div key={i} style={{
              width: 8, height: 8, borderRadius: "50%",
              background: accentColor,
              animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }} />
          ))}
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: "#888780", marginLeft: 4 }}>
            Agent running…
          </span>
        </div>
      )}

      {/* Content */}
      {isComplete && children && (
        <div style={{ animation: "fadeSlideIn 0.35s ease forwards" }}>
          {children}
        </div>
      )}
    </div>
  );
};

const StatusBadge: React.FC<{ status: AgentStatus; accentColor: string }> = ({ status, accentColor }) => {
  const config: Record<AgentStatus, { label: string; bg: string; color: string }> = {
    idle:     { label: "Waiting",  bg: "#f0ede5", color: "#888780" },
    running:  { label: "Running",  bg: "#FFF3CD", color: "#856404" },
    complete: { label: "Complete", bg: accentColor + "18", color: accentColor },
    error:    { label: "Error",    bg: "#fde8e8", color: "#c0392b" },
  };
  const c = config[status];
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: "2px 9px",
      borderRadius: 99, background: c.bg, color: c.color,
      fontFamily: "'DM Sans', sans-serif",
      letterSpacing: "0.02em", textTransform: "uppercase",
    }}>{c.label}</span>
  );
};
