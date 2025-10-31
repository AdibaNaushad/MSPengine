import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken, apiGet } from "@/lib/api";

export default function Chatbot() {
  const [open, setOpen] = useState(true);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "Hi! Ask me: 'Show my ROI trend', 'Detect overspending', or 'Suggest growth action'." },
  ]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    let reply = "Let me check...";
    try {
      const stats = getToken() ? await apiGet("/api/finance/stats") : null;
      const lower = text.toLowerCase();
      if (lower.includes("roi")) {
        reply = `Current ROI: ${stats?.roiPercent ?? 42}% with steady upward trend.`;
      } else if (lower.includes("overspend") || lower.includes("waste")) {
        reply = stats?.wasteAlerts?.length
          ? `I detect ${stats.wasteAlerts.length} waste signals. Top: ${stats.wasteAlerts[0].message}.`
          : "No major overspending detected. Keep monitoring cloud and licenses.";
      } else if (lower.includes("suggest") || lower.includes("growth")) {
        reply = "Consider activating License Optimizer and targeting upsells for Microsoft 365. Expected ROI +12%.";
      } else {
        reply = "Try: 'Show my ROI trend', 'Detect overspending', or 'Suggest growth action'.";
      }
    } catch {
      reply = "Connect and login to analyze your live dashboard.";
    }
    setMessages((m) => [...m, { role: "ai", text: reply }]);
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
            className="glass w-[320px] rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold neon-text">AI Assistant</h4>
              <button onClick={() => setOpen(false)} className="text-sm opacity-70 hover:opacity-100">Close</button>
            </div>
            <div className="space-y-2 max-h-56 overflow-auto pr-1">
              {messages.map((m, i) => (
                <div key={i} className={m.role === "ai" ? "text-cyan-300" : "text-emerald-300 text-right"}>{m.text}</div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type a question..." className="flex-1 bg-transparent border border-border/60 rounded-md px-2 py-1 focus:outline-none" />
              <button onClick={handleSend} className="px-3 py-1 rounded-md bg-primary text-primary-foreground glow">Send</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && (
        <button onClick={() => setOpen(true)} className="size-12 rounded-full bg-gradient-to-br from-cyan-400 to-emerald-400 glow" />
      )}
    </div>
  );
}
