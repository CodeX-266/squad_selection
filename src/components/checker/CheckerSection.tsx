import React, { useMemo, useState } from "react";
import { useSquadStore } from "../../store/squadStore";
import { validateSquad } from "../../engine/validateSquad";
import { ROSTER } from "../../data/roster";
import type { Position } from "../../types/squad";

const VIOLATION_TITLES: Record<string, string> = {
  INVALID_SELECTION_REFERENCE: "Invalid Player Selection",
  SQUAD_SIZE_MUST_BE_7: "Incorrect Squad Size",
  GOALKEEPER_COUNT_MUST_BE_1: "Goalkeeper Requirement",
  MINIMUM_DEFENDERS_NOT_MET: "Insufficient Defenders",
  MINIMUM_FORWARDS_NOT_MET: "Insufficient Forwards",
  PLAYER_UNAVAILABLE: "Player Unavailable",
  COHORT_LIMIT_EXCEEDED: "Cohort Limit Exceeded",
};

const POSITION_STYLES: Record<Position, { label: string; badge: string; nodeClass: string }> = {
  GOALKEEPER: {
    label: "GK",
    badge: "bg-[#a7c4b5]/10 text-[#a7c4b5] border-[#a7c4b5]/30",
    nodeClass: "node-gk",
  },
  DEFENDER: {
    label: "DEF",
    badge: "bg-[#4a5d54]/10 text-[#4a5d54] border-[#4a5d54]/30",
    nodeClass: "node-def",
  },
  FORWARD: {
    label: "FWD",
    badge: "bg-[#d4a373]/10 text-[#d4a373] border-[#d4a373]/30",
    nodeClass: "node-fwd",
  },
  UTILITY: {
    label: "UTI",
    badge: "bg-[#9aa0a7]/10 text-[#9aa0a7] border-[#9aa0a7]/30",
    nodeClass: "node-uti",
  },
};

