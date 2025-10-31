import { motion } from "framer-motion";
import NeonButton from "@/components/NeonButton";
import GlassCard from "@/components/GlassCard";
import FinancialTrackerViz from "@/components/FinancialTrackerViz";
import { Link, useNavigate } from "react-router-dom";

export default function Index() {
  const nav = useNavigate();
  console.log("✅ Index page rendered");
  return (
    <div className="relative">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(800px_circle_at_20%_10%,hsl(188_100%_50%/.15),transparent_50%),radial-gradient(1000px_circle_at_80%_10%,hsl(152_97%_40%/.12),transparent_50%)]" />
      <section className="grid lg:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <motion.h1 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-extrabold neon-text">
            Empower MSP Growth with AI-Driven Insights
          </motion.h1>
          <p className="text-lg opacity-80">Connect, Analyze, Automate — All in One Platform</p>
          <div className="flex flex-wrap gap-4 pt-2">
            <NeonButton onClick={() => nav("/dashboard?demo=1")}>Try Demo</NeonButton>
            <NeonButton as="a" to="/login" className="from-emerald-400 to-cyan-400">Login</NeonButton>
          </div>
        </div>
        <GlassCard className="p-0 overflow-hidden flex flex-col">
          <div className="p-6">
            <h3 className="font-semibold mb-3">Unified view of your MSP performance</h3>
            <p className="opacity-80">Track finances, detect overspending, and automate growth with real-time AI insights.</p>
          </div>
          <div className="flex-1 p-6 bg-gradient-to-br from-cyan-500/5 to-emerald-500/5">
            <FinancialTrackerViz />
          </div>
        </GlassCard>
      </section>
      <section className="mt-16 grid md:grid-cols-3 gap-6">
        {[
          { t: "AI Insights", d: "Real-time ROI, trends, and waste detection." },
          { t: "Automation", d: "Weekly analysis & monthly alerts with agents." },
          { t: "Marketplace", d: "Activate License Optimizer, Spend Guard, and more." },
        ].map((x) => (
          <GlassCard key={x.t}>
            <h4 className="font-semibold mb-2">{x.t}</h4>
            <p className="opacity-80 text-sm">{x.d}</p>
          </GlassCard>
        ))}
      </section>
    </div>
  );
}
