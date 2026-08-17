import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// Suppress upstream THREE.Clock deprecation warning from @react-three/fiber until R3F updates to THREE.Timer
const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === "string" && args[0].includes("THREE.Clock: This module has been deprecated")) {
    return;
  }
  originalWarn(...args);
};


createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
