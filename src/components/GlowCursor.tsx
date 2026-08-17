import React, { useEffect, useRef } from "react";

/**
 * GlowCursor — a custom cursor with a trailing neon glow dot.
 * Hides the default system cursor site-wide while active.
 */
export const GlowCursor: React.FC = () => {
  const dotRef     = useRef<HTMLDivElement>(null);
  const trailRef   = useRef<HTMLDivElement>(null);
  const posRef     = useRef({ x: -100, y: -100 });
  const trailPos   = useRef({ x: -100, y: -100 });
  const rafRef     = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      posRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    // Animation loop — trail follows dot with damping
    const animate = () => {
      trailPos.current.x += (posRef.current.x - trailPos.current.x) * 0.14;
      trailPos.current.y += (posRef.current.y - trailPos.current.y) * 0.14;

      if (dotRef.current) {
        dotRef.current.style.transform =
          `translate(${posRef.current.x - 6}px, ${posRef.current.y - 6}px)`;
      }
      if (trailRef.current) {
        trailRef.current.style.transform =
          `translate(${trailPos.current.x - 18}px, ${trailPos.current.y - 18}px)`;
      }
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      {/* Inner precision dot */}
      <div
        ref={dotRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 12,
          height: 12,
          borderRadius: "50%",
          background: "#f5e642",
          boxShadow: "0 0 10px 3px #f5e64280, 0 0 24px 6px #f59e0b50",
          pointerEvents: "none",
          zIndex: 9999,
          willChange: "transform",
          mixBlendMode: "screen",
        }}
      />
      {/* Trailing halo */}
      <div
        ref={trailRef}
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1.5px solid rgba(245, 230, 66, 0.4)",
          boxShadow: "0 0 18px 4px rgba(245, 158, 11, 0.18)",
          pointerEvents: "none",
          zIndex: 9998,
          willChange: "transform",
        }}
      />
    </>
  );
};
