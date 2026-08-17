import type { RosterPlayer } from "../types/squad";

/**
 * The canonical roster in fixed spec order.
 * This order must be preserved everywhere — roster table, unavailable-violation
 * listing, etc.
 */
export const ROSTER: RosterPlayer[] = [
  { id: "S01", name: "Aditi Rao",    position: "GOALKEEPER", cohort: "YEAR_2", availability: "AVAILABLE"   },
  { id: "S02", name: "Bilal Khan",   position: "DEFENDER",   cohort: "YEAR_2", availability: "AVAILABLE"   },
  { id: "S03", name: "Chitra Nair",  position: "DEFENDER",   cohort: "YEAR_3", availability: "AVAILABLE"   },
  { id: "S04", name: "Deepak Shah",  position: "FORWARD",    cohort: "YEAR_2", availability: "AVAILABLE"   },
  { id: "S05", name: "Esha Roy",     position: "FORWARD",    cohort: "YEAR_3", availability: "AVAILABLE"   },
  { id: "S06", name: "Farhan Das",   position: "UTILITY",    cohort: "YEAR_2", availability: "AVAILABLE"   },
  { id: "S07", name: "Gita Menon",   position: "UTILITY",    cohort: "YEAR_3", availability: "AVAILABLE"   },
  { id: "S08", name: "Harish Patel", position: "FORWARD",    cohort: "YEAR_2", availability: "UNAVAILABLE" },
  { id: "S09", name: "Imani Joseph", position: "GOALKEEPER", cohort: "YEAR_3", availability: "AVAILABLE"   },
];

/** Baseline default selection (S01–S07). */
export const DEFAULT_SELECTION: string[] = ["S01", "S02", "S03", "S04", "S05", "S06", "S07"];

/** S07→S08 swap — the required invalid demo selection. */
export const SAMPLE_SELECTION: string[] = ["S01", "S02", "S03", "S04", "S05", "S06", "S08"];
