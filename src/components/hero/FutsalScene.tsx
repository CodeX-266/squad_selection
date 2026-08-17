import React, { useRef, useMemo, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useScroll } from "@react-three/drei";
import * as THREE from "three";

// ─────────────────────────────────────────────────────────────────────────────
// Shared physics bus — written by ball, read by crowd meter & sparks
// ─────────────────────────────────────────────────────────────────────────────
const physicsState = {
  velY:     0,
  angularVel: 0,
  justBounced: false,
  bounceImpact: 0,
  posX: 0,
  posY: 0,
  posZ: 0,
};

// ── Procedural Futsal Match Ball Texture ─────────────────────────────────────
function createFutsalBallTextures() {
  const size = 2048;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#f3f4f6";
  ctx.fillRect(0, 0, size, size);

  // Leather grain noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 12;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  const cols = 6; const rows = 3;
  const cellW = size / cols; const cellH = size / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cx = c * cellW + cellW / 2;
      const cy = r * cellH + cellH / 2;
      const isAlt = (r + c) % 2 === 0;
      ctx.save(); ctx.translate(cx, cy);

      if (isAlt) {
        ctx.beginPath();
        for (let a = 0; a < 5; a++) {
          const ang = (a * Math.PI * 2) / 5 - Math.PI / 2;
          const rad = cellW * 0.32;
          if (a === 0) ctx.moveTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
          else ctx.lineTo(Math.cos(ang) * rad, Math.sin(ang) * rad);
        }
        ctx.closePath();
        ctx.fillStyle = "#111827"; ctx.fill();
        ctx.lineWidth = 8; ctx.strokeStyle = "#f59e0b"; ctx.stroke();
        ctx.beginPath(); ctx.arc(0, 0, cellW * 0.12, 0, Math.PI * 2);
        ctx.fillStyle = "#f59e0b"; ctx.fill();
        ctx.fillStyle = "#000"; ctx.font = "bold 26px sans-serif";
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText("MD", 0, 0);
      } else {
        ctx.beginPath();
        ctx.moveTo(-cellW * 0.35, -cellH * 0.2); ctx.lineTo(cellW * 0.35, 0);
        ctx.lineTo(-cellW * 0.35, cellH * 0.2); ctx.lineTo(-cellW * 0.2, 0);
        ctx.closePath(); ctx.fillStyle = "#10b981"; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, cellW * 0.28, 0, Math.PI * 2);
        ctx.lineWidth = 6; ctx.strokeStyle = "#38bdf8"; ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Seam grid
  ctx.strokeStyle = "#9ca3af"; ctx.lineWidth = 5;
  for (let c = 0; c <= cols; c++) { ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, size); ctx.stroke(); }
  for (let r = 0; r <= rows; r++) { ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(size, r * cellH); ctx.stroke(); }

  ctx.save(); ctx.translate(size * 0.25, size * 0.5);
  ctx.fillStyle = "#1e293b"; ctx.font = "900 48px sans-serif"; ctx.textAlign = "center";
  ctx.fillText("MATCHDAY", 0, -20);
  ctx.font = "600 24px monospace"; ctx.fillStyle = "#f59e0b";
  ctx.fillText("FUTSAL PRO 7", 0, 20); ctx.restore();

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.generateMipmaps = true;
  texture.minFilter = THREE.LinearMipmapLinearFilter;

  const bumpCanvas = document.createElement("canvas");
  bumpCanvas.width = 1024; bumpCanvas.height = 1024;
  const bCtx = bumpCanvas.getContext("2d")!;
  bCtx.fillStyle = "#808080"; bCtx.fillRect(0, 0, 1024, 1024);
  bCtx.strokeStyle = "#202020"; bCtx.lineWidth = 8;
  for (let c = 0; c <= cols; c++) { bCtx.beginPath(); bCtx.moveTo(c * (1024 / cols), 0); bCtx.lineTo(c * (1024 / cols), 1024); bCtx.stroke(); }
  for (let r = 0; r <= rows; r++) { bCtx.beginPath(); bCtx.moveTo(0, r * (1024 / rows)); bCtx.lineTo(1024, r * (1024 / rows)); bCtx.stroke(); }
  const bumpTexture = new THREE.CanvasTexture(bumpCanvas);
  bumpTexture.wrapS = bumpTexture.wrapT = THREE.RepeatWrapping;

  return { texture, bumpTexture };
}

