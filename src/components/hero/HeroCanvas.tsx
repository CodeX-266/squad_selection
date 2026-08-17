import React, { Suspense, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ScrollControls, useScroll } from "@react-three/drei";
import * as THREE from "three";
import { FutsalScene } from "./FutsalScene";
import { HeroText } from "./HeroText";
import { RobotGuide } from "../RobotGuide";

// ── Cinematic Responsive Camera Rig ──────────────────────────────────────────
const CameraRig: React.FC<{ onProgress: (p: number) => void }> = ({
  onProgress,
}) => {
  const scroll = useScroll();
  const { camera, mouse } = useThree();

  const startPos = new THREE.Vector3(0, 0.3, 6.2);
  const endPos = new THREE.Vector3(0, 1.2, 8.5);
  const targetLook = new THREE.Vector3(0, 0, 0);

  useFrame((_, delta) => {
    const t = scroll.offset; // 0 → 1
    onProgress(t);

    // Smooth lerp based on scroll
    const target = startPos.clone().lerp(endPos, t);
    // Subtle mouse parallax for cinematic depth
    target.x += mouse.x * 0.4;
    target.y += mouse.y * 0.3;

    camera.position.lerp(target, delta * 5);
    camera.lookAt(targetLook.clone().add(new THREE.Vector3(mouse.x * 0.2, -t * 0.8, 0)));
  });

  return null;
};

// ── Canvas wrapper ────────────────────────────────────────────────────────────
export const HeroCanvas: React.FC = () => {
  const [scrollProgress, setScrollProgress] = useState(0);

  return (
    <div className="relative w-full h-screen bg-[#040f08]">
      {/* 3D Canvas with WebGL Optimization */}
      <Canvas
        className="absolute inset-0"
        camera={{ position: [0, 0.3, 6.2], fov: 45 }}
        shadows
        dpr={[1, 2]} // Performance optimized DPR
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
        style={{ background: "#040f08" }}
        aria-hidden="true"
      >
        <fog attach="fog" args={["#040f08", 8, 22]} />
        <Suspense fallback={null}>
          <ScrollControls pages={4} damping={0.25} distance={1}>
            <CameraRig onProgress={setScrollProgress} />
            <FutsalScene />
          </ScrollControls>
        </Suspense>
      </Canvas>

      {/* 2D text overlay — composited over Canvas */}
      <HeroText scrollProgress={scrollProgress} />

      {/* 3D Robot onboarding guide on hero landing page only */}
      <RobotGuide />

      {/* Scroll nudge indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce pointer-events-none z-10"
        aria-hidden="true"
      >
        <span className="font-mono text-xs uppercase tracking-widest text-chalk/40">
          Scroll
        </span>
        <div className="h-6 w-px bg-gradient-to-b from-chalk/40 to-transparent" />
      </div>
    </div>
  );
};
