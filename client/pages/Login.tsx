import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { apiPost, setToken } from "@/lib/api";
import { LoginResponse } from "@shared/api";
import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Login() {
  console.log("✅ Login page rendering");
  const [email, setEmail] = useState("admin@demo.com");
  const [password, setPassword] = useState("12345");
  const [error, setError] = useState<string | null>(null);
  const nav = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const res = await apiPost<LoginResponse>("/api/login", { email, password });
      if (res.ok && res.token) {
        setToken(res.token);
        nav("/dashboard");
      } else {
        setError(res.error || "Login failed");
      }
    } catch (e: any) {
      setError("Invalid credentials");
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <GlassCard>
        <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold mb-4 neon-text">Secure Login</motion.h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-sm mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <NeonButton>Login</NeonButton>
        </form>
      </GlassCard>
    </div>
  );
}