// ── Physics constants ─────────────────────────────────────────────────────────
const BALL_RADIUS   = 0.38;
const GROUND_Y      = -1.5;
const GRAVITY       = -9.8;
const RESTITUTION   = 0.72;
const ROLL_FRICTION = 0.985;

// ── Impact Spark Particle System ─────────────────────────────────────────────
const MAX_SPARKS = 80;

const ImpactSparks: React.FC = () => {
  const pointsRef = useRef<THREE.Points>(null);
  const sparks = useRef<Array<{
    pos: THREE.Vector3; vel: THREE.Vector3; life: number; maxLife: number;
  }>>([]);

  const positions = useMemo(() => new Float32Array(MAX_SPARKS * 3), []);
  const colors    = useMemo(() => new Float32Array(MAX_SPARKS * 3), []);

  const emitSparks = useCallback((x: number, y: number, z: number, intensity: number) => {
    const count = Math.floor(intensity * 12 + 6);
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (Math.random() * 2 + 0.5) * intensity * 0.4;
      sparks.current.push({
        pos: new THREE.Vector3(x, y, z),
        vel: new THREE.Vector3(
          Math.cos(angle) * speed,
          Math.random() * speed * 1.5 + 0.5,
          Math.sin(angle) * speed
        ),
        life: 0,
        maxLife: Math.random() * 0.5 + 0.2,
      });
      if (sparks.current.length > MAX_SPARKS) sparks.current.shift();
    }
  }, []);

  // Expose emitter globally so ball can call it
  useEffect(() => {
    (window as any).__emitSparks = emitSparks;
    return () => { delete (window as any).__emitSparks; };
  }, [emitSparks]);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;

    for (let i = sparks.current.length - 1; i >= 0; i--) {
      const s = sparks.current[i];
      s.life += delta;
      if (s.life > s.maxLife) { sparks.current.splice(i, 1); continue; }
      s.vel.y += GRAVITY * delta * 0.4;
      s.pos.addScaledVector(s.vel, delta);
    }

    // Write positions & colors
    for (let i = 0; i < MAX_SPARKS; i++) {
      const s = sparks.current[i];
      if (s) {
        const t = s.life / s.maxLife;
        positions[i * 3]     = s.pos.x;
        positions[i * 3 + 1] = s.pos.y;
        positions[i * 3 + 2] = s.pos.z;
        // Gold → Red fade
        colors[i * 3]     = THREE.MathUtils.lerp(1.0, 0.8, t);
        colors[i * 3 + 1] = THREE.MathUtils.lerp(0.85, 0.1, t);
        colors[i * 3 + 2] = 0.0;
      } else {
        positions[i * 3] = positions[i * 3 + 1] = positions[i * 3 + 2] = 0;
        colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = 0;
      }
    }

    pointsRef.current.geometry.attributes.position.needsUpdate = true;
    pointsRef.current.geometry.attributes.color.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={MAX_SPARKS} args={[positions, 3]} />
        <bufferAttribute attach="attributes-color"    count={MAX_SPARKS} args={[colors, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        vertexColors
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
};

// ── Speed Motion Trail ────────────────────────────────────────────────────────
const MAX_TRAIL = 14;

const SpeedTrail: React.FC = () => {
  const trail = useRef<THREE.Vector3[]>([]);
  const instanceRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    if (!instanceRef.current) return;
    const { posX, posY, posZ, velY, angularVel } = physicsState;
    const speed = Math.abs(velY) + Math.abs(angularVel) * 0.05;

    // Only trail when moving fast
    if (speed > 2.0) {
      trail.current.push(new THREE.Vector3(posX, posY, posZ));
    }
    while (trail.current.length > MAX_TRAIL) trail.current.shift();

    // Render each trail sphere with decreasing size & opacity
    for (let i = 0; i < MAX_TRAIL; i++) {
      const pt = trail.current[MAX_TRAIL - 1 - i]; // oldest at back
      if (pt) {
        const t = (MAX_TRAIL - i) / MAX_TRAIL;
        dummy.position.copy(pt);
        dummy.scale.setScalar(BALL_RADIUS * t * 0.55);
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
        instanceRef.current.setColorAt?.(i, new THREE.Color().lerpColors(
          new THREE.Color("#f59e0b"),
          new THREE.Color("#10b981"),
          t
        ));
      } else {
        dummy.position.set(0, -999, 0);
        dummy.scale.setScalar(0);
        dummy.updateMatrix();
        instanceRef.current.setMatrixAt(i, dummy.matrix);
      }
    }
    instanceRef.current.instanceMatrix.needsUpdate = true;
    if (instanceRef.current.instanceColor) instanceRef.current.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={instanceRef} args={[undefined, undefined, MAX_TRAIL]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial
        transparent
        opacity={0.35}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </instancedMesh>
  );
};

// ── Rotating Stadium Spotlight Sweep ─────────────────────────────────────────
const SpotlightSweep: React.FC = () => {
  const spot1Ref = useRef<THREE.SpotLight>(null);
  const spot2Ref = useRef<THREE.SpotLight>(null);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (spot1Ref.current) {
      spot1Ref.current.position.x = Math.sin(t * 0.4) * 8;
      spot1Ref.current.position.z = Math.cos(t * 0.4) * 6;
      spot1Ref.current.target.position.set(
        Math.sin(t * 0.4 + 0.5) * 2,
        0,
        Math.cos(t * 0.4 + 0.5) * 2
      );
      spot1Ref.current.target.updateMatrixWorld();
    }
    if (spot2Ref.current) {
      spot2Ref.current.position.x = Math.sin(t * 0.3 + Math.PI) * 6;
      spot2Ref.current.position.z = Math.cos(t * 0.3 + Math.PI) * 5;
      spot2Ref.current.target.position.set(
        Math.sin(t * 0.3) * 1.5,
        0,
        Math.cos(t * 0.3) * 1.5
      );
      spot2Ref.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <spotLight
        ref={spot1Ref}
        position={[8, 10, 6]}
        intensity={18}
        color="#fef9c3"
        angle={0.25}
        penumbra={0.8}
        distance={25}
        decay={1.6}
        castShadow={false}
      />
      <spotLight
        ref={spot2Ref}
        position={[-6, 10, -5]}
        intensity={14}
        color="#bfdbfe"
        angle={0.3}
        penumbra={0.9}
        distance={22}
        decay={1.6}
        castShadow={false}
      />
    </>
  );
};

// ── Stadium Atmosphere Particles ─────────────────────────────────────────────
const StadiumParticles: React.FC<{ count?: number }> = ({ count = 80 }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const [positions] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3]     = (Math.random() - 0.5) * 16;
      pos[i * 3 + 1] = Math.random() * 8 - 1;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 14;
    }
    return [pos];
  }, [count]);

  useFrame((state) => {
    if (!pointsRef.current) return;
    const t = state.clock.elapsedTime * 0.3;
    const arr = pointsRef.current.geometry.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) arr[i * 3 + 1] += Math.sin(t + i) * 0.003;
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.07} color="#fef08a" transparent opacity={0.45}
        blending={THREE.AdditiveBlending} depthWrite={false} />
    </points>
  );
};

