import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Track mouse position for button glow effect
document.addEventListener("mousemove", (e) => {
  const btns = document.querySelectorAll<HTMLElement>(".btn-glow");
  btns.forEach((btn) => {
    const rect = btn.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    btn.style.setProperty("--mouse-x", `${x}%`);
    btn.style.setProperty("--mouse-y", `${y}%`);
  });
});

createRoot(document.getElementById("root")!).render(<App />);
