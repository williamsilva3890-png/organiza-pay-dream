import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Track mouse position for button glow effect (optimized with delegation)
document.addEventListener("mousemove", (e) => {
  const target = e.target as HTMLElement;
  const btn = target.closest?.(".btn-glow") as HTMLElement | null;
  if (btn) {
    const rect = btn.getBoundingClientRect();
    btn.style.setProperty("--mouse-x", `${((e.clientX - rect.left) / rect.width) * 100}%`);
    btn.style.setProperty("--mouse-y", `${((e.clientY - rect.top) / rect.height) * 100}%`);
  }
}, { passive: true });

createRoot(document.getElementById("root")!).render(<App />);