// ── Responsive 3D Futsal Ball with Click-to-Kick ─────────────────────────────
const ResponsiveBall: React.FC = () => {
  const ballGroupRef = useRef<THREE.Group>(null);
  const ballMeshRef  = useRef<THREE.Mesh>(null);
  const shadowRef    = useRef<THREE.Mesh>(null);
  const glowRingRef  = useRef<THREE.Mesh>(null);
  const clickFlashRef = useRef<THREE.Mesh>(null);
  const clickFlashTimer = useRef(0);

  const scroll = useScroll();
  const { mouse } = useThree();

  const { texture, bumpTexture } = useMemo(() => createFutsalBallTextures(), []);

  const physics = useRef({
    posY: 0.2, velY: 0.0, angularVel: 0.0,
    lastT: 0.0, posX: 0.0, posZ: 0.0,
  });

  // ── Click to kick ──────────────────────────────────────────────────────────
  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    const power = 6 + Math.random() * 5;
    physics.current.velY = power;
    physics.current.angularVel += power * 25;
    clickFlashTimer.current = 0.25;
  }, []);

  useFrame((state, delta) => {
    if (!ballGroupRef.current || !ballMeshRef.current) return;

    const ph = physics.current;
    const t  = scroll.offset;
    const dt = Math.min(delta, 0.05);
    const scrollDelta = t - ph.lastT;
    ph.lastT = t;

    // Scroll kick
    if (scrollDelta > 0.004) {
      const kickPower = THREE.MathUtils.clamp(scrollDelta * 200, 2.5, 9.0);
      ph.velY = kickPower;
      ph.angularVel += scrollDelta * 160;
    }

    // Gravity
    ph.velY  += GRAVITY * dt;
    ph.posY  += ph.velY * dt;

    // Squash/stretch
    let squashX = 1.0, squashY = 1.0;
    if (ph.posY <= GROUND_Y + BALL_RADIUS) {
      ph.posY = GROUND_Y + BALL_RADIUS;
      if (ph.velY < -0.3) {
        const impact = Math.abs(ph.velY);
        ph.velY *= -RESTITUTION;
        squashX = 1.0 + impact * 0.038;
        squashY = 1.0 - impact * 0.065;
        // Emit sparks on bounce
        if ((window as any).__emitSparks) {
          (window as any).__emitSparks(ph.posX, GROUND_Y + 0.1, ph.posZ, impact);
        }
      } else {
        ph.velY = 0;
      }
    }

    if (ph.velY > 1.5) {
      squashX = THREE.MathUtils.lerp(squashX, 1.0 - ph.velY * 0.02, 0.5);
      squashY = THREE.MathUtils.lerp(squashY, 1.0 + ph.velY * 0.04, 0.5);
    }

    // Lateral drift
    const targetX = Math.sin(t * Math.PI * 2.0) * 1.6 + mouse.x * 0.5;
    const targetZ = -t * 3.2;
    ph.posX = THREE.MathUtils.lerp(ph.posX, targetX, dt * 6);
    ph.posZ = THREE.MathUtils.lerp(ph.posZ, targetZ, dt * 5);

    // Apply
    ballGroupRef.current.position.set(ph.posX, ph.posY, ph.posZ);
    ballGroupRef.current.scale.set(squashX, squashY, squashX);

    // Spin
    ph.angularVel *= ROLL_FRICTION;
    ballMeshRef.current.rotation.x += dt * ph.angularVel * 0.6;
    ballMeshRef.current.rotation.y += dt * (ph.angularVel * 0.3 + 0.5);
    ballMeshRef.current.rotation.z += mouse.x * 0.04;

    // Shadow
    if (shadowRef.current) {
      const h = ph.posY - GROUND_Y;
      const fade  = THREE.MathUtils.clamp(1.0 - h * 0.35, 0.1, 0.7);
      const scale = THREE.MathUtils.clamp(1.2 - h * 0.09, 0.4, 1.2);
      shadowRef.current.position.set(ph.posX, GROUND_Y + 0.01, ph.posZ);
      shadowRef.current.scale.set(scale, scale, scale);
      (shadowRef.current.material as THREE.MeshBasicMaterial).opacity = fade;
    }

    // Glow ring
    if (glowRingRef.current) {
      glowRingRef.current.position.set(ph.posX, ph.posY, ph.posZ);
      glowRingRef.current.rotation.z += dt * 1.2;
      const pulse = 1.0 + Math.sin(state.clock.elapsedTime * 4) * 0.05;
      glowRingRef.current.scale.setScalar(pulse);
    }

    // Click flash ring
    if (clickFlashRef.current) {
      clickFlashTimer.current -= dt;
      if (clickFlashTimer.current > 0) {
        const progress = 1 - clickFlashTimer.current / 0.25;
        clickFlashRef.current.position.set(ph.posX, ph.posY, ph.posZ);
        clickFlashRef.current.scale.setScalar(1 + progress * 2.5);
        (clickFlashRef.current.material as THREE.MeshBasicMaterial).opacity =
          (1 - progress) * 0.9;
        clickFlashRef.current.visible = true;
      } else {
        clickFlashRef.current.visible = false;
      }
    }

    // Write to shared bus
    physicsState.velY       = ph.velY;
    physicsState.angularVel = ph.angularVel;
    physicsState.posX       = ph.posX;
    physicsState.posY       = ph.posY;
    physicsState.posZ       = ph.posZ;
  });

  return (
    <>
      {/* Ball */}
      <group ref={ballGroupRef} position={[0, 0.2, 0]} onClick={handleClick}>
        <mesh ref={ballMeshRef} castShadow receiveShadow>
          <sphereGeometry args={[BALL_RADIUS, 64, 64]} />
          <meshPhysicalMaterial
            map={texture}
            bumpMap={bumpTexture}
            bumpScale={0.04}
            roughness={0.22}
            metalness={0.12}
            clearcoat={0.65}
            clearcoatRoughness={0.16}
            reflectivity={0.9}
          />
        </mesh>
        {/* Invisible click hitbox — larger than ball for easier clicking */}
        <mesh>
          <sphereGeometry args={[BALL_RADIUS * 1.8, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
      </group>

      {/* Click flash ring */}
      <mesh ref={clickFlashRef} rotation={[-Math.PI / 2.5, 0, 0]} visible={false}>
        <ringGeometry args={[BALL_RADIUS * 0.9, BALL_RADIUS * 1.0, 48]} />
        <meshBasicMaterial color="#f59e0b" transparent opacity={0}
          side={THREE.DoubleSide} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* Speed ring */}
      <mesh ref={glowRingRef} rotation={[-Math.PI / 2.5, 0, 0]} position={[0, 0.2, 0]}>
        <ringGeometry args={[BALL_RADIUS * 1.12, BALL_RADIUS * 1.18, 64]} />
        <meshBasicMaterial color="#f59e0b" opacity={0.38} transparent
          side={THREE.DoubleSide} />
      </mesh>

      {/* Contact shadow */}
      <mesh ref={shadowRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, GROUND_Y + 0.01, 0]}>
        <circleGeometry args={[BALL_RADIUS * 1.4, 32]} />
        <meshBasicMaterial color="#000" transparent opacity={0.5} depthWrite={false} />
      </mesh>
    </>
  );
};

