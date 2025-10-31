import { createRoot } from "react-dom/client";
import { App } from "./App";

const container = document.getElementById("root");
if (container) {
  console.log("🚀 Starting React app...");

  // Clear loading message
  container.innerHTML = "";

  // Add global error handler
  window.addEventListener("error", (event) => {
    console.error("❌ Global error:", event.error);
  });

  window.addEventListener("unhandledrejection", (event) => {
    console.error("❌ Unhandled promise rejection:", event.reason);
  });

  try {
    const root = createRoot(container);
    console.log("✅ React root created");

    root.render(<App />);
    console.log("✅ React app mounted successfully");
  } catch (error) {
    console.error("❌ Fatal error:", error);
    container.innerHTML = `<div style="color:#ff6b6b;font-family:monospace;padding:20px;background:#000;white-space:pre-wrap;font-size:14px"><h1>⚠️ Error Loading App</h1><p>${String(error)}</p><p>Check browser console for details.</p></div>`;
  }
} else {
  console.error("❌ Root element not found");
  document.body.innerHTML = '<div style="color:white;padding:20px">Error: Root element not found</div>';
}
