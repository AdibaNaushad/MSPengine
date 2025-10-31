import { motion } from "framer-motion";

export default function FinancialTrackerViz() {
  const chartData = [20, 35, 28, 42, 50, 45, 60, 55, 70, 65, 75, 80];
  const maxValue = 100;
  const chartHeight = 120;

  // Create SVG path for the line chart
  const points = chartData.map((value, i) => {
    const x = (i / (chartData.length - 1)) * 280;
    const y = chartHeight - (value / maxValue) * chartHeight;
    return `${x},${y}`;
  }).join(" ");

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6 h-full flex flex-col justify-between"
    >
      {/* Top Metrics */}
      <div className="grid grid-cols-3 gap-3">
        <motion.div
          variants={itemVariants}
          className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 backdrop-blur-sm"
        >
          <p className="text-xs text-cyan-300 opacity-70">ROI</p>
          <p className="text-xl font-bold text-cyan-300">+42%</p>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-3 backdrop-blur-sm"
        >
          <p className="text-xs text-emerald-300 opacity-70">Revenue</p>
          <p className="text-xl font-bold text-emerald-300">$485K</p>
        </motion.div>
        <motion.div
          variants={itemVariants}
          className="bg-pink-500/10 border border-pink-500/30 rounded-lg p-3 backdrop-blur-sm"
        >
          <p className="text-xs text-pink-300 opacity-70">Growth</p>
          <p className="text-xl font-bold text-pink-300">+18%</p>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div variants={itemVariants} className="relative">
        <p className="text-xs text-slate-400 mb-3">12-Month Trend</p>
        <svg
          viewBox="0 0 300 160"
          className="w-full h-auto"
          style={{ filter: "drop-shadow(0 0 8px rgba(34, 197, 94, 0.2))" }}
        >
          {/* Grid lines */}
          {[0, 1, 2, 3].map((i) => (
            <line
              key={`grid-${i}`}
              x1="10"
              y1={40 + i * 40}
              x2="290"
              y2={40 + i * 40}
              stroke="rgba(148, 163, 184, 0.1)"
              strokeDasharray="4"
              strokeWidth="0.5"
            />
          ))}

          {/* Fill under chart */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="rgba(34, 197, 94, 0.3)" />
              <stop offset="100%" stopColor="rgba(34, 197, 94, 0.05)" />
            </linearGradient>
          </defs>
          <polyline
            points={`0,${chartHeight} ${points} 280,${chartHeight}`}
            fill="url(#chartGradient)"
            stroke="none"
          />

          {/* Line chart */}
          <polyline
            points={points}
            fill="none"
            stroke="url(#lineGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <defs>
            <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22c55e" />
            </linearGradient>
          </defs>

          {/* Data points */}
          {chartData.map((value, i) => {
            const x = (i / (chartData.length - 1)) * 280;
            const y = chartHeight - (value / maxValue) * chartHeight;
            return (
              <motion.circle
                key={`dot-${i}`}
                cx={x}
                cy={y}
                r="3"
                fill="rgba(34, 197, 94, 0.6)"
                initial={{ r: 0 }}
                animate={{ r: 3 }}
                transition={{
                  delay: 0.3 + i * 0.05,
                  duration: 0.4,
                }}
              />
            );
          })}
        </svg>
      </motion.div>

      {/* Status indicator */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2 text-xs text-slate-400"
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-2 h-2 rounded-full bg-emerald-400 glow"
        />
        <span>Real-time AI tracking active</span>
      </motion.div>
    </motion.div>
  );
}
