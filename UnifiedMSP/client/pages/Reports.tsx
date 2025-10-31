import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { apiGet } from "@/lib/api";
import { AlertItem, ClientRecord, ExpenseItem, FinanceStats } from "@shared/api";
import { useEffect, useRef, useState } from "react";
import jsPDF from "jspdf";

export default function Reports() {
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const ref = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const [c, e, s, a] = await Promise.all([
        apiGet<ClientRecord[]>("/api/clients"),
        apiGet<ExpenseItem[]>("/api/expenses"),
        apiGet<FinanceStats>("/api/finance/stats"),
        apiGet<AlertItem[]>("/api/alerts"),
      ]);
      setClients(c); setExpenses(e); setStats(s); setAlerts(a);
    } catch {}
  }
  useEffect(() => { load(); }, []);

  function download() {
    const doc = new jsPDF();
    let y = 10;
    doc.setFontSize(16).text("Unified MSP Growth Engine — Report", 10, y); y += 8;
    doc.setFontSize(12).text(`ROI: ${stats?.roiPercent ?? 42}%`, 10, y); y += 6;
    doc.text("Clients:", 10, y); y += 6;
    clients.forEach((c) => { doc.text(`• ${c.clientName} (${c.company})`, 14, y); y += 6; });
    y += 2; doc.text("Expenses:", 10, y); y += 6;
    expenses.slice(0, 12).forEach((e) => { doc.text(`${e.date} • ${e.clientName} • ${e.project} • $${e.amount}`, 14, y); y += 6; });
    y += 2; doc.text("Alerts:", 10, y); y += 6;
    alerts.slice(0, 8).forEach((a) => { doc.text(`• ${a.title}`, 14, y); y += 6; });
    doc.save("msp-report.pdf");
  }

  return (
    <div className="space-y-6" ref={ref}>
      <GlassCard>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-xl neon-text">Comprehensive Report</h3>
            <p className="opacity-80 text-sm">Summary of clients, expenses, ROI trends, and AI actions.</p>
          </div>
          <NeonButton onClick={download}>Download as PDF</NeonButton>
        </div>
      </GlassCard>
      <div className="grid lg:grid-cols-3 gap-6">
        <GlassCard>
          <h4 className="font-semibold mb-2">Clients</h4>
          <ul className="text-sm opacity-80 space-y-1 max-h-64 overflow-auto">
            {clients.map((c) => (<li key={c.id}>{c.clientName} • {c.company}</li>))}
          </ul>
        </GlassCard>
        <GlassCard className="lg:col-span-2">
          <h4 className="font-semibold mb-2">Recent Expenses</h4>
          <div className="overflow-auto max-h-64">
            <table className="w-full text-sm">
              <thead className="opacity-70">
                <tr>
                  <th className="text-left py-2">Client</th>
                  <th className="text-left py-2">Project</th>
                  <th className="text-right py-2">Amount</th>
                  <th className="text-left py-2">Date</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-t border-border/40">
                    <td className="py-2">{e.clientName}</td>
                    <td className="py-2">{e.project}</td>
                    <td className="py-2 text-right">${e.amount.toLocaleString()}</td>
                    <td className="py-2">{e.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
