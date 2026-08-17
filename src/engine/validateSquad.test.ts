import { describe, it, expect } from "vitest";
import { validateSquad } from "./validateSquad";
import { ROSTER, DEFAULT_SELECTION, SAMPLE_SELECTION } from "../data/roster";

// ─── Scenario 1: Baseline valid (S01–S07) ────────────────────────────────────

describe("Baseline valid selection (S01–S07)", () => {
  const result = validateSquad(ROSTER, DEFAULT_SELECTION);

  it("returns VALID status", () => {
    expect(result.status).toBe("VALID");
  });

  it("has zero violations", () => {
    expect(result.violations).toHaveLength(0);
  });

  it("reports total size of 7", () => {
    expect(result.counts.total).toBe(7);
  });

  it("reports 1 GOALKEEPER", () => {
    expect(result.counts.byPosition.GOALKEEPER).toBe(1);
  });

  it("reports 2 DEFENDERs", () => {
    expect(result.counts.byPosition.DEFENDER).toBe(2);
  });

  it("reports 2 FORWARDs", () => {
    expect(result.counts.byPosition.FORWARD).toBe(2);
  });

  it("reports 2 UTILITYs", () => {
    expect(result.counts.byPosition.UTILITY).toBe(2);
  });

  it("reports YEAR_2 = 4", () => {
    expect(result.counts.byCohort.YEAR_2).toBe(4);
  });

  it("reports YEAR_3 = 3", () => {
    expect(result.counts.byCohort.YEAR_3).toBe(3);
  });
});

// ─── Scenario 2: S07→S08 swap ────────────────────────────────────────────────

describe("S07→S08 swap (sample selection)", () => {
  const result = validateSquad(ROSTER, SAMPLE_SELECTION);

  it("returns INVALID status", () => {
    expect(result.status).toBe("INVALID");
  });

  it("has exactly 2 violations", () => {
    expect(result.violations).toHaveLength(2);
  });

  it("first violation is PLAYER_UNAVAILABLE: S08", () => {
    expect(result.violations[0].code).toBe("PLAYER_UNAVAILABLE");
    expect(result.violations[0].key).toBe("PLAYER_UNAVAILABLE: S08");
  });

  it("second violation is COHORT_LIMIT_EXCEEDED for YEAR_2 with count 5", () => {
    expect(result.violations[1].code).toBe("COHORT_LIMIT_EXCEEDED");
    expect(result.violations[1].key).toBe(
      "COHORT_LIMIT_EXCEEDED: YEAR_2 has 5, maximum 4"
    );
  });

  it("squad size still passes (7 players)", () => {
    expect(result.counts.total).toBe(7);
  });

  it("does NOT add SQUAD_SIZE_MUST_BE_7 violation", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("SQUAD_SIZE_MUST_BE_7");
  });

  it("does NOT add GOALKEEPER_COUNT_MUST_BE_1 violation", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("GOALKEEPER_COUNT_MUST_BE_1");
  });

  it("does NOT add MINIMUM_DEFENDERS_NOT_MET violation", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("MINIMUM_DEFENDERS_NOT_MET");
  });

  it("does NOT add MINIMUM_FORWARDS_NOT_MET violation (S08 is FORWARD, counts toward position)", () => {
    // S04=FWD, S05=FWD, S08=FWD → 3 forwards → no violation
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("MINIMUM_FORWARDS_NOT_MET");
  });
});

// ─── Scenario 3: Six-player case (drop S07 only) ─────────────────────────────

describe("Six-player case (S01–S06 only)", () => {
  const sixPlayerIds = ["S01", "S02", "S03", "S04", "S05", "S06"];
  const result = validateSquad(ROSTER, sixPlayerIds);

  it("returns INVALID status", () => {
    expect(result.status).toBe("INVALID");
  });

  it("has exactly 1 violation", () => {
    expect(result.violations).toHaveLength(1);
  });

  it("the only violation is SQUAD_SIZE_MUST_BE_7", () => {
    expect(result.violations[0].code).toBe("SQUAD_SIZE_MUST_BE_7");
  });

  it("does NOT add MINIMUM_DEFENDERS_NOT_MET", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("MINIMUM_DEFENDERS_NOT_MET");
  });

  it("does NOT add MINIMUM_FORWARDS_NOT_MET", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("MINIMUM_FORWARDS_NOT_MET");
  });

  it("does NOT add GOALKEEPER_COUNT_MUST_BE_1", () => {
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("GOALKEEPER_COUNT_MUST_BE_1");
  });

  it("reports size = 6", () => {
    expect(result.counts.total).toBe(6);
  });
});

// ─── Scenario 4: Reset returns to exact baseline ─────────────────────────────

