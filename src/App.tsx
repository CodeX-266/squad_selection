import React, { lazy, Suspense } from "react";
import { CheckerSection } from "./components/checker/CheckerSection";
import { ReducedMotionHero } from "./components/hero/ReducedMotionHero";
import { GlowCursor } from "./components/GlowCursor";

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

      {/* ── Hero section (Fixed in background) ── */}
      <div className="fixed top-0 left-0 w-full h-screen z-0">
        {prefersReducedMotion ? (
          <ReducedMotionHero />
        ) : (
          <Suspense fallback={<HeroLoadingFallback />}>
            <HeroCanvas />
          </Suspense>
        )}
      </div>

      {/* Spacer to push the checker section down below the hero */}
      <div className="h-screen w-full relative z-10 pointer-events-none" aria-hidden="true" />

      {/* ── Checker section (Scrolls over Hero) ── */}
      <div id="checker-container" className="relative z-20 w-full bg-surface-container-lowest shadow-[0_-20px_60px_rgba(0,0,0,0.8)]">
        <CheckerSection />
      </div>
    </main>
  );
}
