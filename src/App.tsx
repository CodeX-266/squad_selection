import React, { lazy, Suspense } from "react";
import { motion } from "framer-motion";
import { CheckerSection } from "./components/checker/CheckerSection";
import { ReducedMotionHero } from "./components/hero/ReducedMotionHero";
import { GlowCursor } from "./components/GlowCursor";
import { RobotGuide } from "./components/RobotGuide";

// Lazy-load the heavy 3D bundle so the checker is usable immediately
const HeroCanvas = lazy(() =>
  import("./components/hero/HeroCanvas").then((m) => ({ default: m.HeroCanvas }))
);

// Detect reduced-motion preference once at module level
const prefersReducedMotion =
  typeof window !== "undefined"
    ? window.matchMedia("(prefers-reduced-motion: reduce)").matches
    : false;

// Simple 3D-loading skeleton
const HeroLoadingFallback: React.FC = () => (
  <div
    className="flex h-screen w-full items-center justify-center"
    style={{
      background:
        "linear-gradient(160deg, #061a0e 0%, #0d3b1e 50%, #061209 100%)",
    }}
    aria-label="Loading 3D scene"
  >
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-floodlight/20 border-t-floodlight" />
      <span className="font-mono text-xs uppercase tracking-widest text-chalk/30">
        Loading scene…
      </span>
    </div>
  </div>
);

export default function App() {
  return (
    <main style={{ cursor: "none" }}>
      {/* Custom glow cursor — always on top */}
      {!prefersReducedMotion && <GlowCursor />}

      {/* SEO */}
      <title>MATCHDAY — Squad Constraint Checker</title>

      {/* ── Hero section ── */}
      {prefersReducedMotion ? (
        <ReducedMotionHero />
      ) : (
        <Suspense fallback={<HeroLoadingFallback />}>
          <HeroCanvas />
        </Suspense>
      )}

      {/* ── Transition bridge ── */}
      <motion.div
        className="relative z-10 h-16 w-full"
        style={{
          background:
            "linear-gradient(to bottom, transparent, #060e08)",
        }}
        aria-hidden="true"
      />

      {/* ── Checker section ── */}
      <CheckerSection />

      {/* ── Footer ── */}
      <footer className="border-t border-white/8 bg-tactics-dark px-4 py-8 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-chalk/25">
          MATCHDAY · Squad Constraint Checker · Rules-only validation tool
        </p>
      </footer>
    </main>
  );
}
