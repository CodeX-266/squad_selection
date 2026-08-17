import React from "react";
import { motion } from "framer-motion";

interface ValidateButtonProps {
  onValidate: () => void;
  hasValidated: boolean;
}

export const ValidateButton: React.FC<ValidateButtonProps> = ({
  onValidate,
  hasValidated,
}) => {
  return (
    <motion.button
      onClick={onValidate}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`w-full py-3.5 px-5 rounded-lg font-ui text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
        hasValidated
          ? "bg-white/10 hover:bg-white/15 text-chalk border border-white/20"
          : "bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-md shadow-emerald-950"
      }`}
      aria-label="Validate squad against competition constraints"
    >
      <span className="text-base font-bold" aria-hidden="true">
        {hasValidated ? "↻" : "✓"}
      </span>
      <span>{hasValidated ? "Re-Validate Squad" : "Validate Squad"}</span>
    </motion.button>
  );
};
