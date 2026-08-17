import React, { useMemo } from "react";
import { motion } from "framer-motion";

interface HeroTextProps {
  scrollProgress: number; // 0 → 1 from ScrollControls
}

// ── Slide definitions — clear, non-overlapping segments ──────────────────────
// Each slide owns a generous chunk of scroll real-estate so it's fully readable.
// Fade-in starts 3% before the hold zone; fade-out starts 3% before the end.
const SLIDES = [
  {
    id: "s1",
    headline: "Every squad\nhas rules.",
    sub: "Futsal · 7 players · One shot at selection.",
    // Visible during scroll 0 → 0.38 — full hold 0.05 → 0.33
    holdStart: 0.05,
    holdEnd:   0.33,
    fadeIn:    0.03,
    fadeOut:   0.04,
  },
  {
    id: "s2",
    headline: "Every selection\ngets checked.",
    sub: "Positions. Cohorts. Availability. In that order.",
    // Visible during scroll 0.35 → 0.68 — full hold 0.40 → 0.64
    holdStart: 0.40,
    holdEnd:   0.64,
    fadeIn:    0.03,
    fadeOut:   0.03,
  },
  {
    id: "s3",
    headline: "No shortcuts.\nJust the rules.",
    sub: "Scroll to open the Coach's Desk ↓",
    // Visible during scroll 0.66 → 1.0 — full hold 0.71 → 0.94
    holdStart: 0.71,
    holdEnd:   0.94,
    fadeIn:    0.03,
    fadeOut:   0.04,
  },
];

// Compute opacity from scroll position
function getOpacity(t: number, holdStart: number, holdEnd: number, fadeIn: number, fadeOut: number): number {
  const start = holdStart - fadeIn;
  const end   = holdEnd   + fadeOut;
  if (t < start || t > end) return 0;
  if (t < holdStart) return (t - start) / fadeIn;
  if (t > holdEnd)   return 1 - (t - holdEnd) / fadeOut;
  return 1;
}

// Split headline into words for staggered reveal
const WordReveal: React.FC<{ text: string; isVisible: boolean }> = ({ text, isVisible }) => {
  const lines = text.split("\n");
  return (
    <div className="flex flex-col items-center gap-1">
      {lines.map((line, li) => {
        const words = line.trim().split(" ");
        return (
          <div key={li} className="flex flex-wrap justify-center gap-x-3">
            {words.map((word, wi) => (
              <motion.span
                key={`${li}-${wi}`}
                className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black uppercase leading-none tracking-tight text-chalk inline-block"
                style={{
                  textShadow: "0 4px 40px rgba(0,0,0,0.9), 0 0 100px rgba(0,0,0,0.6)",
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
                transition={{
                  duration: 0.45,
                  delay: wi * 0.06 + li * 0.12,
                  ease: [0.16, 1, 0.3, 1],
                }}
              >
                {word}
              </motion.span>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export const HeroText: React.FC<HeroTextProps> = ({ scrollProgress }) => {
  const t = scrollProgress;

  // Determine which slide is the current dominant one (highest opacity)
  const currentSlideId = useMemo(() => {
    let maxOp = 0;
    let maxId = SLIDES[0].id;
    for (const slide of SLIDES) {
      const op = getOpacity(t, slide.holdStart, slide.holdEnd, slide.fadeIn, slide.fadeOut);
      if (op > maxOp) { maxOp = op; maxId = slide.id; }
    }
    return maxOp > 0.1 ? maxId : null;
  }, [t]);

  return (
    <div
      className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-6"
      aria-label="MATCHDAY hero"
    >
      {/* Brand mark — always visible */}
      <motion.div
        className="absolute top-8 left-8 z-20"
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="font-display text-xl sm:text-2xl font-black tracking-widest text-floodlight uppercase drop-shadow-lg">
          MATCHDAY
        </div>
        <div className="font-mono text-[9px] sm:text-[10px] tracking-[0.3em] text-chalk/40 uppercase">
          Squad Constraint Checker
        </div>
      </motion.div>

      {/* Slide stack — each fades independently based on scroll segment */}
      {SLIDES.map((slide) => {
        const opacity = getOpacity(t, slide.holdStart, slide.holdEnd, slide.fadeIn, slide.fadeOut);
        if (opacity < 0.01) return null;

        const isVisible = currentSlideId === slide.id;

        return (
          <div
            key={slide.id}
            className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center"
            style={{ opacity }}
            aria-hidden={opacity < 0.5}
          >
            {/* Headline with word-by-word reveal */}
            <WordReveal text={slide.headline} isVisible={isVisible} />

            {/* Sub-text — delayed after headline */}
            <motion.p
              className="mt-6 font-mono text-xs sm:text-sm uppercase tracking-[0.25em] text-chalk/55"
              style={{ textShadow: "0 2px 12px rgba(0,0,0,0.95)" }}
              initial={{ opacity: 0, y: 10 }}
              animate={isVisible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{
                duration: 0.5,
                delay: 0.35,
                ease: [0.16, 1, 0.3, 1],
              }}
            >
              {slide.sub}
            </motion.p>

            {/* Floodlight accent bar under headline */}
            <motion.div
              className="mt-5 h-px bg-gradient-to-r from-transparent via-floodlight to-transparent"
              style={{ width: "28rem", maxWidth: "80vw" }}
              initial={{ scaleX: 0, opacity: 0 }}
              animate={isVisible ? { scaleX: 1, opacity: 0.7 } : { scaleX: 0, opacity: 0 }}
              transition={{ duration: 0.6, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
        );
      })}

      {/* Scroll progress pill — bottom right */}
      <motion.div
        className="absolute bottom-6 right-8 flex items-center gap-2 z-20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.8 }}
        aria-hidden="true"
      >
        {/* Segment dots */}
        {SLIDES.map((slide, i) => {
          const op = getOpacity(t, slide.holdStart, slide.holdEnd, slide.fadeIn, slide.fadeOut);
          const active = op > 0.5;
          return (
            <div
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: active ? "20px" : "6px",
                height: "6px",
                background: active ? "#f5e642" : "rgba(255,255,255,0.2)",
              }}
            />
          );
        })}
        <span className="ml-1 font-mono text-[9px] text-chalk/25 uppercase tracking-widest">
          {Math.round(t * 100)}%
        </span>
      </motion.div>
    </div>
  );
};
