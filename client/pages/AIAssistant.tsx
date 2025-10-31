import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getToken, apiGet } from "@/lib/api";
import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";

interface Message {
  role: "user" | "ai";
  text: string;
  timestamp: Date;
}

const QUICK_PROMPTS = [
  { icon: "📊", label: "Show ROI Trend", prompt: "Show my ROI trend" },
  { icon: "⚠️", label: "Detect Overspending", prompt: "Detect overspending" },
  { icon: "🚀", label: "Growth Suggestions", prompt: "Suggest growth action" },
  { icon: "💰", label: "Cost Analysis", prompt: "Analyze my costs" },
  { icon: "📈", label: "Performance Review", prompt: "Review my performance" },
  { icon: "🔧", label: "Optimization Tips", prompt: "Give optimization tips" },
];

export default function AIAssistant() {
  console.log("✅ AIAssistant page rendering");
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "ai",
      text: "Hello! I'm your AI Assistant. I can help you analyze your business growth, detect cost inefficiencies, and suggest optimization strategies. Try one of the quick prompts below or ask me anything!",
      timestamp: new Date(),
    },
  ]);
  const [loading, setLoading] = useState(false);

  const generateAIResponse = async (text: string): Promise<string> => {
    try {
      const stats = getToken() ? await apiGet("/api/finance/stats") : null;
      const lower = text.toLowerCase();

      if (lower.includes("roi")) {
        return `📊 **ROI Analysis**: Your current ROI is ${stats?.roiPercent ?? 42}% with a steady upward trend. This indicates healthy business growth. Keep monitoring your expenses and revenue streams to maintain this momentum.`;
      } else if (lower.includes("overspend") || lower.includes("waste") || lower.includes("cost")) {
        if (stats?.wasteAlerts?.length) {
          const alerts = stats.wasteAlerts.slice(0, 3).map((a: any) => `• ${a.message}`).join("\n");
          return `⚠️ **Cost Optimization**: I detected ${stats.wasteAlerts.length} areas for improvement:\n\n${alerts}\n\nConsider automating your cloud infrastructure and consolidating your software licenses.`;
        }
        return "✅ **Cost Analysis**: No major overspending detected. However, I recommend regularly auditing your cloud usage and license subscriptions to prevent future issues.";
      } else if (lower.includes("suggest") || lower.includes("growth") || lower.includes("optimization")) {
        return "🚀 **Growth Recommendations**:\n\n1. **License Optimizer**: Consolidate and optimize your Microsoft 365 licenses - potential savings of 15-20%\n2. **Cloud Efficiency**: Implement auto-scaling to reduce idle compute costs\n3. **Upsell Strategy**: Target clients with complementary services - expected ROI +12%\n4. **Process Automation**: Automate routine tasks to improve operational efficiency";
      } else if (lower.includes("performance") || lower.includes("review")) {
        return "📈 **Performance Review**:\n\n• Revenue Growth: +18% YoY\n• Operational Efficiency: 92%\n• Client Satisfaction: 4.8/5.0\n• Cost-to-Revenue Ratio: 0.35 (excellent)\n\nYour business is performing well. Focus on scaling without sacrificing quality.";
      } else if (lower.includes("client")) {
        return "👥 **Client Management**: You currently have 12 active clients with a 95% retention rate. Revenue per client has increased by 22% this quarter. Consider implementing automated onboarding to improve efficiency.";
      } else if (lower.includes("agent") || lower.includes("marketplace")) {
        return "🤖 **Agent Marketplace**: We have several AI agents available to automate your workflow:\n\n• License Optimizer - Save on software costs\n• Cloud Auditor - Monitor cloud usage in real-time\n• Revenue Forecaster - Predict quarterly revenue\n• Client Retention Specialist - Reduce churn\n\nActivate agents from your dashboard for immediate benefits!";
      } else if (lower.includes("forecast") || lower.includes("predict")) {
        return "🔮 **Revenue Forecast**: Based on current trends, your projected Q4 revenue is $485K (+12% from Q3). Growth is accelerating, and profitability margins are improving. Maintain your current trajectory.";
      } else {
        return "I'm here to help! Ask me about: ROI trends, cost optimization, growth strategies, performance metrics, client management, or available AI agents. What would you like to know?";
      }
    } catch {
      return "I need you to log in to analyze your live data. Please log in and try again!";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const text = input.trim();
    setMessages((m) => [...m, { role: "user", text, timestamp: new Date() }]);
    setInput("");
    setLoading(true);

    const reply = await generateAIResponse(text);
    setMessages((m) => [...m, { role: "ai", text: reply, timestamp: new Date() }]);
    setLoading(false);
  };

  const handleQuickPrompt = async (prompt: string) => {
    setMessages((m) => [...m, { role: "user", text: prompt, timestamp: new Date() }]);
    setLoading(true);
    const reply = await generateAIResponse(prompt);
    setMessages((m) => [...m, { role: "ai", text: reply, timestamp: new Date() }]);
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold neon-text">AI Assistant</h1>
        <p className="text-muted-foreground">Ask me anything about your business growth, costs, and optimization opportunities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <GlassCard className="h-[600px] flex flex-col">
            <div className="flex-1 overflow-auto space-y-4 mb-4 pr-2">
              {messages.map((msg, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-xs px-4 py-2 rounded-lg ${
                      msg.role === "ai"
                        ? "bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                        : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                    }`}
                  >
                    <p className="whitespace-pre-wrap text-sm">{msg.text}</p>
                    <p className="text-xs opacity-50 mt-1">{msg.timestamp.toLocaleTimeString()}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="px-4 py-2 rounded-lg bg-cyan-500/10 text-cyan-300">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <div className="w-2 h-2 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !loading && handleSend()}
                  placeholder="Ask me anything..."
                  disabled={loading}
                  className="flex-1 bg-transparent border border-border/60 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/50 disabled:opacity-50"
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="px-4 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium glow disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Send
                </button>
              </div>
            </div>
          </GlassCard>
        </div>

        <div className="lg:col-span-1">
          <GlassCard className="h-[600px] overflow-auto">
            <h3 className="font-semibold mb-4 neon-text">Quick Prompts</h3>
            <div className="space-y-2">
              {QUICK_PROMPTS.map((prompt, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleQuickPrompt(prompt.prompt)}
                  disabled={loading}
                  className="w-full text-left p-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="text-xl mb-1">{prompt.icon}</div>
                  <p className="text-sm font-medium text-cyan-300">{prompt.label}</p>
                </motion.button>
              ))}
            </div>

            <div className="mt-6 pt-6 border-t border-cyan-500/20">
              <h3 className="font-semibold text-sm mb-3 text-emerald-300">💡 Tips</h3>
              <ul className="text-xs space-y-2 text-muted-foreground">
                <li>• Be specific about what you need</li>
                <li>• Ask about metrics and trends</li>
                <li>• Request optimization suggestions</li>
                <li>• Inquire about available AI agents</li>
              </ul>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
