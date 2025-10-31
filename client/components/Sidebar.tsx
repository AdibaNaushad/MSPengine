import { Link, useLocation } from "react-router-dom";
import { BarChart3, Users, DollarSign, Brain, MessageSquare, FileText, Home } from "lucide-react";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/api";

const MENU_ITEMS = [
  { id: "overview", label: "Overview", icon: Home, path: "/dashboard", protected: false },
  { id: "clients", label: "Clients", icon: Users, path: "/client-setup", protected: false },
  { id: "ai-insights", label: "AI Insights", icon: Brain, path: "/ai-insights", protected: false },
  { id: "ai-assistant", label: "AI Assistant", icon: MessageSquare, path: "/ai-assistant", protected: false },
  { id: "reports", label: "Reports", icon: FileText, path: "/reports", protected: false },
];

export default function Sidebar() {
  const location = useLocation();
  const [authed, setAuthed] = useState<boolean>(!!getToken());

  useEffect(() => {
    console.log("✅ Sidebar mounted, location:", location.pathname);
    const i = setInterval(() => setAuthed(!!getToken()), 500);
    return () => clearInterval(i);
  }, []);

  return (
    <aside className="w-64 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-r border-cyan-500/10 p-6 flex flex-col h-screen sticky top-0">
      <div className="mb-12">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="size-10 rounded-lg bg-gradient-to-br from-cyan-400 to-emerald-400 glow flex items-center justify-center group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-sm neon-text line-clamp-2">Unified MSP</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-2">
        {MENU_ITEMS.filter((item) => !item.protected || authed).map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={`sidebar-${item.id}`}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                isActive
                  ? "bg-cyan-500/20 border border-cyan-500/40 text-cyan-300 neon-text"
                  : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-transparent hover:border-cyan-500/20"
              }`}
            >
              <Icon className="size-5 flex-shrink-0" />
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="pt-6 border-t border-cyan-500/10 mt-auto space-y-2">
        <p className="text-xs text-slate-500 font-medium px-4">SYSTEM</p>
        <button className="w-full flex items-center gap-3 px-4 py-2 rounded-lg text-slate-400 hover:text-emerald-300 hover:bg-emerald-500/10 transition-all text-sm font-medium group border border-transparent hover:border-emerald-500/20">
          <div className="size-4 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-400 group-hover:glow" />
          <span>Status: Active</span>
        </button>
      </div>
    </aside>
  );
}
