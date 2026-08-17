import React, { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { InteractiveBall } from "./InteractiveBall";
import { RobotGuide } from "../RobotGuide";

export const HeroCanvas: React.FC = () => {
  return (
    <div className="relative w-full h-screen bg-[#040f08] flex flex-col overflow-hidden">
      {/* 2D Overlay (Gradient for readability) */}
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-[#040f08]/90 via-transparent to-[#040f08]/90 pointer-events-none" />

      {/* Fixed Navigation */}
      <header className="relative z-20 w-full px-6 py-6 md:px-12 md:py-8 flex justify-between items-center mix-blend-difference">
        <div className="font-display text-2xl tracking-widest text-white uppercase select-none">
          Matchday
        </div>
        <a
          href="#checker"
          className="text-sm font-bold uppercase tracking-wider text-[#f5e642] hover:text-white transition-colors duration-300 flex items-center gap-2"
        >
          Coach's Desk
          <svg fill="none" height="16" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="16" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14"></path>
            <path d="m12 5 7 7-7 7"></path>
          </svg>
        </a>
      </header>

      {/* Full-Screen 3D Interactive Canvas */}
      <div className="absolute inset-0 w-full h-full z-10">
        <Canvas
          className="w-full h-full"
          camera={{ position: [0, 0, 4.8], fov: 40 }}
          dpr={[1, 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: "high-performance",
          }}
        >
          <Suspense fallback={null}>
            <InteractiveBall />
          </Suspense>
        </Canvas>
      </div>

      {/* Main Hero Content (Typography & Accents) */}
      <main className="relative z-20 flex-1 flex flex-col items-center justify-centre pb-24 w-full px-4 text-center pointer-events-none">
        {/* Floodlight Background Effect */}
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <div className="w-[60vw] h-[60vw] md:w-[40vw] md:h-[40vw] max-w-[800px] max-h-[800px] rounded-full floodlight-accent blur-3xl opacity-50"></div>
        </div>

        {/* Dynamic contact shadow for the ball */}
        <div className="relative mb-6">
          <div className="w-36 h-6 bg-black/80 blur-lg rounded-[100%] mx-auto opacity-75"></div>
        </div>

        {/* Typography */}
        <div className="relative z-10 max-w-4xl mx-auto flex flex-col gap-2 md:gap-4 pointer-events-none">
          <h1 className="font-display text-6xl md:text-8xl lg:text-9xl text-white uppercase tracking-tighter drop-shadow-[0_4px_15px_rgba(0,0,0,0.8)] leading-[0.9]">
            Matchday
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-6 mt-4 md:mt-8 text-sm md:text-lg font-light text-white/80 tracking-wide">
            <p>Every squad has rules.</p>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[#f5e642]"></span>
            <p>Every selection gets checked.</p>
            <span className="hidden md:block w-1.5 h-1.5 rounded-full bg-[#f5e642]"></span>
            <p className="font-bold text-white">No shortcuts. Just the rules.</p>
          </div>
        </div>
      </main>

      {/* Footer / Scroll Indicator */}
      <footer className="relative z-20 w-full pb-8 pt-4 flex flex-col items-center justify-center pointer-events-auto">
        <a href="#checker" className="animate-bounce-subtle flex flex-col items-center gap-3">
          <div className="w-[1px] h-12 bg-gradient-to-b from-transparent to-[#f5e642]"></div>
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-[#f5e642] font-bold">
            Scroll to open
          </span>
        </a>
      </footer>

      {/* Keep the helpful robot guide in the corner */}
      <RobotGuide />
    </div>
  );
};
