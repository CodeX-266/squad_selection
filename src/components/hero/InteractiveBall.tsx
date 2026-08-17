import React, { useRef, useMemo, useCallback } from "react";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import * as THREE from "three";

// Procedural Futsal Match Ball Texture
function createFutsalBallTextures() {
  const size = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Base
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, size, size);

  // Add subtle leather noise
  const imgData = ctx.getImageData(0, 0, size, size);
  const data = imgData.data;
  for (let i = 0; i < data.length; i += 4) {
    const n = (Math.random() - 0.5) * 8;
    data[i] = Math.min(255, Math.max(0, data[i] + n));
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + n));
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + n));
  }
  ctx.putImageData(imgData, 0, 0);

  // Draw some modern futsal panel lines
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#1a1a1a";
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const y = (i / 6) * size;
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.3, y + 50, size * 0.7, y - 50, size, y);
  }
  for (let i = 0; i < 6; i++) {
    const x = (i / 6) * size;
    ctx.moveTo(x, 0);
    ctx.bezierCurveTo(x + 50, size * 0.3, x - 50, size * 0.7, x, size);
  }
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  return texture;
}

export const InteractiveBall: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const ballMeshRef = useRef<THREE.Mesh>(null);
  
  const { mouse } = useThree();
  const texture = useMemo(() => createFutsalBallTextures(), []);
  
  const state = useRef({
    targetRotX: 0,
    targetRotY: 0,
    currentRotX: 0,
    currentRotY: 0,
    isDragging: false,
    velY: 0,
    posY: 0,
    kickScaleY: 1,
    kickScaleX: 1,
  });

  const handleClick = useCallback((e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    state.current.velY = 0.15; // Kick upward
    state.current.targetRotX += Math.PI * 2;
    state.current.targetRotY += Math.random() * Math.PI;
  }, []);

  useFrame((_, delta) => {
    if (!groupRef.current || !ballMeshRef.current) return;
    const st = state.current;

    // Smooth follow mouse for rotation
    st.targetRotX = mouse.y * 1.5;
    st.targetRotY = mouse.x * 2.5;

    // Apply scroll rotation based on window.scrollY
    const scrollY = window.scrollY || 0;
    st.targetRotX += scrollY * 0.005;

    // Lerp rotation
    st.currentRotX = THREE.MathUtils.lerp(st.currentRotX, st.targetRotX, delta * 4);
    st.currentRotY = THREE.MathUtils.lerp(st.currentRotY, st.targetRotY, delta * 4);
    
    // Continuous idle spin
    groupRef.current.rotation.y = st.currentRotY + performance.now() * 0.0002;
    groupRef.current.rotation.x = st.currentRotX;

    // Gravity / Kick Physics
    if (st.posY > 0 || st.velY > 0) {
      st.velY -= 0.005; // gravity
      st.posY += st.velY;
      
      // Ground collision
      if (st.posY <= 0) {
        st.posY = 0;
        st.velY = -st.velY * 0.6; // bounce
        if (Math.abs(st.velY) < 0.01) st.velY = 0;
        
        // Squash on impact
        if (st.velY > 0.02) {
            st.kickScaleY = 0.8;
            st.kickScaleX = 1.1;
        }
      }
    }

    // Recover squash/stretch
    st.kickScaleY = THREE.MathUtils.lerp(st.kickScaleY, 1, delta * 10);
    st.kickScaleX = THREE.MathUtils.lerp(st.kickScaleX, 1, delta * 10);

    ballMeshRef.current.scale.set(st.kickScaleX, st.kickScaleY, st.kickScaleX);
    groupRef.current.position.y = Math.sin(performance.now() * 0.002) * 0.1 + st.posY;
  });

  return (
    <group ref={groupRef} onClick={handleClick}>
      {/* Lights tailored to the ball */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[2, 5, 2]} intensity={2.5} color="#ffffff" castShadow />
      <directionalLight position={[-2, -1, 3]} intensity={1.5} color="#f5e642" />
      <directionalLight position={[0, -2, -3]} intensity={1.0} color="#38bdf8" />
      
      <mesh ref={ballMeshRef} castShadow receiveShadow>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial 
          map={texture} 
          roughness={0.4} 
          metalness={0.1}
          envMapIntensity={1.0}
        />
      </mesh>
    </group>
  );
};