// ── Stadium Backdrop ──────────────────────────────────────────────────────────
const StadiumBackdrop: React.FC = () => (
  <group position={[0, -2.5, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[60, 40]} />
      <meshStandardMaterial color="#061a0f" roughness={0.85} metalness={0.1} />
    </mesh>
    <group position={[0, 0.01, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.3, 32]} />
        <meshBasicMaterial color="#fff" opacity={0.25} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.28, 64]} />
        <meshBasicMaterial color="#fff" opacity={0.2} transparent />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.08, 30]} />
        <meshBasicMaterial color="#fff" opacity={0.2} transparent />
      </mesh>
    </group>
  </group>
);

// ── Main Scene ────────────────────────────────────────────────────────────────
export const FutsalScene: React.FC = () => (
  <group>
    {/* Base lighting */}
    <ambientLight intensity={0.35} color="#c7d2fe" />
    <directionalLight
      position={[6, 12, 8]} intensity={3.0} color="#fffbeb"
      castShadow shadow-mapSize={[2048, 2048]}
      shadow-camera-near={0.5} shadow-camera-far={30}
      shadow-camera-left={-8} shadow-camera-right={8}
      shadow-camera-top={8} shadow-camera-bottom={-8}
      shadow-bias={-0.0001}
    />
    <directionalLight position={[-8, 6, -6]} intensity={1.8} color="#38bdf8" />
    <pointLight position={[5, 2, 3]} intensity={1.5} color="#f59e0b" distance={15} />
    <pointLight position={[0, -1, 0]} intensity={0.7} color="#10b981" distance={10} />

    {/* 🎬 Sweeping stadium spotlights — creates drama and motion */}
    <SpotlightSweep />

    {/* ⚽ Interactive 3D ball — click to kick, scroll to bounce */}
    <ResponsiveBall />

    {/* ✨ Impact sparks on ground bounce */}
    <ImpactSparks />

    {/* 💨 Speed motion trail */}
    <SpeedTrail />

    {/* 🌫 Atmosphere dust */}
    <StadiumParticles count={70} />

    {/* 🏟 Pitch floor */}
    <StadiumBackdrop />
  </group>
);
