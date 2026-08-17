// ─── Domain types ────────────────────────────────────────────────────────────

export type Position = "GOALKEEPER" | "DEFENDER" | "FORWARD" | "UTILITY";
export type Cohort = "YEAR_2" | "YEAR_3";
export type Availability = "AVAILABLE" | "UNAVAILABLE";

export interface RosterPlayer {
  id: string;
  name: string;
  position: Position;
  cohort: Cohort;
  availability: Availability;
}

// ─── Violation codes ─────────────────────────────────────────────────────────

export type ViolationCode =
  | "INVALID_SELECTION_REFERENCE"
  | "SQUAD_SIZE_MUST_BE_7"
  | "GOALKEEPER_COUNT_MUST_BE_1"
  | "MINIMUM_DEFENDERS_NOT_MET"
  | "MINIMUM_FORWARDS_NOT_MET"
  | "PLAYER_UNAVAILABLE"
  | "COHORT_LIMIT_EXCEEDED";

export interface Violation {
  code: ViolationCode;
  /** Human-readable label shown in the UI */
  message: string;
  /** The raw violation key, e.g. "PLAYER_UNAVAILABLE: S08" */
  key: string;
}

// ─── Counts ──────────────────────────────────────────────────────────────────

export interface CountSummary {
  total: number;
  byPosition: Record<Position, number>;
  byCohort: Record<Cohort, number>;
}

// ─── Validation result ───────────────────────────────────────────────────────

export interface ValidationResult {
  status: "VALID" | "INVALID" | "UNCHECKED";
  violations: Violation[];
  counts: CountSummary;
}
