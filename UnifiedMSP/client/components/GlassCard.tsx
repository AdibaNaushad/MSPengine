import { cn } from "@/lib/utils";

export default function GlassCard({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("glass rounded-2xl p-6", className)}>{children}</div>;
}
