import React from "react";
import { motion } from "framer-motion";
import { ROSTER } from "../../data/roster";
import type { Position } from "../../types/squad";

interface FormationDiagramProps {
  selectedIds: string[];
}

const POSITION_ORDER: Position[] = ["GOALKEEPER", "DEFENDER", "FORWARD", "UTILITY"];

const POSITION_Y: Record<Position, number> = {
  GOALKEEPER: 85,
  DEFENDER:   65,
  FORWARD:    42,
  UTILITY:    20,
};

const POSITION_COLORS: Record<Position, { dot: string; label: string; text: string }> = {
  GOALKEEPER: { dot: "#f59e0b", label: "GK",  text: "text-amber-400" },
  DEFENDER:   { dot: "#38bdf8", label: "DEF", text: "text-sky-400" },
  FORWARD:    { dot: "#34d399", label: "FWD", text: "text-emerald-400" },
  UTILITY:    { dot: "#c084fc", label: "UTL", text: "text-purple-400" },
};

export const FormationDiagram: React.FC<FormationDiagramProps> = ({
  selectedIds,
}) => {
  const selectedSet = new Set(selectedIds);
  const selectedPlayers = ROSTER.filter((p) => selectedSet.has(p.id));

  const byPosition = POSITION_ORDER.reduce<Record<Position, typeof ROSTER>>((acc, pos) => {
    acc[pos] = selectedPlayers.filter((p) => p.position === pos);
    return acc;
  }, { GOALKEEPER: [], DEFENDER: [], FORWARD: [], UTILITY: [] });

  return (
    <div className="w-full bg-[#0a0f0d] p-4 rounded-xl border border-white/10">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-ui font-semibold text-chalk/70 uppercase tracking-wider">
          Formation View
        </span>
        <div className="flex items-center gap-3">
          {POSITION_ORDER.map((pos) => (
            <div key={pos} className="flex items-center gap-1">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: POSITION_COLORS[pos].dot }}
              />
              <span className="text-[10px] font-ui text-chalk/40">
                {POSITION_COLORS[pos].label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Clean Pitch Container */}
      <div className="relative w-full rounded-lg overflow-hidden border border-white/10 bg-[#071109]" style={{ paddingBottom: "60%" }}>
        {/* Pitch Lines SVG */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 60"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <rect x="4" y="3" width="92" height="54" rx="1" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <line x1="50" y1="3" x2="50" y2="57" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <circle cx="50" cy="30" r="8" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <rect x="4" y="20" width="10" height="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          <rect x="86" y="20" width="10" height="20" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
        </svg>

        {/* Player markers */}
        {POSITION_ORDER.map((pos) => {
          const players = byPosition[pos];
          if (players.length === 0) return null;

          return players.map((player, i) => {
            const count = players.length;
            const xSpacing = Math.min(22, 60 / (count + 1));
            const xStart = 50 - ((count - 1) * xSpacing) / 2;
            const x = xStart + i * xSpacing;
            const y = POSITION_Y[pos];
            const cfg = POSITION_COLORS[pos];

            return (
              <motion.div
                key={player.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none"
                style={{ left: `${x}%`, top: `${y}%` }}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <div
                  className="flex items-center justify-center rounded-full font-mono text-[9px] font-bold border"
                  style={{
                    width: "22px",
                    height: "22px",
                    backgroundColor: "#0d1f14",
                    borderColor: cfg.dot,
                    color: cfg.dot,
                  }}
                >
                  {player.id.replace("S", "")}
                </div>
                <span className="mt-0.5 text-[8px] font-ui text-chalk/80 whitespace-nowrap bg-black/60 px-1 rounded">
                  {player.name.split(" ")[0]}
                </span>
              </motion.div>
            );
          });
        })}

        {selectedPlayers.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-ui text-chalk/30">
              No players selected on field
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
