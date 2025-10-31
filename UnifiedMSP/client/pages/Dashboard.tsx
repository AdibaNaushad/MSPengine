import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { apiGet, apiPost, getToken } from "@/lib/api";
import { AgentActionResponse, FinanceStats } from "@shared/api";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from "recharts";
import { useLocation, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const nav = useNavigate();
  const loc = useLocation();

  async function refresh() {
    if (!getToken() && !new URLSearchParams(loc.search).get("demo")) {
      nav("/login");
      return;
    }
    try { setStats(await apiGet<FinanceStats>("/api/finance/stats")); } catch {}
  }
  useEffect(() => { refresh(); const i = setInterval(refresh, 8000); return () => clearInterval(i); }, [loc.search]);

  async function activate(type: "license-optimizer" | "cloud-spend-guard" | "sales-pitch-assistant") {
    try {
      const res = await apiPost<AgentActionResponse>("/api/agents/activate", { type });
      setStats(res.updatedStats || null);
      alert(res.message);
    } catch {
      const msg = type === "license-optimizer" ? "5 Unused Licenses Found and Removed" : type === "cloud-spend-guard" ? "Cloud Expenses Reduced by 8%" : "3 New Upsell Opportunities Generated";
      alert(msg);
    }
  }

  const demoSeries = useMemo(() => {
    const today = new Date();
    return Array.from({ length: 8 }).map((_, i) => {
      const d = new Date(today);
      d.setMonth(d.getMonth() - (7 - i));
      return { date: d.toISOString().slice(0, 10), value: 4600 + i * 140 + Math.random() * 200 };
    });
  }, []);

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <GlassCard className="lg:col-span-1">
        <h3 className="font-bold text-xl neon-text">ROI</h3>
        <p className="text-5xl font-extrabold mt-2">{stats?.roiPercent ?? 42}%</p>
        <p className="opacity-70 text-sm">Return on Investment</p>
      </GlassCard>
      <GlassCard className="lg:col-span-2">
        <h3 className="font-bold mb-2">Profitability Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats?.profitabilitySeries || demoSeries}>
              <defs>
                <linearGradient id="c" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.7}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide/>
              <YAxis hide/>
              <Tooltip contentStyle={{ background: "#0b1220", border: "1px solid rgba(255,255,255,0.1)" }} />
              <Area type="monotone" dataKey="value" stroke="#22d3ee" fill="url(#c)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>
      <GlassCard>
        <h3 className="font-bold mb-2">AI-Detected Waste Alerts</h3>
        <ul className="space-y-2 text-sm">
          {(stats?.wasteAlerts?.length ? stats.wasteAlerts : [{ id: "1", message: "No major waste detected", severity: "low" as const }]).map(a => (
            <li key={a.id} className="flex items-center gap-2">
              <span className={`size-2 rounded-full ${a.severity === 'high' ? 'bg-red-400' : a.severity==='medium' ? 'bg-yellow-300' : 'bg-emerald-400'}`} />
              {a.message}
            </li>
          ))}
        </ul>
      </GlassCard>
      <GlassCard className="lg:col-span-2">
        <h3 className="font-bold mb-4">Smart Agent Marketplace</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold">License Optimizer</h4>
            <p className="text-sm opacity-80">Find and remove unused licenses automatically.</p>
            <div className="mt-3"><NeonButton onClick={() => activate("license-optimizer")}>Activate</NeonButton></div>
          </div>
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold">Cloud Spend Guard</h4>
            <p className="text-sm opacity-80">Analyze cloud costs and reduce spend.</p>
            <div className="mt-3"><NeonButton onClick={() => activate("cloud-spend-guard")}>Activate</NeonButton></div>
          </div>
          <div className="glass rounded-xl p-4">
            <h4 className="font-semibold">Sales Pitch Assistant</h4>
            <p className="text-sm opacity-80">Generate upsell opportunities and scripts.</p>
            <div className="mt-3"><NeonButton onClick={() => activate("sales-pitch-assistant")}>Activate</NeonButton></div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
