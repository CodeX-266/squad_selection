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
  GOALKEEPER: { label: "GK", badge: "bg-[#a7c4b5]/15 text-[#a7c4b5] border-[#a7c4b5]/40", nodeClass: "node-gk" },
  DEFENDER: { label: "DEF", badge: "bg-[#4a5d54]/25 text-[#86a697] border-[#4a5d54]/40", nodeClass: "node-def" },
  FORWARD: { label: "FWD", badge: "bg-[#d4a373]/20 text-[#d4a373] border-[#d4a373]/40", nodeClass: "node-fwd" },
  UTILITY: { label: "UTI", badge: "bg-[#9aa0a7]/20 text-[#c1c7cf] border-[#9aa0a7]/40", nodeClass: "node-uti" },
};

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(" ");

const initials = (name: string) => name.split(" ").map((n) => n[0]).join("");

/* ─────────────────────────────── shared bits ─────────────────────────────── */

const Avatar: React.FC<{ name: string }> = ({ name }) => (
  <div className="w-7 h-7 rounded-full bg-[#111313] border border-white/15 flex items-center justify-center text-[10px] font-mono font-bold text-white/90 shadow-inner shrink-0">
    {initials(name)}
  </div>
);

const PosBadge: React.FC<{ position: Position }> = ({ position }) => {
  const pos = POSITION_STYLES[position];
  return (
    <span className={cx("inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold border", pos.badge)}>
      {pos.label}
    </span>
  );
};

