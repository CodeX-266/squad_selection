import React from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StatusBadgeProps {
  status: "VALID" | "INVALID" | "UNCHECKED";
  violationCount: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  violationCount,
}) => {
  if (status === "UNCHECKED") return null;

  const isValid = status === "VALID";

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={`p-4 rounded-lg border text-sm font-ui ${
          isValid
            ? "border-emerald-500/30 bg-emerald-950/25 text-emerald-300"
            : "border-red-500/30 bg-red-950/25 text-red-300"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
              isValid ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
            }`}>
              {isValid ? "✓" : "!"}
            </span>
            <span className="font-bold text-sm">
              {isValid ? "Squad is Valid" : "Constraints Violated"}
            </span>
          </div>

          <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold uppercase tracking-wider ${
            isValid ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
          }`}>
            {status}
          </span>
        </div>

        <p className="text-xs text-chalk/60 mt-2 pl-8.5">
          {isValid
            ? "All 6 competition rules are satisfied. Squad is ready for matchday."
            : `${violationCount} rule issue${violationCount !== 1 ? "s" : ""} must be resolved before squad can play.`}
        </p>
      </motion.div>
    </AnimatePresence>
  );
};
