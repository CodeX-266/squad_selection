import React, { useRef, useEffect, useState, useCallback } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { motion, AnimatePresence } from "framer-motion";

// ── Shared layout constants — single source of truth so the dialogue
// bubble, portal hole, and robot canvas all share the same horizontal
// center line no matter what padding/margins change later. ──────────────
const WIDGET_WIDTH = 280;
const BUBBLE_WIDTH = WIDGET_WIDTH; // was hardcoded to 310 before — now derived
const ROBOT_HEIGHT = 200;

// ── Chat dialogue script ──────────────────────────────────────────────────────
const DIALOGUE: Array<{
  text: string;
  choices?: Array<{ label: string; next: number }>;
}> = [
    {
      text: "Hey there! I'm M.A.R.C. — your Matchday AI Roster Coach.",
      choices: [{ label: "Nice to meet you!", next: 1 }],
    },
    {
      text: "Let me show you around MATCHDAY — the Squad Constraint Checker.",
      choices: [{ label: "Go on", next: 2 }],
    },
    {
      text: "You're in the HERO zone right now. There's a live 3D futsal ball floating around here.",
      choices: [
        { label: "Can I interact with it?", next: 3 },
        { label: "Tell me about the app", next: 5 },
      ],
    },
    {
      text: "Absolutely. Click the ball anywhere to kick it. Scroll down to make it bounce. Try it!",
      choices: [{ label: "Cool, what else?", next: 4 }],
    },
    {
      text: "As you scroll, the camera pans and three different text slides fade in one by one.",
      choices: [{ label: "Tell me about the app", next: 5 }],
    },
    {
      text: "Scroll past the hero and you'll reach the Coach's Desk — a squad validation tool.",
      choices: [{ label: "What does it check?", next: 6 }],
    },
    {
      text: "It checks: 7 players selected, exactly 1 GK, valid positions, and max 2 per cohort year.",
      choices: [{ label: "No auto-picks?", next: 7 }],
    },
    {
      text: "Correct. No auto-suggestions. It only validates — you make every call. Just the rules.",
      choices: [{ label: "Got it, I'm ready", next: 8 }],
    },
    {
      text: "You're all set, Coach. Click the ball, build your squad, and validate. Good luck.",
      choices: [{ label: "Close guide", next: -1 }],
    },
  ];

// ── Load 3D GLTF Robot Model ─────────────────────────────────────────────────
function initRobotScene(canvas: HTMLCanvasElement, container: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
  });

  // Set pixel ratio BEFORE the first setSize call — three.js uses the
  // current pixel ratio when computing the drawing-buffer size, so doing
  // this out of order (as before) meant the very first frame was sized
  // against the wrong buffer resolution.
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 50);
  camera.position.set(0, 0.5, 3.1);
  camera.lookAt(0, 0.4, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 1.6));

  const key = new THREE.DirectionalLight(0xffffff, 3.0);
  key.position.set(2, 4, 4);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0x38bdf8, 2.0);
  fill.position.set(-3, 1, 2);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(0xf59e0b, 3.5);
  rim.position.set(-1, 2, -3);
  scene.add(rim);

  const robotGroup = new THREE.Group();
  scene.add(robotGroup);

  let mixer: THREE.AnimationMixer | null = null;
  let activeAction: THREE.AnimationAction | null = null;

  // Resize the renderer + camera aspect to match the CONTAINER's actual
  // rendered size, not a value read once at mount. This is what keeps the
  // model centered and undistorted across window resizes, breakpoint
  // changes, and DPR differences — the single biggest source of "the
  // robot looks off-center/stretched" bugs in the original version.
  function syncSize() {
    const w = container.clientWidth || WIDGET_WIDTH;
    const h = container.clientHeight || ROBOT_HEIGHT;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    // updateStyle=false: we manage CSS sizing ourselves via the parent,
    // this only sets the internal drawing buffer.
    renderer.setSize(w, h, false);
  }
  syncSize();

  const resizeObserver = new ResizeObserver(syncSize);
  resizeObserver.observe(container);

  const loader = new GLTFLoader();
  loader.load(
    "/robot.glb",
    (gltf) => {
      const model = gltf.scene;

      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());

      // Center the pivot explicitly (was `+=` before, which only worked
      // because position started at (0,0,0) — this is correct regardless
      // of the model's starting transform).
      model.position.set(-center.x, -center.y + 0.15, -center.z);

      const maxDim = Math.max(size.x, size.y, size.z) || 1;
      const targetScale = 2.0 / maxDim;
      model.scale.setScalar(targetScale);

      model.rotation.y = 0;

      model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          mesh.castShadow = true;
          mesh.receiveShadow = true;

          const mat = (mesh.material as any);
          if (mat?.isMeshStandardMaterial) {
            mat.roughness = Math.min(mat.roughness, 0.45);
            if (mat.emissive && mat.emissive.getHex() > 0) {
              mat.emissiveIntensity = 2.5;
            }
          }
        }
      });

      robotGroup.add(model);

      if (gltf.animations && gltf.animations.length > 0) {
        mixer = new THREE.AnimationMixer(model);
        activeAction = mixer.clipAction(gltf.animations[0]);
        activeAction.play();
      }
    },
    undefined,
    (error) => {
      console.error("Failed to load /robot.glb:", error);
    }
  );

  let raf = 0;
  let stopped = false;
  let lastTime = performance.now();
  const startTime = performance.now();

  function animate() {
    if (stopped) return;
    raf = requestAnimationFrame(animate);
    const now = performance.now();
    const dt = (now - lastTime) / 1000;
    lastTime = now;
    const elapsed = (now - startTime) / 1000;

    if (mixer) mixer.update(dt);

    robotGroup.position.y = Math.sin(elapsed * 1.5) * 0.05;
    robotGroup.rotation.y = Math.PI + Math.sin(elapsed * 0.4) * 0.08;

    renderer.render(scene, camera);
  }

  raf = requestAnimationFrame(animate);

  return () => {
    stopped = true;
    cancelAnimationFrame(raf);
    resizeObserver.disconnect();
    renderer.dispose();
  };
}