const NavIconButton: React.FC<{ icon: string; label: string; onClick: () => void; title?: string }> = ({
  icon,
  label,
  onClick,
  title,
}) => (
  <button
    onClick={onClick}
    title={title}
    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-none text-xs font-mono font-bold text-white/70 hover:text-[#a7c4b5] hover:bg-white/[0.04] transition-all uppercase tracking-wider cursor-pointer border border-transparent hover:border-white/10"
  >
    <span className="material-symbols-outlined text-[16px]">{icon}</span>
    <span className="hidden sm:inline">{label}</span>
  </button>
);

const StatCard: React.FC<{
  label: string;
  icon: string;
  iconClass?: string;
  value: number;
  target: string;
  valueClass: string;
  barPct: number;
  barClass: string;
  onClick?: () => void;
}> = ({ label, icon, iconClass, value, target, valueClass, barPct, barClass, onClick }) => (
  <div
    onClick={onClick}
    className={cx(
      "bg-[#171a19] border border-white/[0.08] rounded-none p-2.5 sm:p-3 flex flex-col justify-between h-[76px] sm:h-[82px] relative overflow-hidden shadow-md transition-all select-none",
      onClick && "cursor-pointer hover:border-white/20 hover:bg-[#1c201e]"
    )}
  >
    <div className="flex justify-between items-center text-[10px] font-mono uppercase text-white/45 tracking-wider font-semibold">
      <span>{label}</span>
      <span className={cx("material-symbols-outlined text-[15px]", iconClass ?? "text-white/30")}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-1.5 my-0.5">
      <span className={cx("text-xl sm:text-2xl font-bold font-mono", valueClass)}>{value}</span>
      <span className="text-[10px] font-mono text-white/40">{target}</span>
    </div>
    <div className="w-full h-1 bg-white/5 rounded-none overflow-hidden">
      <div className={cx("h-full transition-all duration-300 rounded-none", barClass)} style={{ width: `${Math.min(barPct, 100)}%` }} />
    </div>
  </div>
);

const RuleDot: React.FC<{ ok: boolean; okColor?: string; badColor?: string; text: string }> = ({
  ok,
  okColor = "bg-[#a7c4b5]",
  badColor = "bg-[#e26d6d]",
  text,
}) => (
  <li className="flex items-center gap-2.5 text-xs text-white/80 font-sans font-medium">
    <span className={cx("w-2 h-2 rounded-none shrink-0", ok ? okColor : badColor)} />
    <span>{text}</span>
  </li>
);

const actionBtnBase =
  "w-6 h-6 rounded-full border flex items-center justify-center transition-all mx-auto cursor-pointer";

const PlayerRow: React.FC<{
  player: (typeof ROSTER)[number];
  action: { icon: "add" | "remove"; title?: string; className: string; onClick: () => void };
  nameClass?: string;
}> = ({ player, action, nameClass }) => (
  <tr className="hover:bg-white/[0.03] transition-colors group">
    <td className="py-2.5 pl-3 pr-2 font-mono text-xs text-white/40">{player.id}</td>
    <td className="py-2.5 px-3">
      <div className="flex items-center gap-2.5">
        <Avatar name={player.name} />
        <span className={cx("font-bold text-white text-xs sm:text-sm transition-colors", nameClass)}>{player.name}</span>
      </div>
    </td>
    <td className="py-2.5 px-3">
      <PosBadge position={player.position} />
    </td>
    <td className="py-2.5 px-3 font-mono text-xs text-white/60">{player.cohort === "YEAR_2" ? "Year-2" : "Year-3"}</td>
    <td className="py-2.5 px-3 font-mono text-xs uppercase tracking-wider font-bold">
      <span
        className={cx(
          "inline-block px-2 py-0.5 rounded-md text-[10px] font-mono font-bold",
          player.availability === "UNAVAILABLE"
            ? "text-[#e26d6d] bg-[#e26d6d]/10 border border-[#e26d6d]/30"
            : "text-[#a7c4b5] bg-[#a7c4b5]/10 border border-[#a7c4b5]/30"
        )}
      >
        {player.availability}
      </span>
    </td>
    <td className="py-2.5 px-3 text-center">
      <button onClick={action.onClick} title={action.title} className={cx(actionBtnBase, action.className)}>
        <span className="material-symbols-outlined text-[14px]">{action.icon}</span>
      </button>
    </td>
  </tr>
);

/* ─────────────────────────────────── main ─────────────────────────────────── */

export const CheckerSection: React.FC = () => {
  const { selectedIds, reset, loadSample, setValidated, togglePlayer } = useSquadStore();
  const [activeTab, setActiveTab] = useState<"selected" | "bench">("selected");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => validateSquad(ROSTER, selectedIds), [selectedIds]);

  const selectedPlayers = useMemo(
    () =>
      selectedIds
        .map((id) => ROSTER.find((p) => p.id === id))
        .filter((p): p is NonNullable<typeof p> => !!p),
    [selectedIds]
  );

  const numGk = selectedPlayers.filter((p) => p.position === "GOALKEEPER").length;
  const numDef = selectedPlayers.filter((p) => p.position === "DEFENDER").length;
  const numFwd = selectedPlayers.filter((p) => p.position === "FORWARD").length;
  const numY2 = selectedPlayers.filter((p) => p.cohort === "YEAR_2").length;

  // Search logic across player name, ID, position, cohort, and availability
  const q = searchQuery.trim().toLowerCase();

  const filteredSelected = useMemo(() => {
    if (!q) return selectedPlayers;
    return selectedPlayers.filter((p) => {
      const cohortLabel = p.cohort === "YEAR_2" ? "year-2 y2 second" : "year-3 y3 third";
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.availability.toLowerCase().includes(q) ||
        cohortLabel.includes(q)
      );
    });
  }, [selectedPlayers, q]);

  const filteredBench = useMemo(() => {
    if (!q) return ROSTER;
    return ROSTER.filter((p) => {
      const cohortLabel = p.cohort === "YEAR_2" ? "year-2 y2 second" : "year-3 y3 third";
      return (
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        p.position.toLowerCase().includes(q) ||
        p.availability.toLowerCase().includes(q) ||
        cohortLabel.includes(q)
      );
    });
  }, [q]);

  const squadSizeOk = selectedPlayers.length === 7;
  const gkOk = numGk === 1;
  const defOk = numDef >= 2;
  const fwdOk = numFwd >= 2;
  const y2Ok = numY2 <= 2;

  const handleReset = () => {
    reset();
    setSearchQuery("");
    setShowSuccessModal(false);
  };

  const handleLoadSample = () => {
    loadSample();
    setSearchQuery("");
    setActiveTab("selected");
    setShowSuccessModal(false);
  };

  const handleSubmitOfficialSquad = () => {
    if (result.status === "VALID") {
      setValidated();
      setShowSuccessModal(true);
    }
  };

  const handleCopyRoster = () => {
    const text = `MATCHDAY OFFICIAL SQUAD (7-A-SIDE):\n${selectedPlayers
      .map((p, idx) => `${idx + 1}. [${p.id}] ${p.name} - ${p.position} (${p.cohort === "YEAR_2" ? "Year-2" : "Year-3"})`)
      .join("\n")}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const tabBtnClass = (tab: "selected" | "bench") =>
    cx(
      "px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer border",
      activeTab === tab ? "bg-white/[0.08] text-[#a7c4b5] border-white/15 shadow-sm" : "text-white/40 border-transparent hover:text-white"
    );

  const navBtnClass = (tab: "selected" | "bench") =>
    cx(
      "w-full flex items-center gap-2.5 px-3 py-2.5 rounded-none font-mono text-xs uppercase font-bold cursor-pointer transition-all",
      activeTab === tab
        ? "text-[#a7c4b5] bg-white/[0.08] border-l-4 border-[#a7c4b5] shadow-sm"
        : "text-white/50 hover:text-white hover:bg-white/[0.03]"
    );

  return (
    <div
      className="bg-[#0b0e0d] text-[#e2e2e2] w-full min-h-screen lg:h-screen lg:max-h-screen flex flex-col p-3 md:p-4 lg:p-5 selection:bg-[#a7c4b5]/20 overflow-x-hidden lg:overflow-hidden box-border justify-between relative"
    >
      {/* ── Official Squad Submission Modal ── */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171a19] border border-[#a7c4b5]/40 rounded-none max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 text-left relative">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#a7c4b5]/15 border border-[#a7c4b5] flex items-center justify-center text-[#a7c4b5]">
                  <span className="material-symbols-outlined text-[24px]">verified</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-white">Squad Approved & Verified</h3>
                  <p className="font-mono text-xs text-[#a7c4b5]">Official Matchday Roster Confirmed</p>
                </div>
              </div>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="text-white/40 hover:text-white text-base cursor-pointer p-1"
                title="Close"
              >
                ✕
              </button>
            </div>

            <div className="bg-[#111313] border border-white/10 rounded-none p-3.5 space-y-2">
              <div className="font-mono text-[10px] text-white/50 uppercase tracking-wider font-bold">
                ACTIVE 7-PLAYER SQUAD
              </div>
              <div className="space-y-1.5">
                {selectedPlayers.map((p, i) => (
                  <div key={p.id} className="flex justify-between items-center text-xs font-mono py-1 border-b border-white/5">
                    <span className="text-white">
                      {i + 1}. <span className="font-bold">{p.name}</span> ({p.id})
                    </span>
                    <span className="text-[#a7c4b5] font-bold">{p.position}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleCopyRoster}
                className="flex-1 bg-white/10 hover:bg-white/15 text-white font-mono font-bold text-xs py-2.5 rounded-none flex items-center justify-center gap-2 uppercase tracking-wider transition-all border border-white/15 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">{copied ? "done" : "content_copy"}</span>
                {copied ? "COPIED TO CLIPBOARD" : "COPY SQUAD SHEET"}
              </button>
              <button
                onClick={() => setShowSuccessModal(false)}
                className="bg-[#a7c4b5] text-[#121414] hover:bg-[#a7c4b5]/90 font-mono font-bold text-xs py-2.5 px-6 rounded-none uppercase tracking-wider transition-all cursor-pointer font-black"
              >
                DONE
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Outer Wrapper ── */}
      <div className="w-full max-w-[1600px] mx-auto flex flex-col gap-3 flex-1 min-h-0">
        
        {/* ── 1. Top Header Bar Card ── */}
        <header className="w-full bg-[#171a19] border border-white/[0.08] rounded-none px-4 md:px-6 py-2.5 flex justify-between items-center shadow-lg shrink-0">
          <div className="flex items-center gap-3 shrink-0">
            <span className="font-extrabold text-xl md:text-2xl tracking-tight text-[#a7c4b5] select-none">
              MATCHDAY
            </span>
            <span className="font-mono text-[10px] font-bold bg-[#111313] px-2.5 py-1 rounded-none text-[#a7c4b5] border border-white/10 tracking-widest">
              COACH DESK
            </span>
          </div>

          <div className="flex-1 max-w-md mx-4 relative hidden md:block">
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 bg-[#111313] border border-white/10 rounded-none text-xs text-white px-3.5 pr-8 placeholder:text-white/30 outline-none focus:border-[#a7c4b5]/50 transition-colors font-sans"
              placeholder="Search player, position, ID, or cohort..."
              type="text"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-white/40 hover:text-white text-xs cursor-pointer p-0.5"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <NavIconButton icon="settings" label="LOAD SAMPLE (S08)" onClick={handleLoadSample} title="Load demo scenario with unavailable player S08" />
            <NavIconButton icon="refresh" label="RESET" onClick={handleReset} title="Reset squad" />
            <img
              alt="Head Coach"
              className="w-8 h-8 rounded-none border border-white/15 object-cover ml-1 shadow-md"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCR7i9BdK0R2ILyYQS9Oh4Hrmho-JkVMslzoVFUv_M25COMEPxZiFtTFMptm4fKo3GobjydASN50jfIRUvslDdDe-2u4aPY7AbshPEYSnW1Q-yEUJnXHBNUqlpNQBdsbsmPy2Amgu14VSNpwzdB0msWQGoTUKAre4EB82LiNKWkMEGJIG07JgNOhDyocpx7CcA2Nc5tVSw0n5mqbd49LMgXDKxq0TfAj-UUeifyB7n9iq5_oIbW-vlVLA"
            />
          </div>
        </header>

        {/* ── 2. Main Dashboard Layout (Full Viewport Height) ── */}
        <div className="w-full flex flex-col lg:flex-row gap-3 flex-1 min-h-0 items-stretch">
          
          {/* ── Left Sidebar Card ── */}
          <aside className="w-full lg:w-56 xl:w-60 bg-[#171a19] border border-white/[0.08] rounded-none p-4 flex flex-col justify-between gap-4 flex-shrink-0 shadow-lg h-full overflow-y-auto">
            {/* Top: Branding & Nav */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-none bg-[#111313] border border-white/10 flex items-center justify-center text-[#a7c4b5] font-black text-sm shadow-inner">
                  FC
                </div>
                <div className="min-w-0">
                  <h2 className="font-bold text-xs text-white leading-tight">Squad Engine</h2>
                  <p className="font-mono text-[10px] text-white/40 mt-0.5">Tournament 2024</p>
                </div>
              </div>

              <nav className="space-y-1.5">
                <button onClick={() => setActiveTab("selected")} className={navBtnClass("selected")}>
                  <span className="material-symbols-outlined text-[18px]">grid_view</span>
                  SQUAD BUILDER
                </button>

                <button onClick={() => setActiveTab("bench")} className={cx(navBtnClass("bench"), "justify-between")}>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">groups</span>
                    ROSTER BENCH
                  </div>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-none bg-white/10 text-white/70 font-semibold border border-white/10">{ROSTER.length}</span>
                </button>
              </nav>
            </div>

            {/* Middle: Tournament Rules Checklist */}
            <div className="py-3.5 border-t border-b border-white/[0.06] my-auto">
              <div className="font-mono text-[10px] text-white/40 uppercase tracking-wider mb-2.5 font-bold">TOURNAMENT RULES</div>
              <ul className="space-y-2">
                <RuleDot ok={squadSizeOk} badColor="bg-[#d4a373]" text="Exactly 7 Players" />
                <RuleDot ok={gkOk} text="Exactly 1 Goalkeeper" />
                <RuleDot ok={defOk} badColor="bg-[#d4a373]" text="Min 2 Defenders" />
                <RuleDot ok={fwdOk} badColor="bg-[#d4a373]" text="Min 2 Forwards" />
                <RuleDot ok={y2Ok} text="Max 2 Year-2 Cohort" />
              </ul>
            </div>

            {/* Bottom: Tournament Info Tag */}
            <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-white/40">
              <span>DIVISION 1</span>
              <span className="text-[#a7c4b5] font-semibold">5-A-SIDE FUTSAL</span>
            </div>
          </aside>

          {/* ── Main Workspace ── */}
          <main className="flex-1 flex flex-col gap-3 min-w-0 min-h-0 h-full">
            
            {/* ── Live Metrics Strip ── */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 shrink-0">
              <StatCard
                label="SQUAD SIZE"
                icon="groups"
                value={selectedPlayers.length}
                target="/ 7"
                valueClass={squadSizeOk ? "text-[#a7c4b5]" : "text-[#d4a373]"}
                barPct={(selectedPlayers.length / 7) * 100}
                barClass={squadSizeOk ? "bg-[#a7c4b5]" : "bg-[#d4a373]"}
                onClick={() => setActiveTab("selected")}
              />
              <StatCard
                label="GOALKEEPERS"
                icon="sports_handball"
                iconClass={gkOk ? "text-[#a7c4b5]" : "text-[#e26d6d]"}
                value={numGk}
                target="/ 1 Required"
                valueClass={gkOk ? "text-[#a7c4b5]" : "text-[#e26d6d]"}
                barPct={numGk * 100}
                barClass={gkOk ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}
                onClick={() => {
                  setSearchQuery("goalkeeper");
                  setActiveTab("bench");
                }}
              />
              <StatCard
                label="DEFENDERS"
                icon="shield"
                iconClass="text-[#86a697]"
                value={numDef}
                target="/ Min 2"
                valueClass={defOk ? "text-white" : "text-[#d4a373]"}
                barPct={(numDef / 2) * 100}
                barClass={defOk ? "bg-[#4a5d54]" : "bg-[#d4a373]"}
                onClick={() => {
                  setSearchQuery("defender");
                  setActiveTab("bench");
                }}
              />
              <StatCard
                label="FORWARDS"
                icon="bolt"
                iconClass="text-[#d4a373]"
                value={numFwd}
                target="/ Min 2"
                valueClass={fwdOk ? "text-white" : "text-[#d4a373]"}
                barPct={(numFwd / 2) * 100}
                barClass="bg-[#d4a373]"
                onClick={() => {
                  setSearchQuery("forward");
                  setActiveTab("bench");
                }}
              />
              <StatCard
                label="Y2 COHORT"
                icon="school"
                iconClass={y2Ok ? "text-[#a7c4b5]" : "text-[#e26d6d]"}
                value={numY2}
                target="/ Max 2"
                valueClass={y2Ok ? "text-white" : "text-[#e26d6d]"}
                barPct={(numY2 / 2) * 100}
                barClass={y2Ok ? "bg-[#a7c4b5]" : "bg-[#e26d6d]"}
                onClick={() => {
                  setSearchQuery("year-2");
                  setActiveTab("bench");
                }}
              />
            </div>

            {/* ── Table + Right Column Stack ── */}
            <div className="flex flex-col xl:flex-row gap-3 flex-1 min-h-0 items-stretch w-full">
              
              {/* ── Player Table Card ── */}
              <div className="flex-1 w-full bg-[#171a19] border border-white/[0.08] rounded-none p-3.5 flex flex-col shadow-lg overflow-hidden h-full">
                {/* Table Tabs */}
                <div className="flex justify-between items-center pb-2.5 border-b border-white/[0.06] flex-wrap gap-2 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setActiveTab("selected")} className={tabBtnClass("selected")}>
                      Selected ({filteredSelected.length}/{selectedPlayers.length})
                    </button>
                    <button onClick={() => setActiveTab("bench")} className={tabBtnClass("bench")}>
                      Bench Pool ({filteredBench.length})
                    </button>
                  </div>
                  <div className="text-[11px] font-mono text-white/40 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] text-white/30">info</span>
                    {activeTab === "selected" ? "Click − to bench player" : "Click + to draft player"}
                  </div>
                </div>

                {/* Table Scrollable Container */}
                <div className="overflow-y-auto flex-1 mt-1">
                  <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-[#171a19] z-10">
                      <tr className="border-b border-white/[0.06] text-xs font-mono uppercase text-white/40 tracking-wider font-semibold">
                        <th className="py-2.5 pl-3 pr-2 w-14">ID</th>
                        <th className="py-2.5 px-3">PLAYER</th>
                        <th className="py-2.5 px-3 w-24">POS</th>
                        <th className="py-2.5 px-3 w-28">COHORT</th>
                        <th className="py-2.5 px-3 w-28">STATUS</th>
                        <th className="py-2.5 pl-3 pr-3 w-16 text-center">ACTION</th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-white/[0.04] text-xs">
                      {activeTab === "selected" ? (
                        filteredSelected.length > 0 ? (
                          <>
                            {filteredSelected.map((player) => (
                              <PlayerRow
                                key={player.id}
                                player={player}
                                nameClass="group-hover:text-[#a7c4b5]"
                                action={{
                                  icon: "remove",
                                  title: "Remove from squad",
                                  className:
                                    "border-white/15 text-white/40 hover:text-[#e26d6d] hover:border-[#e26d6d]/40 hover:bg-[#e26d6d]/10",
                                  onClick: () => togglePlayer(player.id),
                                }}
                              />
                            ))}

                            {!q &&
                              Array.from({ length: Math.max(0, 7 - selectedPlayers.length) }).map((_, i) => (
                                <tr key={`empty-${i}`} className="border-dashed border-white/5 opacity-50">
                                  <td className="py-2.5 pl-3 pr-2 font-mono text-xs text-white/25">---</td>
                                  <td
                                    className={cx(
                                      "py-2.5 px-3 font-mono text-xs italic",
                                      i === 0 && numGk === 0 ? "text-[#e26d6d] font-bold not-italic" : "text-white/35"
                                    )}
                                  >
                                    {i === 0 && numGk === 0 ? "Required: Goalkeeper" : "Empty Slot"}
                                  </td>
                                  <td></td>
                                  <td></td>
                                  <td></td>
                                  <td className="py-2.5 pl-3 pr-3 text-center">
                                    <button
                                      onClick={() => setActiveTab("bench")}
                                      title="Add from bench"
                                      className={cx(actionBtnBase, "border-[#a7c4b5]/40 text-[#a7c4b5] hover:bg-[#a7c4b5]/15")}
                                    >
                                      <span className="material-symbols-outlined text-[14px]">add</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                          </>
                        ) : (
                          <tr>
                            <td colSpan={6} className="py-8 text-center text-xs font-mono text-white/40">
                              No selected players match "{searchQuery}".
                              <button
                                onClick={() => setSearchQuery("")}
                                className="ml-2 text-[#a7c4b5] underline hover:text-white cursor-pointer"
                              >
                                Clear search
                              </button>
                            </td>
                          </tr>
                        )
                      ) : filteredBench.length > 0 ? (
                        filteredBench.map((player) => {
                          const isSelected = selectedIds.includes(player.id);
                          return (
                            <PlayerRow
                              key={player.id}
                              player={player}
                              action={{
                                icon: isSelected ? "remove" : "add",
                                className: isSelected
                                  ? "border-white/15 text-white/40 hover:text-[#e26d6d] hover:bg-[#e26d6d]/10"
                                  : "border-[#a7c4b5]/40 text-[#a7c4b5] hover:bg-[#a7c4b5]/15",
                                onClick: () => togglePlayer(player.id),
                              }}
                            />
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={6} className="py-8 text-center text-xs font-mono text-white/40">
                            No players in bench pool match "{searchQuery}".
                            <button
                              onClick={() => setSearchQuery("")}
                              className="ml-2 text-[#a7c4b5] underline hover:text-white cursor-pointer"
                            >
                              Clear search
                            </button>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* ── Right Column: Constraint Engine & Tactical Pitch ── */}
              <div className="w-full xl:w-[340px] flex flex-col gap-3 flex-shrink-0 h-full justify-between">
                {/* Constraint Engine */}
                <div className="bg-[#171a19] border border-white/[0.08] rounded-none p-3.5 flex flex-col gap-2.5 shadow-lg shrink-0">
                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="flex flex-col">
                      <h3 className="font-extrabold text-sm text-white tracking-tight">Constraint Engine</h3>
                      <p className="font-mono text-[10px] text-white/50 mt-0.5">Tournament rule validation</p>
                    </div>
                    <span
                      className={cx(
                        "font-mono text-[10px] font-bold px-2.5 py-1 rounded-none border flex items-center gap-1.5 shrink-0 shadow-sm",
                        result.status === "VALID"
                          ? "bg-[#a7c4b5]/15 text-[#a7c4b5] border-[#a7c4b5]/40"
                          : "bg-[#e26d6d]/15 text-[#e26d6d] border-[#e26d6d]/40"
                      )}
                    >
                      <span
                        className={cx(
                          "w-1.5 h-1.5 rounded-none",
                          result.status === "VALID" ? "bg-[#a7c4b5] animate-pulse" : "bg-[#e26d6d]"
                        )}
                      />
                      {result.status === "VALID" ? "VALID SQUAD" : "VIOLATIONS"}
                    </span>
                  </div>

                  <div className="space-y-2 max-h-28 overflow-y-auto pr-1">
                    {result.violations.length > 0 ? (
                      result.violations.map((violation, i) => (
                        <div
                          key={i}
                          className="bg-[#e26d6d]/10 border border-[#e26d6d]/25 rounded-none p-2.5 flex items-start gap-2 text-left shadow-sm"
                        >
                          <span className="material-symbols-outlined text-[#e26d6d] text-[16px] mt-0.5 shrink-0">error</span>
                          <div>
                            <div className="font-bold text-xs text-[#e26d6d]">
                              {VIOLATION_TITLES[violation.code] || violation.code}
                            </div>
                            <p className="text-[11px] text-white/70 mt-0.5 leading-snug">{violation.message}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-[#111313] border border-white/5 rounded-none p-2.5 flex items-center gap-2.5 shadow-inner">
                        <span className="material-symbols-outlined text-[#a7c4b5] text-[20px] shrink-0">check_circle</span>
                        <div>
                          <div className="font-bold text-xs text-[#a7c4b5]">Squad Confirmed Valid</div>
                          <p className="text-[10px] text-white/50 mt-0.5">All 6 tournament constraint checks passed cleanly.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleSubmitOfficialSquad}
                    disabled={result.status !== "VALID"}
                    className={cx(
                      "w-full font-mono font-bold text-xs py-2.5 rounded-none flex items-center justify-center gap-2 uppercase tracking-wider transition-all shadow-md cursor-pointer",
                      result.status === "VALID"
                        ? "bg-[#a7c4b5] text-[#121414] hover:bg-[#a7c4b5]/90 shadow-[0_0_12px_rgba(167,196,181,0.25)] font-black"
                        : "bg-white/5 text-white/30 border border-white/10 cursor-not-allowed"
                    )}
                  >
                    <span className="material-symbols-outlined text-[15px]">publish</span>
                    SUBMIT OFFICIAL SQUAD
                  </button>
                </div>

                {/* TACTICAL PITCH */}
                <div className="bg-[#171a19] border border-white/[0.08] rounded-none p-3.5 flex flex-col gap-2 shadow-lg flex-1 min-h-0 justify-between">
                  <div className="flex justify-between items-center w-full shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[#a7c4b5] text-[16px]">sports_soccer</span>
                      <span className="font-bold text-xs text-white uppercase tracking-wider">TACTICAL PITCH</span>
                    </div>
                    <span className="font-mono text-[10px] text-white/40 uppercase tracking-wide">5-A-SIDE FUTSAL</span>
                  </div>

                  <div className="w-full flex-1 min-h-[140px] max-h-[220px] rounded-none border border-white/10 bg-[#111313] pitch-lines relative flex items-center justify-center overflow-hidden shadow-inner">
                    <div className="pitch-box left-0 top-1/2 -translate-y-1/2 w-8 h-24 border-l-0" />
                    <div className="pitch-box right-0 top-1/2 -translate-y-1/2 w-8 h-24 border-r-0" />

                    {numGk === 0 && (
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-none bg-[#e26d6d]/20 border border-[#e26d6d] text-[#e26d6d] flex items-center justify-center font-mono text-[10px] font-bold animate-pulse">
                        GK
                      </div>
                    )}

                    {selectedPlayers.map((player) => {
                      const defs = selectedPlayers.filter((p) => p.position === "DEFENDER");
                      const utis = selectedPlayers.filter((p) => p.position === "UTILITY");
                      const fwds = selectedPlayers.filter((p) => p.position === "FORWARD");

                      let left = "50%";
                      let top = "50%";

                      if (player.position === "GOALKEEPER") {
                        left = "14%";
                        top = "50%";
                      } else if (player.position === "DEFENDER") {
                        const idxInPos = defs.findIndex((p) => p.id === player.id);
                        left = "32%";
                        top = idxInPos === 0 ? "24%" : "76%";
                      } else if (player.position === "FORWARD") {
                        const idxInPos = fwds.findIndex((p) => p.id === player.id);
                        left = "82%";
                        top = idxInPos === 0 ? "26%" : "74%";
                      } else {
                        // UTILITY
                        const idxInPos = utis.findIndex((p) => p.id === player.id);
                        left = "55%";
                        top = idxInPos === 0 ? "35%" : "65%";
                      }

                      const posStyle = POSITION_STYLES[player.position];

                      return (
                        <div
                          key={player.id}
                          style={{ left, top }}
                          onClick={() => {
                            setSearchQuery(player.name);
                            setActiveTab("selected");
                          }}
                          title={`Click to inspect: ${player.name} (${player.position} • ${player.cohort})`}
                          className={cx(
                            "absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-none bg-[#171a19] border-2 flex items-center justify-center font-mono text-[10px] font-bold transition-transform hover:scale-125 cursor-pointer shadow-md",
                            posStyle.nodeClass,
                            player.position === "GOALKEEPER" && "node-glow"
                          )}
                        >
                          {initials(player.name)}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};