export const CheckerSection: React.FC = () => {
  const { selectedIds, reset, loadSample, setValidated, togglePlayer } = useSquadStore();
  const [activeTab, setActiveTab] = useState<"selected" | "bench">("selected");
  const [searchQuery, setSearchQuery] = useState("");

  const result = useMemo(() => validateSquad(ROSTER, selectedIds), [selectedIds]);

  // Derived squad stats
  const selectedPlayers = selectedIds
    .map((id) => ROSTER.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => !!p);

  const numGk = selectedPlayers.filter((p) => p.position === "GOALKEEPER").length;
  const numDef = selectedPlayers.filter((p) => p.position === "DEFENDER").length;
  const numFwd = selectedPlayers.filter((p) => p.position === "FORWARD").length;
  const numY2 = selectedPlayers.filter((p) => p.cohort === "YEAR_2").length;

  const filteredBench = ROSTER.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.position.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const squadSizeOk = selectedPlayers.length === 7;
  const gkOk = numGk === 1;
  const defOk = numDef >= 2;
  const fwdOk = numFwd >= 2;
  const y2Ok = numY2 <= 2;

  return (
    <div className="bg-[#121414] text-[#e2e2e2] min-h-screen flex flex-col w-full selection:bg-[#a7c4b5]/20">
      {/* ── Top Header Bar ────────────────────────────────────────── */}
      <header className="w-full sticky top-0 z-50 border-b border-white/5 bg-[#121414]/80 backdrop-blur-md">
        <div className="flex justify-between items-center px-6 lg:px-12 py-4 w-full max-w-[1600px] mx-auto">
          <div className="flex items-center gap-4">
            <span className="font-extrabold text-2xl lg:text-3xl text-[#a7c4b5] tracking-tight select-none">
              MATCHDAY
            </span>
            <span className="font-mono text-[10px] font-bold bg-white/5 px-2 py-1 rounded text-[#a7c4b5] border border-white/10 tracking-widest">
              COACH DESK
            </span>
          </div>

          <div className="flex-1 max-w-md mx-8 relative hidden md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#c1c8c3] text-[20px]">
              search
            </span>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#1a1d1c] border-0 border-b border-transparent focus:border-[#a7c4b5] text-[#e2e2e2] pl-10 pr-4 py-2 text-sm placeholder:text-[#c1c8c3]/40 outline-none transition-colors rounded-t"
              placeholder="Search player, position..."
              type="text"
            />
          </div>

          <div className="flex items-center gap-6">
            <button
              onClick={loadSample}
              title="Load demo scenario with unavailable player S08"
              className="flex items-center gap-2 text-[#c1c8c3] hover:text-[#a7c4b5] transition-colors duration-200 font-mono text-xs uppercase tracking-widest cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">settings</span>
              Load Sample (S08)
            </button>
            <button
              onClick={reset}
              title="Reset squad"
              className="flex items-center gap-2 text-[#c1c8c3] hover:text-[#a7c4b5] transition-colors duration-200 font-mono text-xs uppercase tracking-widest cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">refresh</span>
              Reset
            </button>
            <img
              alt="Head Coach"
              className="w-8 h-8 rounded-full border border-white/10 object-cover ml-2"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR7i9BdK0R2ILyYQS9Oh4Hrmho-JkVMslzoVFUv_M25COMEPxZiFtTFMptm4fKo3GobjydASN50jfIRUvslDdDe-2u4aPY7AbshPEYSnW1Q-yEUJnXHBNUqlpNQBdsbsmPy2Amgu14VSNpwzdB0msWQGoTUKAre4EB82LiNKWkMEGJIG07JgNOhDyocpx7CcA2Nc5tVSw0n5mqbd49LMgXDKxq0TfAj-UUeifyB7n9iq5_oIbW-vlVLA"
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Side Nav ──────────────────────────────────────────────── */}
        <aside className="w-64 flex-shrink-0 bg-[#1a1d1c] border-r border-white/5 flex flex-col h-full py-6 z-40 relative">
          <div className="px-6 mb-8 flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#121414] flex items-center justify-center border border-white/10 text-[#a7c4b5] font-bold text-lg">
              FC
            </div>
            <div>
              <h2 className="font-mono text-xs font-bold text-[#e2e2e2] tracking-widest">Squad Engine</h2>
              <p className="font-mono text-[10px] text-[#c1c8c3] mt-1">Tournament 2024</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1 px-4">
            <button
              onClick={() => setActiveTab("selected")}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-r transition-all cursor-pointer ${activeTab === "selected"
                  ? "text-[#a7c4b5] bg-white/5 border-l-2 border-[#a7c4b5]"
                  : "text-[#c1c8c3] hover:bg-white/5 hover:text-[#e2e2e2]"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">grid_view</span>
                <span className="font-mono text-xs uppercase tracking-widest">Squad Builder</span>
              </div>
            </button>

            <button
              onClick={() => setActiveTab("bench")}
              className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-r transition-all cursor-pointer ${activeTab === "bench"
                  ? "text-[#a7c4b5] bg-white/5 border-l-2 border-[#a7c4b5]"
                  : "text-[#c1c8c3] hover:bg-white/5 hover:text-[#e2e2e2]"
                }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-[20px]">groups</span>
                <span className="font-mono text-xs uppercase tracking-widest">Roster Bench</span>
              </div>
              <span className="font-mono text-[10px] text-[#c1c8c3]">{ROSTER.length}</span>
            </button>
          </nav>

          <div className="px-6 mt-auto pt-6">
            <div className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest mb-4">
              Tournament Rules
            </div>
            <ul className="space-y-3 font-mono text-xs text-[#e2e2e2]">
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${squadSizeOk ? "bg-[#a7c4b5]" : "bg-[#d4a373]"}`} />
                Exactly 7 Players
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${gkOk ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}`} />
                Exactly 1 Goalkeeper
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${defOk ? "bg-[#a7c4b5]" : "bg-[#d4a373]"}`} />
                Min 2 Defenders
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${fwdOk ? "bg-[#a7c4b5]" : "bg-[#d4a373]"}`} />
                Min 2 Forwards
              </li>
              <li className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${y2Ok ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}`} />
                Max 2 Year-2 Cohort
              </li>
            </ul>
          </div>
        </aside>

        {/* ── Main Content ──────────────────────────────────────────── */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 bg-[#121414] flex flex-col gap-8">
          {/* ── Metrics Strip ─────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {/* Squad Size */}
            <div className="bg-[#1a1d1c] rounded-lg border border-white/[0.08] p-4 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest">Squad Size</span>
                <span className="material-symbols-outlined text-[16px] text-[#c1c8c3]">groups</span>
              </div>
              <div className="flex items-baseline gap-2 mb-2">
                <span className={`font-extrabold text-3xl ${squadSizeOk ? "text-[#a7c4b5]" : "text-[#d4a373]"}`}>
                  {selectedPlayers.length}
                </span>
                <span className="font-mono text-xs text-[#c1c8c3]">/ 7</span>
              </div>
              <div className="flex mt-auto">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`progress-segment ${i < selectedPlayers.length ? (squadSizeOk ? "filled" : "filled-warn") : ""
                      }`}
                  />
                ))}
              </div>
            </div>

            {/* Goalkeepers */}
            <div className="bg-[#1a1d1c] rounded-lg border border-white/[0.08] p-4 flex flex-col relative overflow-hidden">
              <div className={`absolute bottom-0 left-0 w-full h-1 ${gkOk ? "bg-[#a7c4b5]/20" : "bg-[#e26d6d]/20"}`} />
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${gkOk ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}`}
                style={{ width: `${Math.min(numGk * 100, 100)}%` }}
              />
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest">Goalkeepers</span>
                <span className={`material-symbols-outlined text-[16px] ${gkOk ? "text-[#a7c4b5]" : "text-[#e26d6d]"}`}>
                  accessibility_new
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-extrabold text-3xl ${gkOk ? "text-[#a7c4b5]" : "text-[#e26d6d]"}`}>{numGk}</span>
                <span className="font-mono text-xs text-[#c1c8c3]">/ 1 Required</span>
              </div>
            </div>

            {/* Defenders */}
            <div className="bg-[#1a1d1c] rounded-lg border border-white/[0.08] p-4 flex flex-col relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#4a5d54]/20" />
              <div
                className="absolute bottom-0 left-0 h-1 bg-[#4a5d54] transition-all duration-300"
                style={{ width: `${Math.min((numDef / 2) * 100, 100)}%` }}
              />
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest">Defenders</span>
                <span className="material-symbols-outlined text-[16px] text-[#4a5d54]">shield</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-extrabold text-3xl ${defOk ? "text-[#e2e2e2]" : "text-[#d4a373]"}`}>
                  {numDef}
                </span>
                <span className="font-mono text-xs text-[#c1c8c3]">/ Min 2</span>
              </div>
            </div>

            {/* Forwards */}
            <div className="bg-[#1a1d1c] rounded-lg border border-white/[0.08] p-4 flex flex-col relative overflow-hidden">
              <div className="absolute bottom-0 left-0 w-full h-1 bg-[#d4a373]/20" />
              <div
                className="absolute bottom-0 left-0 h-1 bg-[#d4a373] transition-all duration-300"
                style={{ width: `${Math.min((numFwd / 2) * 100, 100)}%` }}
              />
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest">Forwards</span>
                <span className="material-symbols-outlined text-[16px] text-[#d4a373]">bolt</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-extrabold text-3xl ${fwdOk ? "text-[#e2e2e2]" : "text-[#d4a373]"}`}>
                  {numFwd}
                </span>
                <span className="font-mono text-xs text-[#c1c8c3]">/ Min 2</span>
              </div>
            </div>

            {/* Y2 Cohort */}
            <div className="bg-[#1a1d1c] rounded-lg border border-white/[0.08] p-4 flex flex-col relative overflow-hidden">
              <div className={`absolute bottom-0 left-0 w-full h-1 ${y2Ok ? "bg-[#a7c4b5]/20" : "bg-[#e26d6d]/20"}`} />
              <div
                className={`absolute bottom-0 left-0 h-1 transition-all duration-300 ${y2Ok ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}`}
                style={{ width: `${Math.min((numY2 / 2) * 100, 100)}%` }}
              />
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[10px] text-[#c1c8c3] uppercase tracking-widest">Y2 Cohort</span>
                <span className={`material-symbols-outlined text-[16px] ${y2Ok ? "text-[#a7c4b5]" : "text-[#e26d6d]"}`}>
                  school
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className={`font-extrabold text-3xl ${y2Ok ? "text-[#e2e2e2]" : "text-[#e26d6d]"}`}>{numY2}</span>
                <span className="font-mono text-xs text-[#c1c8c3]">/ Max 2</span>
              </div>
            </div>
          </div>

          {/* ── Workspace Grid ────────────────────────────────────────── */}
          <div className="grid grid-cols-12 gap-6 flex-1">
            {/* ── Roster Table ──────────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-7 flex flex-col bg-[#1a1c1c] rounded-xl border border-white/[0.08] overflow-hidden">
              <div className="px-6 py-4 flex justify-between items-center border-b border-white/5 bg-[#1a1d1c] flex-wrap gap-2">
                <div className="flex gap-2 font-mono text-xs uppercase tracking-widest">
                  <button
                    onClick={() => setActiveTab("selected")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${activeTab === "selected" ? "text-[#a7c4b5] font-bold bg-[#a7c4b5]/10" : "text-[#c1c8c3] hover:text-[#e2e2e2]"
                      }`}
                  >
                    Selected ({selectedPlayers.length}/7)
                  </button>
                  <button
                    onClick={() => setActiveTab("bench")}
                    className={`px-3 py-1 rounded transition-colors cursor-pointer ${activeTab === "bench" ? "text-[#a7c4b5] font-bold bg-[#a7c4b5]/10" : "text-[#c1c8c3] hover:text-[#e2e2e2]"
                      }`}
                  >
                    Bench Pool ({ROSTER.length})
                  </button>
                </div>
                <div className="flex items-center gap-2 text-[#c1c8c3] font-mono text-[10px]">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  {activeTab === "selected" ? "Click − to bench player" : "Click + to draft player"}
                </div>
              </div>

              <div className="flex-1 overflow-auto p-2">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="font-mono text-[10px] text-[#c1c8c3] uppercase border-b border-white/5 tracking-widest">
                      <th className="p-4 font-normal">ID</th>
                      <th className="p-4 font-normal">Player</th>
                      <th className="p-4 font-normal">Pos</th>
                      <th className="p-4 font-normal">Cohort</th>
                      <th className="p-4 font-normal">Status</th>
                      <th className="p-4 font-normal text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm text-[#e2e2e2]">
                    {activeTab === "selected" ? (
                      <>
                        {selectedPlayers.map((player) => {
                          const pos = POSITION_STYLES[player.position];
                          const isUnavailable = player.availability === "UNAVAILABLE";

                          return (
                            <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                              <td className="p-4 text-[#c1c8c3] font-mono text-xs">{player.id}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-[#121414] border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white/80">
                                    {player.name.split(" ").map((n) => n[0]).join("")}
                                  </div>
                                  <span className="font-semibold text-[#e2e2e2] group-hover:text-[#a7c4b5] transition-colors">
                                    {player.name}
                                  </span>
                                </div>
                              </td>
                              <td className="p-4">
                                <span className={`font-mono text-[10px] px-2 py-1 rounded border ${pos.badge}`}>
                                  {pos.label}
                                </span>
                              </td>
                              <td className="p-4 text-[#c1c8c3] font-mono text-xs">
                                {player.cohort === "YEAR_2" ? "Year-2" : "Year-3"}
                              </td>
                              <td className="p-4 font-mono text-[10px] uppercase tracking-widest">
                                <span className={isUnavailable ? "text-[#e26d6d]" : "text-[#a7c4b5]"}>
                                  {player.availability}
                                </span>
                              </td>
                              <td className="p-4 text-center">
                                <button
                                  onClick={() => togglePlayer(player.id)}
                                  title="Remove from squad"
                                  className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c1c8c3] hover:text-[#e26d6d] hover:border-[#e26d6d] transition-all mx-auto cursor-pointer"
                                >
                                  <span className="material-symbols-outlined text-[16px]">remove</span>
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {Array.from({ length: Math.max(0, 7 - selectedPlayers.length) }).map((_, i) => (
                          <tr key={`empty-${i}`} className="border-b border-dashed border-white/5 opacity-50">
                            <td className="p-4 font-mono text-xs text-white/25">---</td>
                            <td
                              className={`p-4 font-mono text-xs italic ${i === 0 && numGk === 0 ? "text-[#e26d6d] font-bold not-italic" : "text-white/30"
                                }`}
                            >
                              {i === 0 && numGk === 0 ? "Required: Goalkeeper" : "Empty Slot"}
                            </td>
                            <td className="p-4" />
                            <td className="p-4" />
                            <td className="p-4" />
                            <td className="p-4 text-center">
                              <button
                                onClick={() => setActiveTab("bench")}
                                title="Add from bench"
                                className="w-8 h-8 rounded-full border border-[#a7c4b5]/30 text-[#a7c4b5] flex items-center justify-center hover:bg-[#a7c4b5]/15 transition-all mx-auto cursor-pointer"
                              >
                                <span className="material-symbols-outlined text-[16px]">add</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </>
                    ) : (
                      filteredBench.map((player) => {
                        const isSelected = selectedIds.includes(player.id);
                        const pos = POSITION_STYLES[player.position];
                        const isUnavailable = player.availability === "UNAVAILABLE";

                        return (
                          <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                            <td className="p-4 text-[#c1c8c3] font-mono text-xs">{player.id}</td>
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-[#121414] border border-white/10 flex items-center justify-center font-mono text-xs font-bold text-white/80">
                                  {player.name.split(" ").map((n) => n[0]).join("")}
                                </div>
                                <span className="font-semibold text-[#e2e2e2]">{player.name}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <span className={`font-mono text-[10px] px-2 py-1 rounded border ${pos.badge}`}>
                                {pos.label}
                              </span>
                            </td>
                            <td className="p-4 text-[#c1c8c3] font-mono text-xs">
                              {player.cohort === "YEAR_2" ? "Year-2" : "Year-3"}
                            </td>
                            <td className="p-4 font-mono text-[10px] uppercase tracking-widest">
                              <span className={isUnavailable ? "text-[#e26d6d]" : "text-[#a7c4b5]"}>
                                {player.availability}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <button
                                onClick={() => togglePlayer(player.id)}
                                className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all mx-auto cursor-pointer ${isSelected
                                    ? "border-white/10 text-[#c1c8c3] hover:text-[#e26d6d] hover:border-[#e26d6d]"
                                    : "border-[#a7c4b5]/40 text-[#a7c4b5] hover:bg-[#a7c4b5]/15"
                                  }`}
                              >
                                <span className="material-symbols-outlined text-[16px]">
                                  {isSelected ? "remove" : "add"}
                                </span>
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Right Column ──────────────────────────────────────── */}
            <div className="col-span-12 lg:col-span-5 flex flex-col gap-6">
              {/* Constraint Engine */}
              <div className="bg-[#1a1d1c] rounded-xl border border-white/[0.08] p-6 relative overflow-hidden">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-xl text-[#e2e2e2]">Constraint Engine</h3>
                    <p className="font-mono text-xs text-[#c1c8c3] mt-1">Tournament rule validation</p>
                  </div>
                  <span
                    className={`font-mono text-[10px] px-3 py-1.5 rounded-full border flex items-center gap-2 ${result.status === "VALID"
                        ? "bg-[#a7c4b5]/10 text-[#a7c4b5] border-[#a7c4b5]/30"
                        : "bg-[#e26d6d]/10 text-[#e26d6d] border-[#e26d6d]/30"
                      }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${result.status === "VALID" ? "bg-[#a7c4b5] animate-pulse" : "bg-[#e26d6d]"}`} />
                    {result.status === "VALID" ? "VALID SQUAD" : "VIOLATIONS"}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto mb-6">
                  {result.violations.length > 0 ? (
                    result.violations.map((violation, i) => (
                      <div key={i} className="bg-[#e26d6d]/10 border border-[#e26d6d]/25 rounded-lg p-3 flex items-start gap-3">
                        <span className="material-symbols-outlined text-[#e26d6d] text-[18px] mt-0.5">error</span>
                        <div>
                          <div className="font-mono text-xs text-[#e26d6d] font-bold">
                            {VIOLATION_TITLES[violation.code] || violation.code}
                          </div>
                          <p className="text-xs text-[#c1c8c3] mt-1 leading-snug">{violation.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-[#121414]/50 rounded-lg p-4 border border-white/[0.08] flex items-start gap-4">
                      <span className="material-symbols-outlined text-[#a7c4b5] mt-0.5">check_circle</span>
                      <div>
                        <h4 className="font-mono text-xs text-[#a7c4b5] mb-1">Squad Confirmed Valid</h4>
                        <p className="text-sm text-[#c1c8c3]">All 6 tournament constraint checks passed cleanly.</p>
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={setValidated}
                  disabled={result.status !== "VALID"}
                  className={`w-full font-mono text-xs uppercase tracking-widest py-3 rounded flex justify-center items-center gap-2 transition-colors ${result.status === "VALID"
                      ? "bg-[#a7c4b5] text-[#121414] hover:bg-[#a7c4b5]/90 cursor-pointer"
                      : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                    }`}
                >
                  <span className="material-symbols-outlined text-[18px]">publish</span>
                  SUBMIT OFFICIAL SQUAD
                </button>
              </div>

              {/* Tactical Pitch */}
              <div className="bg-[#1a1d1c] rounded-xl border border-white/[0.08] flex-1 flex flex-col overflow-hidden min-h-[300px]">
                <div className="px-6 py-4 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#c1c8c3] text-[18px]">sports_soccer</span>
                    <h4 className="font-mono text-xs text-[#e2e2e2] uppercase tracking-widest">Tactical Pitch</h4>
                  </div>
                  <span className="font-mono text-[10px] text-[#c1c8c3] uppercase">5-A-Side Futsal</span>
                </div>

                <div className="flex-1 p-6 relative flex items-center justify-center">
                  <div className="w-full max-w-sm aspect-[4/3] pitch-lines rounded bg-[#121414]/50 relative">
                    <div className="pitch-box left-0 top-1/2 -translate-y-1/2 w-12 h-24 border-l-0" />
                    <div className="pitch-box right-0 top-1/2 -translate-y-1/2 w-12 h-24 border-r-0" />

                    {numGk === 0 && (
                      <div className="absolute left-6 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#e26d6d]/20 border border-[#e26d6d] text-[#e26d6d] flex items-center justify-center font-mono text-[10px] font-bold animate-pulse">
                        GK
                      </div>
                    )}

                    {selectedPlayers.map((player, idx) => {
                      let left = "50%";
                      let top = "50%";

                      if (player.position === "GOALKEEPER") {
                        left = "12%";
                        top = "50%";
                      } else if (player.position === "DEFENDER") {
                        left = "28%";
                        top = idx % 2 === 0 ? "26%" : "74%";
                      } else if (player.position === "FORWARD") {
                        left = "80%";
                        top = idx % 2 === 0 ? "32%" : "68%";
                      } else {
                        left = "55%";
                        top = idx % 2 === 0 ? "38%" : "62%";
                      }

                      const posStyle = POSITION_STYLES[player.position];

                      return (
                        <div
                          key={player.id}
                          style={{ left, top }}
                          title={`${player.name} (${player.position})`}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#121414] border-2 flex items-center justify-center font-mono text-[10px] font-bold transition-transform hover:scale-125 cursor-pointer ${posStyle.nodeClass
                            } ${player.position === "GOALKEEPER" ? "node-glow" : ""}`}
                        >
                          {player.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};