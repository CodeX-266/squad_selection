import React, { useState } from "react";
import { motion } from "framer-motion";
import { ROSTER } from "../../data/roster";
import { useSquadStore } from "../../store/squadStore";
import type { Position } from "../../types/squad";

const POSITION_STYLES: Record<Position, { label: string; bg: string; text: string; border: string }> = {
  GOALKEEPER: { label: "Goalkeeper", bg: "rgba(245, 158, 11, 0.12)", text: "#fbbf24", border: "rgba(245, 158, 11, 0.3)" },
  DEFENDER:   { label: "Defender",   bg: "rgba(56, 189, 248, 0.12)", text: "#38bdf8", border: "rgba(56, 189, 248, 0.3)" },
  FORWARD:    { label: "Forward",    bg: "rgba(52, 211, 153, 0.12)", text: "#34d399", border: "rgba(52, 211, 153, 0.3)" },
  UTILITY:    { label: "Utility",    bg: "rgba(192, 132, 252, 0.12)",text: "#c084fc", border: "rgba(192, 132, 252, 0.3)" },
};

export const RosterTable: React.FC = () => {
  const { selectedIds, togglePlayer } = useSquadStore();
  const [filter, setFilter] = useState<"ALL" | "SELECTED" | "AVAILABLE">("ALL");
  const selectedSet = new Set(selectedIds);

  const filteredRoster = ROSTER.filter((p) => {
    if (filter === "SELECTED") return selectedSet.has(p.id);
    if (filter === "AVAILABLE") return p.availability === "AVAILABLE";
    return true;
  });

  return (
    <div
      style={{
        background: "#0d1310",
        borderRadius: "16px",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        overflow: "hidden",
        boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
      }}
    >
      {/* Table Header / Filter Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "20px 24px",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(255, 255, 255, 0.02)",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        <div>
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#f8fafc", margin: 0 }}>
            Roster Selection
          </h3>
          <p style={{ fontSize: "13px", color: "rgba(248, 250, 252, 0.5)", margin: "4px 0 0 0" }}>
            Select 7 players to build your matchday roster
          </p>
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: "6px", background: "rgba(0,0,0,0.4)", padding: "4px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.06)" }}>
          {(["ALL", "SELECTED", "AVAILABLE"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: "6px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: filter === f ? "600" : "400",
                color: filter === f ? "#ffffff" : "rgba(248, 250, 252, 0.5)",
                background: filter === f ? "rgba(255, 255, 255, 0.12)" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {f === "ALL" ? `All (${ROSTER.length})` : f === "SELECTED" ? `Selected (${selectedIds.length})` : "Available"}
            </button>
          ))}
        </div>
      </div>

      {/* Table Header Row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "50px 1.5fr 1fr 1fr 1fr",
          padding: "14px 24px",
          background: "rgba(0, 0, 0, 0.2)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          fontSize: "11px",
          fontWeight: "700",
          color: "rgba(248, 250, 252, 0.4)",
          textTransform: "uppercase",
          letterSpacing: "0.08em",
        }}
      >
        <div style={{ textAlign: "center" }}>Pick</div>
        <div>Player</div>
        <div>Position</div>
        <div>Cohort</div>
        <div>Status</div>
      </div>

      {/* Roster Rows */}
      <div style={{ display: "flex", flexDirection: "column" }}>
        {filteredRoster.map((player) => {
          const isSelected = selectedSet.has(player.id);
          const isUnavailable = player.availability === "UNAVAILABLE";
          const pos = POSITION_STYLES[player.position];

          return (
            <div
              key={player.id}
              onClick={() => togglePlayer(player.id)}
              style={{
                display: "grid",
                gridTemplateColumns: "50px 1.5fr 1fr 1fr 1fr",
                alignItems: "center",
                padding: "16px 24px",
                borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
                background: isSelected
                  ? isUnavailable
                    ? "rgba(239, 68, 68, 0.08)"
                    : "rgba(16, 185, 129, 0.08)"
                  : "transparent",
                cursor: "pointer",
                transition: "background 0.15s",
              }}
            >
              {/* Checkbox */}
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => togglePlayer(player.id)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: "18px",
                    height: "18px",
                    cursor: "pointer",
                    accentColor: isUnavailable ? "#ef4444" : "#10b981",
                  }}
                  aria-label={`Select ${player.name}`}
                />
              </div>

              {/* Player Name & ID */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "14px", fontWeight: "600", color: "#f8fafc" }}>
                  {player.name}
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    fontFamily: "monospace",
                    padding: "2px 6px",
                    borderRadius: "4px",
                    background: "rgba(255, 255, 255, 0.06)",
                    color: "rgba(248, 250, 252, 0.5)",
                  }}
                >
                  {player.id}
                </span>
              </div>

              {/* Position Badge */}
              <div>
                <span
                  style={{
                    display: "inline-block",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "12px",
                    fontWeight: "500",
                    background: pos.bg,
                    color: pos.text,
                    border: `1px solid ${pos.border}`,
                  }}
                >
                  {pos.label}
                </span>
              </div>

              {/* Cohort */}
              <div style={{ fontSize: "13px", color: "rgba(248, 250, 252, 0.6)" }}>
                {player.cohort.replace("_", " ")}
              </div>

              {/* Status */}
              <div>
                {isUnavailable ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#f87171",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ef4444" }} />
                    Unavailable
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: "500",
                      color: "#34d399",
                    }}
                  >
                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981" }} />
                    Available
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {filteredRoster.length === 0 && (
          <div style={{ padding: "48px 24px", textAlign: "center", color: "rgba(248, 250, 252, 0.4)", fontSize: "13px" }}>
            No players match the selected filter.
          </div>
        )}
      </div>
    </div>
  );
};