describe("Reset (DEFAULT_SELECTION validated twice is consistent)", () => {
  it("produces identical results on repeated validation of default selection", () => {
    const r1 = validateSquad(ROSTER, DEFAULT_SELECTION);
    const r2 = validateSquad(ROSTER, DEFAULT_SELECTION);
    expect(r1.status).toBe(r2.status);
    expect(r1.violations).toEqual(r2.violations);
    expect(r1.counts).toEqual(r2.counts);
  });
});

// ─── Scenario 5: Cohort limit boundary ───────────────────────────────────────

describe("Cohort limit boundary", () => {
  // S01(Y2), S02(Y2), S04(Y2), S06(Y2) = exactly 4 from YEAR_2
  // S03(Y3), S05(Y3), S07(Y3) = 3 from YEAR_3
  // This is exactly the DEFAULT_SELECTION which is VALID
  it("exactly 4 from one cohort does NOT trigger COHORT_LIMIT_EXCEEDED", () => {
    const result = validateSquad(ROSTER, DEFAULT_SELECTION);
    const codes = result.violations.map((v) => v.code);
    expect(codes).not.toContain("COHORT_LIMIT_EXCEEDED");
    expect(result.counts.byCohort.YEAR_2).toBe(4);
  });

  it("exactly 5 from YEAR_2 triggers COHORT_LIMIT_EXCEEDED for YEAR_2", () => {
    // S01(Y2,GK), S02(Y2,DEF), S04(Y2,FWD), S06(Y2,UTIL), S08(Y2,FWD,UNAVAIL), S03(Y3,DEF), S05(Y3,FWD)
    // This is the SAMPLE_SELECTION
    const result = validateSquad(ROSTER, SAMPLE_SELECTION);
    const codes = result.violations.map((v) => v.code);
    expect(codes).toContain("COHORT_LIMIT_EXCEEDED");
    expect(result.counts.byCohort.YEAR_2).toBe(5);
  });

  it("COHORT_LIMIT_EXCEEDED key contains the correct count and maximum", () => {
    const result = validateSquad(ROSTER, SAMPLE_SELECTION);
    const cohortViolation = result.violations.find(
      (v) => v.code === "COHORT_LIMIT_EXCEEDED"
    );
    expect(cohortViolation?.key).toBe(
      "COHORT_LIMIT_EXCEEDED: YEAR_2 has 5, maximum 4"
    );
  });
});

// ─── Scenario 6: Reference integrity — duplicate ID ──────────────────────────

describe("Reference integrity — duplicate ID", () => {
  const dupeIds = ["S01", "S01", "S02", "S03", "S04", "S05", "S06"];
  const result = validateSquad(ROSTER, dupeIds);

  it("returns INVALID status", () => {
    expect(result.status).toBe("INVALID");
  });

  it("has exactly 1 violation: INVALID_SELECTION_REFERENCE", () => {
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].code).toBe("INVALID_SELECTION_REFERENCE");
  });

  it("clears all other rule results (zero counts)", () => {
    expect(result.counts.total).toBe(0);
    expect(result.counts.byPosition.GOALKEEPER).toBe(0);
    expect(result.counts.byCohort.YEAR_2).toBe(0);
  });
});

// ─── Scenario 7: Reference integrity — unknown ID ────────────────────────────

describe("Reference integrity — unknown ID", () => {
  const unknownIds = ["S01", "S02", "S03", "S04", "S05", "S06", "X99"];
  const result = validateSquad(ROSTER, unknownIds);

  it("returns INVALID status", () => {
    expect(result.status).toBe("INVALID");
  });

  it("has exactly 1 violation: INVALID_SELECTION_REFERENCE", () => {
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].code).toBe("INVALID_SELECTION_REFERENCE");
  });

  it("clears all counts", () => {
    expect(result.counts.total).toBe(0);
  });
});

// ─── Scenario 8: Violation order — multi-violation scenario ──────────────────

describe("Violation ordering — multi-violation scenario", () => {
  it("PLAYER_UNAVAILABLE appears before COHORT_LIMIT_EXCEEDED in violation list", () => {
    const result = validateSquad(ROSTER, SAMPLE_SELECTION);
    const idxUnavail = result.violations.findIndex(
      (v) => v.code === "PLAYER_UNAVAILABLE"
    );
    const idxCohort = result.violations.findIndex(
      (v) => v.code === "COHORT_LIMIT_EXCEEDED"
    );
    expect(idxUnavail).toBeLessThan(idxCohort);
  });

  it("SQUAD_SIZE violations appear before PLAYER_UNAVAILABLE violations", () => {
    // Select 6 players including an unavailable one → size violation + unavailable
    const ids = ["S01", "S02", "S03", "S04", "S08", "S06"];
    const result = validateSquad(ROSTER, ids);
    const idxSize = result.violations.findIndex(
      (v) => v.code === "SQUAD_SIZE_MUST_BE_7"
    );
    const idxUnavail = result.violations.findIndex(
      (v) => v.code === "PLAYER_UNAVAILABLE"
    );
    expect(idxSize).toBeLessThan(idxUnavail);
  });
});
