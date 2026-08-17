import React, { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

// ── Realistic Pro Match Ball Texture Generator ──────────────────────────────
function generateMatchBallTextures(): {
  colorMap: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 2048;

  // 1. Color Canvas
  const colorCanvas = document.createElement("canvas");
  colorCanvas.width = size;
  colorCanvas.height = size;
  const ctx = colorCanvas.getContext("2d")!;

  // 2. Bump Canvas (grayscale height for embossed seams and micro-dimples)
  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext("2d")!;

  // 3. Roughness Canvas
  const roughCanvas = document.createElement("canvas");
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext("2d")!;

  // ── Base Background: Crisp Pearlescent White Leather ──
  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, "#ffffff");
  baseGrad.addColorStop(0.5, "#f4f6f8");
  baseGrad.addColorStop(1, "#eaedf0");
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Bump neutral base
  bCtx.fillStyle = "#808080";
  bCtx.fillRect(0, 0, size, size);

  // Roughness base (satin synthetic leather ~ 0.35)
  rCtx.fillStyle = "#555555";
  rCtx.fillRect(0, 0, size, size);

  // ── Micro-dimple / Aerowsculpt Grain Texture ──
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  const bImgData = bCtx.getImageData(0, 0, size, size);
  const bData = bImgData.data;

  // Generate subtle micro-pore leather grain
  for (let i = 0; i < data.length; i += 4) {
    const grain = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + grain));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + grain));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + grain));

    const bumpNoise = (Math.random() - 0.5) * 14;
    bData[i] = Math.min(255, Math.max(0, bData[i] + bumpNoise));
    bData[i + 1] = bData[i];
    bData[i + 2] = bData[i];
  }
  ctx.putImageData(imgData, 0, 0);
  bCtx.putImageData(bImgData, 0, 0);

  // ── Modern Geometric Speed Decals / Flame Ribbons ──
  const drawDecalRibbon = (
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    ctrl1X: number,
    ctrl1Y: number,
    ctrl2X: number,
    ctrl2Y: number,
    width: number,
    color1: string,
    color2: string
  ) => {
    // Primary ribbon
    const grad = ctx.createLinearGradient(startX, startY, endX, endY);
    grad.addColorStop(0, color1);
    grad.addColorStop(0.5, color2);
    grad.addColorStop(1, "#07140b");

    ctx.save();
    ctx.strokeStyle = grad;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
    ctx.stroke();

    // Dark accent edge
    ctx.strokeStyle = "rgba(4, 15, 8, 0.85)";
    ctx.lineWidth = width * 0.22;
    ctx.stroke();

    // Neon gold highlight strip
    ctx.strokeStyle = "#f5e642";
    ctx.lineWidth = width * 0.12;
    ctx.stroke();
    ctx.restore();

    // Mark glossy roughness on decals
    rCtx.save();
    rCtx.strokeStyle = "#202020"; // glossy
    rCtx.lineWidth = width;
    rCtx.beginPath();
    rCtx.moveTo(startX, startY);
    rCtx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
    rCtx.stroke();
    rCtx.restore();

    // Slight raised bump on decals
    bCtx.save();
    bCtx.strokeStyle = "#9c9c9c";
    bCtx.lineWidth = width;
    bCtx.beginPath();
    bCtx.moveTo(startX, startY);
    bCtx.bezierCurveTo(ctrl1X, ctrl1Y, ctrl2X, ctrl2Y, endX, endY);
    bCtx.stroke();
    bCtx.restore();
  };

  // Multiple intersecting aerodynamic swooshes
  drawDecalRibbon(100, 300, 1900, 700, 600, 900, 1400, 100, 120, "#f5e642", "#10b981");
  drawDecalRibbon(200, 1600, 1800, 1300, 700, 1000, 1300, 1900, 120, "#0ea5e9", "#f5e642");
  drawDecalRibbon(1700, 200, 300, 1800, 1500, 1200, 500, 800, 100, "#10b981", "#0ea5e9");

  // ── Modern Pro Thermo-Bonded Panel Seams ──
  const drawPanelSeams = () => {
    ctx.save();
    bCtx.save();

    const panelCenters = [
      { x: 512, y: 512, r: 240 },
      { x: 1536, y: 512, r: 240 },
      { x: 512, y: 1536, r: 240 },
      { x: 1536, y: 1536, r: 240 },
      { x: 1024, y: 1024, r: 300 },
      { x: 1024, y: 180, r: 200 },
      { x: 1024, y: 1860, r: 200 },
    ];

    panelCenters.forEach(({ x, y, r }) => {
      // Draw curved polygon panels
      ctx.strokeStyle = "rgba(10, 15, 12, 0.75)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 3) {
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (a === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // Deep recessed bump seam
      bCtx.strokeStyle = "#101010"; // deeply recessed
      bCtx.lineWidth = 10;
      bCtx.beginPath();
      for (let a = 0; a <= Math.PI * 2; a += Math.PI / 3) {
        const px = x + Math.cos(a) * r;
        const py = y + Math.sin(a) * r;
        if (a === 0) bCtx.moveTo(px, py);
        else bCtx.lineTo(px, py);
      }
      bCtx.closePath();
      bCtx.stroke();

      // Raised seam rim
      bCtx.strokeStyle = "#b0b0b0";
      bCtx.lineWidth = 3;
      bCtx.stroke();

      // Roughness in seam grooves
      rCtx.strokeStyle = "#cccccc"; // matte seam
      rCtx.lineWidth = 10;
      rCtx.stroke();
    });

    // Connecting seam arcs across the sphere
    const seamCurves = [
      [0, 512, 2048, 512, 1024, 700],
      [0, 1536, 2048, 1536, 1024, 1348],
      [512, 0, 512, 2048, 700, 1024],
      [1536, 0, 1536, 2048, 1348, 1024],
    ];

    seamCurves.forEach(([x1, y1, x2, y2, cx, cy]) => {
      ctx.strokeStyle = "rgba(10, 15, 12, 0.75)";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.quadraticCurveTo(cx, cy, x2, y2);
      ctx.stroke();

      bCtx.strokeStyle = "#101010";
      bCtx.lineWidth = 8;
      bCtx.beginPath();
      bCtx.moveTo(x1, y1);
      bCtx.quadraticCurveTo(cx, cy, x2, y2);
      bCtx.stroke();
    });

    ctx.restore();
    bCtx.restore();
  };

  drawPanelSeams();

  // ── Pro Branding & Official Certification Seals ──
  const drawBrandingBadges = () => {
    ctx.save();

    // 1. Central Badge: "MATCHDAY PRO"
    ctx.translate(1024, 1024);

    // Badge Background Hexagon
    ctx.fillStyle = "#0d1410";
    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) {
      const hx = Math.cos(a) * 160;
      const hy = Math.sin(a) * 160;
      if (a === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "#f5e642";
    ctx.lineWidth = 8;
    ctx.stroke();

    // Typography
    ctx.fillStyle = "#f5e642";
    ctx.font = "bold 44px 'Anton', 'Impact', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("MATCHDAY", 0, -32);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 20px 'JetBrains Mono', monospace";
    ctx.letterSpacing = "6px";
    ctx.fillText("PRO FUTSAL", 0, 12);

    ctx.fillStyle = "#a7c4b5";
    ctx.font = "bold 13px 'JetBrains Mono', monospace";
    ctx.fillText("SIZE 4 • LOW REBOUND", 0, 46);

    // Star accent
    ctx.fillStyle = "#f5e642";
    ctx.font = "18px sans-serif";
    ctx.fillText("★ ★ ★", 0, 78);

    ctx.restore();

    // 2. Official Quality Seal at panel (512, 512)
    ctx.save();
    ctx.translate(512, 512);
    ctx.rotate(0.35);

    ctx.fillStyle = "rgba(13, 20, 16, 0.9)";
    ctx.beginPath();
    ctx.arc(0, 0, 95, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#10b981";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TOURNAMENT", 0, -26);
    ctx.font = "bold 22px 'Anton', sans-serif";
    ctx.fillStyle = "#10b981";
    ctx.fillText("APPROVED", 0, 2);
    ctx.font = "bold 12px monospace";
    ctx.fillStyle = "#a7c4b5";
    ctx.fillText("OFFICIAL SPEC", 0, 28);

    ctx.restore();
  };

  drawBrandingBadges();

  // Create Three.js Textures
  const colorMap = new THREE.CanvasTexture(colorCanvas);
  colorMap.anisotropy = 8;
  colorMap.colorSpace = THREE.SRGBColorSpace;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 8;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = 8;

  return { colorMap, bumpMap, roughnessMap };
}

// ── Interactive 3D Ball Component ─────────────────────────────────────────────
export const InteractiveBall: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ballMeshRef = useRef<THREE.Mesh>(null);
  const { mouse } = useThree();

  const { colorMap, bumpMap, roughnessMap } = useMemo(
    () => generateMatchBallTextures(),
    []
  );

  const BASE_Y = 0.05; // Rest height centered above typography

  // Physics state
  const physics = useRef({
    posY: 0,
    velY: 0,
    rotX: 0,
    rotY: 0,
    spinVelX: 0,
    spinVelY: 0.002,
    targetMouseRotX: 0,
    targetMouseRotY: 0,
    scaleX: 1,
    scaleY: 1,
    scaleZ: 1,
    isAirborne: false,
  });

  // Tap / Kick Interaction — Launches Directly Out of Screen & Falls Back Down
  const handleKick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const p = physics.current;

    // Powerful upward kick impulse that shoots completely off the top of the screen
    p.velY = 0.14;
    p.isAirborne = true;

    // Forward revolution roll (pure vertical axis spin)
    p.spinVelX = -0.08;

    // Upward aerodynamic stretch on kick launch
    p.scaleY = 1.18;
    p.scaleX = 0.92;
    p.scaleZ = 0.92;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !ballMeshRef.current) return;
    const p = physics.current;

    // 1. Mouse Follow / Inertial Tilt
    p.targetMouseRotX = mouse.y * 0.9;
    p.targetMouseRotY = mouse.x * 1.4;

    // 2. Scroll-linked subtle rotation
    const scrollY = typeof window !== "undefined" ? window.scrollY : 0;
    const scrollTorque = scrollY * 0.002;

    // 3. Update 3D Rotations with Inertial Spin
    p.rotX += p.spinVelX;
    p.rotY += p.spinVelY;

    // Apply spin air resistance
    p.spinVelX = THREE.MathUtils.lerp(p.spinVelX, 0, delta * 2.5);
    p.spinVelY = THREE.MathUtils.lerp(p.spinVelY, 0.002, delta * 1.5);

    // Apply rotation to group
    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      p.rotX + p.targetMouseRotX + scrollTorque,
      delta * 6
    );
    groupRef.current.rotation.y = THREE.MathUtils.lerp(
      groupRef.current.rotation.y,
      p.rotY + p.targetMouseRotY,
      delta * 6
    );
    groupRef.current.rotation.z = 0; // Lock Z to keep trajectory purely vertical

    // 4. Gravity and Elastic Flight/Bounce Physics
    if (p.isAirborne || p.posY > 0 || p.velY !== 0) {
      const gravity = 0.0026;
      p.velY -= gravity;
      p.posY += p.velY;

      // Floor Collision & Rebound at BASE_Y
      if (p.posY <= 0) {
        p.posY = 0;
        const rebound = -p.velY * 0.55; // Futsal low-rebound spec
        p.velY = rebound;

        // Dynamic squash on landing impact
        if (Math.abs(rebound) > 0.008) {
          p.scaleY = THREE.MathUtils.clamp(1 - Math.abs(rebound) * 4.5, 0.78, 1);
          p.scaleX = THREE.MathUtils.clamp(1 + Math.abs(rebound) * 3.0, 1, 1.15);
          p.scaleZ = p.scaleX;
        } else {
          p.velY = 0;
          p.isAirborne = false;
        }
      }
    }

    // 5. Spring Recovery for Squash & Stretch
    p.scaleY = THREE.MathUtils.lerp(p.scaleY, 1, delta * 10);
    p.scaleX = THREE.MathUtils.lerp(p.scaleX, 1, delta * 10);
    p.scaleZ = THREE.MathUtils.lerp(p.scaleZ, 1, delta * 10);

    ballMeshRef.current.scale.set(p.scaleX, p.scaleY, p.scaleZ);

    // 6. Smooth Idle Breathing Hover Float
    const idleFloat = Math.sin(performance.now() * 0.0016) * 0.035;
    groupRef.current.position.y = BASE_Y + p.posY + idleFloat;
    groupRef.current.position.x = 0;
    groupRef.current.position.z = 0;
  });

  return (
    <group ref={groupRef} onClick={handleKick}>
      {/* ── Realistic Studio / Stadium Lighting Setup ── */}
      <ambientLight intensity={1.3} />

      {/* Main Overhead Key Light */}
      <directionalLight
        position={[3, 6, 4]}
        intensity={3.4}
        color="#ffffff"
        castShadow
      />

      {/* Warm Golden Pitch Floodlight Rim */}
      <directionalLight
        position={[-3, 3, -2]}
        intensity={3.0}
        color="#f5e642"
      />

      {/* Cool Stadium Cyan Fill */}
      <directionalLight
        position={[2, -3, 2]}
        intensity={1.5}
        color="#38bdf8"
      />

      {/* Soft Ground Pitch Bounce Light */}
      <directionalLight
        position={[0, -4, 0]}
        intensity={0.9}
        color="#10b981"
      />

      {/* ── 3D Ball Sphere (Standard Pro Diameter) ── */}
      <mesh ref={ballMeshRef} castShadow receiveShadow>
        <sphereGeometry args={[0.4, 64, 64]} />
        <meshStandardMaterial
          map={colorMap}
          bumpMap={bumpMap}
          bumpScale={0.038}
          roughnessMap={roughnessMap}
          roughness={0.35}
          metalness={0.14}
          envMapIntensity={1.3}
        />
      </mesh>
    </group>
  );
};
