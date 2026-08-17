import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Violation } from "../../types/squad";

const VIOLATION_TITLES: Record<string, string> = {
  INVALID_SELECTION_REFERENCE: "Invalid Player Selection",
  SQUAD_SIZE_MUST_BE_7: "Squad Size Constraint (Must be 7)",
  GOALKEEPER_COUNT_MUST_BE_1: "Goalkeeper Constraint (Must be exactly 1)",
  MINIMUM_DEFENDERS_NOT_MET: "Defenders Constraint (Minimum 2 required)",
  MINIMUM_FORWARDS_NOT_MET: "Forwards Constraint (Minimum 2 required)",
  PLAYER_UNAVAILABLE: "Player Availability Issue",
  COHORT_LIMIT_EXCEEDED: "Cohort Constraint (Maximum 2 Year-2 players)",
};

interface ViolationListProps {
  violations: Violation[];
  isVisible: boolean;
}

export const ViolationList: React.FC<ViolationListProps> = ({
  violations,
  isVisible,
}) => {
  if (!isVisible || violations.length === 0) return null;

  return (
    <div className="space-y-2 font-ui">
      <div className="text-xs font-semibold text-red-400 uppercase tracking-wider px-0.5">
        Rule Violations ({violations.length})
      </div>
      <ul className="space-y-2" role="list">
        <AnimatePresence>
          {violations.map((violation, idx) => (
            <motion.li
              key={violation.key}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04 }}
              className="p-3 rounded-lg border border-red-500/20 bg-red-950/20 text-xs"
            >
              <div className="font-semibold text-red-300">
                {VIOLATION_TITLES[violation.code] ?? violation.code}
              </div>
              <div className="text-chalk/70 mt-1 leading-relaxed">
                {violation.message}
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
};