// ── Typewriter hook ───────────────────────────────────────────────────────────
function useTypewriter(text: string, speed = 28, enabled = true) {
  const [displayed, setDisplayed] = useState("");

  useEffect(() => {
    if (!enabled) {
      setDisplayed("");
      return;
    }
    setDisplayed("");
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 1000 / speed);
    return () => clearInterval(id);
  }, [text, speed, enabled]);

  return displayed;
}

// ── Main RobotGuide Component ─────────────────────────────────────────────────
export const RobotGuide: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"waiting" | "thinking" | "talking">("waiting");
  const [dismissed, setDismissed] = useState(false);

  const current = DIALOGUE[step] ?? DIALOGUE[0];
  const displayed = useTypewriter(current.text, 32, phase === "talking");

  useEffect(() => {
    if (!canvasRef.current || !canvasContainerRef.current) return;
    if (cleanupRef.current) cleanupRef.current();
    cleanupRef.current = initRobotScene(canvasRef.current, canvasContainerRef.current) ?? null;
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, []);

  // Entrance sequence: 1s delay -> robot floats in & thinks -> starts talking
  useEffect(() => {
    const t1 = setTimeout(() => setPhase("thinking"), 1000);
    const t2 = setTimeout(() => setPhase("talking"), 2800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  const handleChoice = useCallback((next: number) => {
    if (next === -1) {
      setDismissed(true);
    } else {
      setStep(next);
    }
  }, []);

  if (dismissed) return null;

  const isVisible = phase !== "waiting";

  return (
    <div
      aria-live="polite"
      aria-label="MARC Robot Guide"
      style={{
        position: "absolute",
        bottom: 24,
        right: 24,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        pointerEvents: "auto",
        width: WIDGET_WIDTH,
        // Clamp so the widget can't overflow off-screen on narrow
        // viewports — previously fixed at 320px with no ceiling.
        maxWidth: "calc(100vw - 32px)",
        boxSizing: "border-box",
      }}
    >
      {/* ── 1. DIALOGUE & THINKING BUBBLE ── */}
      <AnimatePresence mode="wait">
        {phase === "thinking" && (
          <motion.div
            key="thinking-bubble"
            initial={{ opacity: 0, scale: 0.5, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.7, y: -10 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            style={{
              marginBottom: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                background:
                  "linear-gradient(135deg, rgba(15, 23, 42, 0.9) 0%, rgba(30, 41, 59, 0.9) 100%)",
                backdropFilter: "blur(12px)",
                WebkitBackdropFilter: "blur(12px)",
                border: "1px solid rgba(245, 158, 11, 0.4)",
                borderRadius: 24,
                padding: "10px 20px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                boxShadow: "0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(245, 158, 11, 0.2)",
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "monospace",
                  color: "#f59e0b",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                }}
              >
                M.A.R.C.
              </span>
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {[0, 1, 2].map((i) => (
                  <motion.div
                    key={i}
                    animate={{
                      y: [0, -6, 0],
                      opacity: [0.4, 1, 0.4],
                      backgroundColor: ["#f59e0b", "#38bdf8", "#f59e0b"],
                    }}
                    transition={{
                      duration: 0.9,
                      repeat: Infinity,
                      delay: i * 0.2,
                      ease: "easeInOut",
                    }}
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      backgroundColor: "#f59e0b",
                    }}
                  />
                ))}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 3,
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.6)",
                }}
              />
              <div
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: "50%",
                  background: "rgba(245, 158, 11, 0.4)",
                }}
              />
            </div>
          </motion.div>
        )}

        {phase === "talking" && (
          <motion.div
            key="talking-bubble"
            initial={{ opacity: 0, scale: 0.7, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ type: "spring", damping: 20, stiffness: 220 }}
            style={{
              width: "100%",
              maxWidth: BUBBLE_WIDTH,
              background:
                "linear-gradient(160deg, rgba(8, 12, 24, 0.95) 0%, rgba(15, 23, 42, 0.95) 50%, rgba(10, 18, 30, 0.95) 100%)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              border: "1px solid rgba(56, 189, 248, 0.25)",
              borderTop: "2px solid rgba(56, 189, 248, 0.5)",
              borderRadius: 14,
              padding: "16px 18px 14px",
              boxShadow:
                "0 12px 36px 0 rgba(0, 0, 0, 0.65), 0 0 18px rgba(56, 189, 248, 0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
              position: "relative",
              marginBottom: 8,
              fontVariantLigatures: "none",
              boxSizing: "border-box",
            }}
          >
            <button
              onClick={() => setDismissed(true)}
              aria-label="Close guide"
              style={{
                position: "absolute",
                top: 8,
                right: 10,
                background: "none",
                border: "none",
                color: "rgba(255, 255, 255, 0.45)",
                fontSize: 14,
                cursor: "pointer",
                lineHeight: 1,
                padding: 2,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#38bdf8")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255, 255, 255, 0.45)")}
            >
              ✕
            </button>

            <div
              style={{
                fontSize: 9,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                letterSpacing: "0.2em",
                color: "#38bdf8",
                marginBottom: 8,
                textTransform: "uppercase",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: "#22d3ee",
                  boxShadow: "0 0 6px #22d3ee",
                  display: "inline-block",
                }}
              />
              M.A.R.C. — Thinking
            </div>

            <p
              style={{
                color: "#f8fafc",
                fontSize: 13.5,
                lineHeight: 1.6,
                margin: 0,
                minHeight: 52,
                fontFamily: "Inter, system-ui, sans-serif",
              }}
            >
              {displayed}
              {displayed.length < current.text.length && (
                <span style={{ opacity: 0.5, animation: "blink 0.8s step-end infinite" }}>▌</span>
              )}
            </p>

            {displayed.length >= current.text.length && current.choices && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 12 }}>
                {current.choices.map((c) => (
                  <button
                    key={c.next}
                    onClick={() => handleChoice(c.next)}
                    style={{
                      background: "rgba(56, 189, 248, 0.08)",
                      border: "1px solid rgba(56, 189, 248, 0.3)",
                      borderRadius: 6,
                      color: "#bae6fd",
                      fontSize: 12,
                      fontFamily: "Inter, system-ui, sans-serif",
                      padding: "7px 14px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "all 0.2s",
                      letterSpacing: "0.02em",
                      fontWeight: "500",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.2)";
                      e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.7)";
                      e.currentTarget.style.color = "#ffffff";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(56, 189, 248, 0.08)";
                      e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.3)";
                      e.currentTarget.style.color = "#bae6fd";
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}

            {/* Pointer stem — left is fixed at 50%, which now reliably
                points at the robot below since both this bubble and the
                canvas container share WIDGET_WIDTH as their center axis. */}
            <div
              style={{
                position: "absolute",
                bottom: -6,
                left: "50%",
                transform: "translateX(-50%) rotate(45deg)",
                width: 12,
                height: 12,
                background: "rgba(10, 18, 30, 0.95)",
                borderRight: "1px solid rgba(56, 189, 248, 0.25)",
                borderBottom: "1px solid rgba(56, 189, 248, 0.25)",
                borderRadius: "0 0 2px 0",
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 2. ROBOT 3D CANVAS (Completely floating) ── */}
      <div
        ref={canvasContainerRef}
        style={{
          position: "relative",
          width: WIDGET_WIDTH,
          height: ROBOT_HEIGHT,
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
        }}
      >
        <motion.div
          animate={{
            y: isVisible ? 0 : 50,
            opacity: isVisible ? 1 : 0,
            scale: isVisible ? 1 : 0.7,
          }}
          transition={{ type: "spring", damping: 18, stiffness: 120, mass: 0.9 }}
          style={{
            background: "transparent",
            border: "none",
            overflow: "visible",
            width: "100%",
            height: "100%",
            position: "relative",
            zIndex: 2,
            filter: "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.45))",
          }}
        >
          {/* Canvas internally sized by ResizeObserver */}
          <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
        </motion.div>
      </div>

      {phase === "talking" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          style={{
            display: "flex",
            gap: 4,
            justifyContent: "center",
            width: WIDGET_WIDTH,
            marginTop: 4,
          }}
        >
          {DIALOGUE.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === step ? "#f59e0b" : "rgba(255, 255, 255, 0.25)",
                transition: "all 0.3s",
              }}
            />
          ))}
        </motion.div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1 } 50% { opacity: 0 } }
      `}</style>
    </div>
  );
};