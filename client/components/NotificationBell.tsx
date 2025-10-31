import { useEffect, useState } from "react";
import { apiGet, getToken } from "@/lib/api";
import { AlertItem } from "@shared/api";

export default function NotificationBell() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [flash, setFlash] = useState(false);

  async function fetchAlerts() {
    if (!getToken()) return;
    try {
      const a = await apiGet<AlertItem[]>("/api/alerts");
      if (a.length > alerts.length) {
        setFlash(true);
        setTimeout(() => setFlash(false), 2000);
      }
      setAlerts(a);
    } catch {}
  }

  useEffect(() => {
    fetchAlerts();
    const i = setInterval(fetchAlerts, 8000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="relative">
      <div className={`size-9 rounded-full border border-border/70 grid place-items-center ${flash ? "animate-pulse glow" : ""}`}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-cyan-300">
          <path d="M12 22a2 2 0 0 0 2-2H10a2 2 0 0 0 2 2Zm6-6v-5a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2Z" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </div>
      {alerts.some((a) => !a.read) && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-emerald-400" />}
    </div>
  );
}
