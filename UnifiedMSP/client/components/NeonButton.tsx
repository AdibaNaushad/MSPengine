import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export default function NeonButton({
  children,
  className,
  onClick,
  as = "button",
  to,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  as?: "button" | "a";
  to?: string;
}) {
  const Comp: any = as;
  const common = "relative inline-flex items-center justify-center px-6 py-3 rounded-xl font-semibold text-black bg-gradient-to-r from-cyan-400 to-emerald-400 glow";
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Comp href={to} onClick={onClick} className={cn(common, className)}>
        <span className="relative z-10 text-slate-900">{children}</span>
        <span className="absolute inset-0 rounded-xl opacity-30 blur-xl bg-gradient-to-r from-cyan-400 to-emerald-400" />
      </Comp>
    </motion.div>
  );
}
