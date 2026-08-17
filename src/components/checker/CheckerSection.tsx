import React, { useMemo } from "react";
import { useSquadStore } from "../../store/squadStore";
import { validateSquad } from "../../engine/validateSquad";
import { ROSTER } from "../../data/roster";
import { RosterTable } from "./RosterTable";
import { CountsSummary } from "./CountsSummary";
import { ViolationList } from "./ViolationList";
import { ValidateButton } from "./ValidateButton";
import { StatusBadge } from "./StatusBadge";
import { FormationDiagram } from "./FormationDiagram";

export const CheckerSection: React.FC = () => {
  const { selectedIds, hasValidated, reset, loadSample, setValidated } =
    useSquadStore();

  const result = useMemo(
    () => validateSquad(ROSTER, selectedIds),
    [selectedIds]
  );

  const handleValidate = () => {
    setValidated();
  };

  return (
    <section
      id="checker"
      style={{
        background: "#080d0a",
        padding: "80px 32px 100px",
        minHeight: "100vh",
        position: "relative",
      }}
      aria-label="Squad Constraint Checker"
    >
      <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
        
        {/* Section Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            paddingBottom: "24px",
            borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            marginBottom: "32px",
            flexWrap: "wrap",
            gap: "16px",
          }}
        >
          <div>
            <div
              style={{
                fontSize: "12px",
                fontWeight: "700",
                color: "#10b981",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: "8px",
              }}
            >
              Tournament Rules Validator
            </div>
            <h2
              style={{
                fontSize: "36px",
                fontWeight: "800",
                color: "#f8fafc",
                letterSpacing: "-0.02em",
                margin: 0,
              }}
            >
              Squad Constraint Checker
            </h2>
            <p
              style={{
                fontSize: "14px",
                color: "rgba(248, 250, 252, 0.6)",
                margin: "6px 0 0 0",
                maxWidth: "600px",
              }}
            >
              Select 7 players from the roster and validate against tournament rules.
            </p>
          </div>

          {/* Action Buttons */}
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={loadSample}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "#fcd34d",
                background: "rgba(245, 158, 11, 0.12)",
                border: "1px solid rgba(245, 158, 11, 0.3)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Load Sample (S07→S08)
            </button>

            <button
              onClick={reset}
              style={{
                padding: "10px 18px",
                borderRadius: "8px",
                fontSize: "13px",
                fontWeight: "600",
                color: "rgba(248, 250, 252, 0.8)",
                background: "rgba(255, 255, 255, 0.05)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              Reset
            </button>
          </div>
        </div>

        {/* Live Metrics Grid */}
        <div style={{ marginBottom: "32px" }}>
          <CountsSummary counts={result.counts} />
        </div>

        {/* Main 2-Column Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
            gap: "32px",
            alignItems: "start",
          }}
        >
          {/* Left Column: Roster Table */}
          <div style={{ minWidth: 0 }}>
            <RosterTable />
          </div>

          {/* Right Column: Validation Hub & Tactics Pitch */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px", minWidth: 0 }}>
            
            {/* Validation Card */}
            <div
              style={{
                background: "#0d1310",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              }}
            >
              <ValidateButton
                onValidate={handleValidate}
                hasValidated={hasValidated}
              />

              <StatusBadge
                status={hasValidated ? result.status : "UNCHECKED"}
                violationCount={result.violations.length}
              />

              <ViolationList
                violations={result.violations}
                isVisible={hasValidated}
              />

              {!hasValidated && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "12px",
                    fontSize: "13px",
                    color: "rgba(248, 250, 252, 0.4)",
                  }}
                >
                  Click Validate Squad to verify all 6 tournament rules
                </div>
              )}
            </div>

            {/* Formation Pitch Card */}
            <div
              style={{
                background: "#0d1310",
                borderRadius: "16px",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                padding: "24px",
                boxShadow: "0 12px 32px rgba(0,0,0,0.4)",
              }}
            >
              <FormationDiagram selectedIds={selectedIds} />
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};
