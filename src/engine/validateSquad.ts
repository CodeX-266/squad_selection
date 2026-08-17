import type {
  RosterPlayer,
  Cohort,
  Position,
  Violation,
  ValidationResult,
  CountSummary,
} from "../types/squad";

const COHORT_ORDER: Cohort[] = ["YEAR_2", "YEAR_3"];
const COHORT_LIMIT = 4;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildCounts(selectedPlayers: RosterPlayer[]): CountSummary {
  const byPosition: Record<Position, number> = {
    GOALKEEPER: 0,
    DEFENDER: 0,
    FORWARD: 0,
    UTILITY: 0,
  };
  const byCohort: Record<Cohort, number> = {
    YEAR_2: 0,
    YEAR_3: 0,
  };

  for (const p of selectedPlayers) {
    byPosition[p.position]++;
    byCohort[p.cohort]++;
  }

  return { total: selectedPlayers.length, byPosition, byCohort };
}

// ─── Pure validation function ─────────────────────────────────────────────────

/**
 * Validates a squad selection against the spec rules.
 *
 * Rules are evaluated independently and collected in this exact order:
 *  1. INVALID_SELECTION_REFERENCE (reference integrity — short-circuits all others)
 *  2. SQUAD_SIZE_MUST_BE_7
 *  3. GOALKEEPER_COUNT_MUST_BE_1
 *  4. MINIMUM_DEFENDERS_NOT_MET
 *  5. MINIMUM_FORWARDS_NOT_MET
 *  6. PLAYER_UNAVAILABLE: <ID>  (in roster order)
 *  7. COHORT_LIMIT_EXCEEDED: <cohort> has <count>, maximum 4  (YEAR_2 then YEAR_3)
 *
 * UTILITY players count toward size + cohort totals, never toward DEF/FWD minimums.
 * Overall status is VALID only if violations list is empty.
 */
export function validateSquad(
  roster: RosterPlayer[],
  selectedIds: string[]
): ValidationResult {
  const violations: Violation[] = [];

  // ── Reference integrity check ────────────────────────────────────────────
  const rosterMap = new Map(roster.map((p) => [p.id, p]));

  // Check for duplicates
  const seen = new Set<string>();
  let hasDuplicate = false;
  for (const id of selectedIds) {
    if (seen.has(id)) { hasDuplicate = true; break; }
    seen.add(id);
  }

  // Check for unknown IDs
  const hasUnknown = selectedIds.some((id) => !rosterMap.has(id));

  if (hasDuplicate || hasUnknown) {
    // Reference integrity failure: clear all other results
    const emptyCounts: CountSummary = {
      total: 0,
      byPosition: { GOALKEEPER: 0, DEFENDER: 0, FORWARD: 0, UTILITY: 0 },
      byCohort: { YEAR_2: 0, YEAR_3: 0 },
    };
    return {
      status: "INVALID",
      violations: [
        {
          code: "INVALID_SELECTION_REFERENCE",
          key: "INVALID_SELECTION_REFERENCE",
          message:
            "Selection contains unknown or duplicate player IDs. Please use valid roster entries only.",
        },
      ],
      counts: emptyCounts,
    };
  }

  // ── Build selected player objects (preserving roster order for iteration) ──
  // We need roster-order for PLAYER_UNAVAILABLE; for other rules we just need the set.
  const selectedSet = new Set(selectedIds);
  const selectedPlayers = roster.filter((p) => selectedSet.has(p.id));

  // Counts are always computed fresh — never stale
  const counts = buildCounts(selectedPlayers);

  // ── Rule 1: Squad size ───────────────────────────────────────────────────
  if (counts.total !== 7) {
    violations.push({
      code: "SQUAD_SIZE_MUST_BE_7",
      key: "SQUAD_SIZE_MUST_BE_7",
      message: `Squad must have exactly 7 players. Currently selected: ${counts.total}.`,
    });
  }

  // ── Rule 2: Goalkeeper count ─────────────────────────────────────────────
  if (counts.byPosition.GOALKEEPER !== 1) {
    violations.push({
      code: "GOALKEEPER_COUNT_MUST_BE_1",
      key: "GOALKEEPER_COUNT_MUST_BE_1",
      message: `Squad must include exactly 1 Goalkeeper. Currently: ${counts.byPosition.GOALKEEPER}.`,
    });
  }

  // ── Rule 3: Minimum Defenders ────────────────────────────────────────────
  if (counts.byPosition.DEFENDER < 2) {
    violations.push({
      code: "MINIMUM_DEFENDERS_NOT_MET",
      key: "MINIMUM_DEFENDERS_NOT_MET",
      message: `Squad requires at least 2 Defenders. Currently: ${counts.byPosition.DEFENDER}.`,
    });
  }

  // ── Rule 4: Minimum Forwards ─────────────────────────────────────────────
  if (counts.byPosition.FORWARD < 2) {
    violations.push({
      code: "MINIMUM_FORWARDS_NOT_MET",
      key: "MINIMUM_FORWARDS_NOT_MET",
      message: `Squad requires at least 2 Forwards. Currently: ${counts.byPosition.FORWARD}.`,
    });
  }

  // ── Rule 5: Unavailable players (in roster order) ────────────────────────
  for (const player of selectedPlayers) {
    // selectedPlayers is already in roster order (filtered from roster array)
    if (player.availability === "UNAVAILABLE") {
      violations.push({
        code: "PLAYER_UNAVAILABLE",
        key: `PLAYER_UNAVAILABLE: ${player.id}`,
        message: `${player.name} (${player.id}) is marked UNAVAILABLE and cannot be selected.`,
      });
    }
  }

  // ── Rule 6: Cohort limit (YEAR_2 then YEAR_3 order) ─────────────────────
  for (const cohort of COHORT_ORDER) {
    const count = counts.byCohort[cohort];
    if (count > COHORT_LIMIT) {
      violations.push({
        code: "COHORT_LIMIT_EXCEEDED",
        key: `COHORT_LIMIT_EXCEEDED: ${cohort} has ${count}, maximum ${COHORT_LIMIT}`,
        message: `${cohort.replace("_", " ")} has ${count} players selected; maximum is ${COHORT_LIMIT}.`,
      });
    }
  }

  return {
    status: violations.length === 0 ? "VALID" : "INVALID",
    violations,
    counts,
  };
}
