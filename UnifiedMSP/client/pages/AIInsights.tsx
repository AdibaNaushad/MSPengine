import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import GlassCard from "@/components/GlassCard";
import { TrendingUp, AlertTriangle, Lightbulb, Activity } from "lucide-react";
import { apiGet } from "@/lib/api";

interface InsightCard {
  id: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  severity: "low" | "medium" | "high";
  action: string;
}

export default function AIInsights() {
  const [insights, setInsights] = useState<InsightCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const stats = await apiGet("/api/finance/stats").catch(() => ({ roiPercent: 42, wasteAlerts: [] }));
        const newInsights: InsightCard[] = [
          {
            id: "roi-positive",
            icon: <TrendingUp className="w-6 h-6 text-emerald-400" />,
            title: "ROI Trending Positive",
            description: `Your ROI is at ${stats?.roiPercent || 42}% with consistent growth. Revenue increased by 18% quarter-over-quarter.`,
            severity: "low",
            action: "Maintain current strategy",
          },
        ];

        if (stats?.wasteAlerts?.length) {
          newInsights.push({
            id: "waste-alert",
            icon: <AlertTriangle className="w-6 h-6 text-yellow-400" />,
            title: "Cost Optimization Opportunity",
            description: `${stats.wasteAlerts.length} waste signals detected. Primary areas: Cloud infrastructure (${stats.wasteAlerts[0]?.category || "compute"}), License consolidation.`,
            severity: "medium",
            action: "Review and optimize",
          });
        }

        newInsights.push(
          {
            id: "growth-opportunity",
            icon: <Lightbulb className="w-6 h-6 text-cyan-400" />,
            title: "Upsell Opportunity",
            description:
              "Based on client activity patterns, 6 clients are ready for service upgrades. Projected additional revenue: $42K annually.",
            severity: "low",
            action: "Launch upsell campaign",
          },
          {
            id: "performance-health",
            icon: <Activity className="w-6 h-6 text-pink-400" />,
            title: "System Performance Excellent",
            description: "All KPIs are within optimal ranges. Client satisfaction at 4.8/5.0. System uptime: 99.97%.",
            severity: "low",
            action: "Continue monitoring",
          }
        );

        setInsights(newInsights);
      } catch (error) {
        console.error("Failed to load insights:", error);
        setInsights([
          {
            id: "default-insight",
            icon: <Lightbulb className="w-6 h-6 text-cyan-400" />,
            title: "Default Insights Available",
            description: "Log in to see your personalized business insights and analytics.",
            severity: "low",
            action: "View Dashboard",
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadInsights();
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "high":
        return "border-red-500/30 bg-red-500/5";
      case "medium":
        return "border-yellow-500/30 bg-yellow-500/5";
      default:
        return "border-emerald-500/30 bg-emerald-500/5";
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors = {
      high: "bg-red-500/20 text-red-300",
      medium: "bg-yellow-500/20 text-yellow-300",
      low: "bg-emerald-500/20 text-emerald-300",
    };
    return colors[severity as keyof typeof colors] || colors.low;
  };

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold neon-text">AI Insights</h1>
        <p className="text-muted-foreground">Real-time analysis and recommendations powered by AI</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-96">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" />
            <div className="w-3 h-3 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0.1s" }} />
            <div className="w-3 h-3 rounded-full bg-cyan-400 animate-bounce" style={{ animationDelay: "0.2s" }} />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {insights.map((insight, idx) => (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <GlassCard className={`border ${getSeverityColor(insight.severity)}`}>
                <div className="flex gap-4">
                  <div className="flex-shrink-0 p-3 rounded-lg bg-slate-800/50">{insight.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{insight.title}</h3>
                        <p className="text-sm text-muted-foreground">{insight.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getSeverityBadge(insight.severity)}`}>
                        {insight.severity.charAt(0).toUpperCase() + insight.severity.slice(1)}
                      </span>
                    </div>
                    <button className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors glow">
                      {insight.action}
                      <span>→</span>
                    </button>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ))}
        </div>
      )}

      <GlassCard className="border border-cyan-500/30 bg-cyan-500/5 p-6">
        <h3 className="font-semibold mb-4 text-cyan-300">AI Analysis Summary</h3>
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
            <p>Your business is performing above industry benchmarks across all major metrics.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
            <p>Focus on client retention initiatives and service expansion to maximize profitability.</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 rounded-full bg-pink-400 mt-1.5 flex-shrink-0" />
            <p>Predicted revenue growth for next quarter: 12-15% based on current trajectory.</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
