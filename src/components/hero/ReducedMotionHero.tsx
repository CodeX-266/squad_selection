import React from "react";
import { motion } from "framer-motion";

/**
 * Reduced-motion fallback hero — shown when prefers-reduced-motion is active.
 * Static pitch-green gradient + fade-in headline only. No Three.js, no animations.
 */
export const ReducedMotionHero: React.FC = () => {
  return (
    <section
      className="relative flex h-screen flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #061a0e 0%, #0d3b1e 50%, #061209 100%)",
      }}
      aria-label="MATCHDAY hero"
    >
      {/* Subtle pitch lines */}
      <div
        className="pointer-events-none absolute inset-0 opacity-5"
        aria-hidden="true"
        style={{
          backgroundImage: `repeating-linear-gradient(
            90deg, transparent, transparent 79px,
            rgba(255,255,255,1) 79px, rgba(255,255,255,1) 80px
          )`,
        }}
      />

      {/* Brand mark */}
      <div className="mb-2 font-mono text-xs uppercase tracking-[0.3em] text-floodlight/50">
        MATCHDAY
      </div>

      {/* Headline */}
      <h1 className="max-w-3xl px-6 text-center font-display text-6xl font-black uppercase leading-tight tracking-tight text-chalk sm:text-7xl">
        Every squad has rules.
      </h1>

      <p className="mt-4 font-mono text-sm uppercase tracking-widest text-chalk/40">
        Scroll to open the Coach's Desk ↓
      </p>

      {/* Scroll cue */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2" aria-hidden="true">
        <div className="h-8 w-px bg-gradient-to-b from-chalk/30 to-transparent mx-auto" />
      </div>
    </section>
  );
};
