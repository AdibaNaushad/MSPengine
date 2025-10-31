import { Link, useNavigate } from "react-router-dom";
import NotificationBell from "./NotificationBell";
import Chatbot from "./chat/Chatbot";
import Sidebar from "./Sidebar";
import { useEffect, useState } from "react";
import { getToken, logout } from "@/lib/api";

export default function Layout({ children }: { children: React.ReactNode }) {
  const nav = useNavigate();
  const [authed, setAuthed] = useState<boolean>(!!getToken());
  useEffect(() => {
    const i = setInterval(() => setAuthed(!!getToken()), 500);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex h-screen bg-[radial-gradient(1200px_circle_at_20%_-10%,hsl(188_100%_20%/.3),transparent_50%),radial-gradient(1000px_circle_at_80%_10%,hsl(152_97%_20%/.25),transparent_50%)]">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-40 backdrop-blur-sm border-b border-border/40 bg-background/70">
          <div className="flex items-center justify-between px-8 py-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="size-7 rounded-md bg-gradient-to-br from-cyan-400 to-emerald-400 glow" />
              <span className="font-extrabold tracking-tight text-lg neon-text hidden sm:inline">Unified MSP Growth Engine</span>
            </Link>
            <div className="flex items-center gap-3">
              <NotificationBell />
              {authed ? (
                <button
                  onClick={() => {
                    logout();
                    setAuthed(false);
                    nav("/");
                  }}
                  className="px-3 py-1 rounded-md text-sm border border-border/60 hover:bg-muted/40"
                >
                  Logout
                </button>
              ) : (
                <Link to="/login" className="px-3 py-1 rounded-md text-sm border border-border/60 hover:bg-muted/40">Login</Link>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-8">{children}</main>
      </div>
      <Chatbot />
    </div>
  );
}
