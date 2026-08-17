import React from "react";
import type { CountSummary } from "../../types/squad";

interface CountsSummaryProps {
  counts: CountSummary;
}

export const CountsSummary: React.FC<CountsSummaryProps> = ({ counts }) => {
  const isSquadSizeValid = counts.total === 7;
  const isGkValid = counts.byPosition.GOALKEEPER === 1;
  const exceedsY2 = counts.byCohort.YEAR_2 > 2;

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
        gap: "12px",
        width: "100%",
      }}
    >
      {/* Squad Total */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: isSquadSizeValid ? "rgba(16, 185, 129, 0.08)" : "rgba(255, 255, 255, 0.03)",
          border: isSquadSizeValid ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Squad Size
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: isSquadSizeValid ? "#34d399" : "#f8fafc" }}>
            {counts.total}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.4)" }}>/ 7 req</span>
        </div>
      </div>

      {/* GK */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: counts.byPosition.GOALKEEPER > 0 && !isGkValid ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.03)",
          border: counts.byPosition.GOALKEEPER > 0 && !isGkValid ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Goalkeeper
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: counts.byPosition.GOALKEEPER > 0 && !isGkValid ? "#f87171" : "#f8fafc" }}>
            {counts.byPosition.GOALKEEPER}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.4)" }}>/ 1 req</span>
        </div>
      </div>

      {/* DEF */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Defenders
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc" }}>
            {counts.byPosition.DEFENDER}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.4)" }}>/ min 2</span>
        </div>
      </div>

      {/* FWD */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Forwards
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc" }}>
            {counts.byPosition.FORWARD}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.4)" }}>/ min 2</span>
        </div>
      </div>

      {/* UTL */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Utility
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc" }}>
            {counts.byPosition.UTILITY}
          </span>
        </div>
      </div>

      {/* Year 2 */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: exceedsY2 ? "rgba(239, 68, 68, 0.08)" : "rgba(255, 255, 255, 0.03)",
          border: exceedsY2 ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Year 2
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: exceedsY2 ? "#f87171" : "#f8fafc" }}>
            {counts.byCohort.YEAR_2}
          </span>
          <span style={{ fontSize: "12px", color: "rgba(248, 250, 252, 0.4)" }}>/ max 2</span>
        </div>
      </div>

      {/* Year 3 */}
      <div
        style={{
          padding: "14px 18px",
          borderRadius: "12px",
          background: "rgba(255, 255, 255, 0.03)",
          border: "1px solid rgba(255, 255, 255, 0.08)",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <span style={{ fontSize: "11px", color: "rgba(248, 250, 252, 0.5)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: "600" }}>
          Year 3
        </span>
        <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
          <span style={{ fontSize: "22px", fontWeight: "700", color: "#f8fafc" }}>
            {counts.byCohort.YEAR_3}
          </span>
        </div>
      </div>
    </div>
  );
};
