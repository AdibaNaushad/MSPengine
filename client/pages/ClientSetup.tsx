import GlassCard from "@/components/GlassCard";
import NeonButton from "@/components/NeonButton";
import { apiGet, apiPost, getToken } from "@/lib/api";
import { ClientRecord, ExpenseItem, UploadInvoiceResponse } from "@shared/api";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle, Download } from "lucide-react";
import jsPDF from "jspdf";

interface ClientReport {
  clientName: string;
  totalExpenses: number;
  invoiceCount: number;
  averageInvoice: number;
  dateRange: { from: string; to: string };
}

export default function ClientSetup() {
  console.log("✅ ClientSetup page rendering");
  const [clientName, setClientName] = useState("");
  const [company, setCompany] = useState("");
  const [contact, setContact] = useState("");
  const [financeCategory, setFinanceCategory] = useState("General");
  const [clients, setClients] = useState<ClientRecord[]>([]);
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reports, setReports] = useState<ClientReport[]>([]);
  const [uploading, setUploading] = useState(false);
  const [addingClient, setAddingClient] = useState(false);

  async function refresh() {
    if (!getToken()) {
      setClients([]);
      setExpenses([]);
      return;
    }

    try {
      const results = await Promise.allSettled([
        apiGet<ClientRecord[]>("/api/clients").catch(() => []),
        apiGet<ExpenseItem[]>("/api/expenses").catch(() => []),
      ]);

      const clients =
        results[0].status === "fulfilled"
          ? (results[0].value as any) || []
          : [];
      const expenses =
        results[1].status === "fulfilled"
          ? (results[1].value as any) || []
          : [];

      setClients(clients);
      setExpenses(expenses);
      generateReports(expenses);
    } catch (err) {
      console.error("Refresh failed:", err);
      setClients([]);
      setExpenses([]);
    }
  }

  function generateReports(expenseList: ExpenseItem[]) {
    const reportMap = new Map<string, ClientReport>();

    expenseList.forEach((expense) => {
      if (!reportMap.has(expense.clientName)) {
        reportMap.set(expense.clientName, {
          clientName: expense.clientName,
          totalExpenses: 0,
          invoiceCount: 0,
          averageInvoice: 0,
          dateRange: { from: expense.date, to: expense.date },
        });
      }

      const report = reportMap.get(expense.clientName)!;
      report.totalExpenses += expense.amount;
      report.invoiceCount += 1;

      const currentDate = new Date(expense.date);
      const fromDate = new Date(report.dateRange.from);
      const toDate = new Date(report.dateRange.to);

      if (currentDate < fromDate) report.dateRange.from = expense.date;
      if (currentDate > toDate) report.dateRange.to = expense.date;
    });

    reportMap.forEach((report) => {
      report.averageInvoice =
        report.invoiceCount > 0
          ? report.totalExpenses / report.invoiceCount
          : 0;
    });

    setReports(Array.from(reportMap.values()));
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addClient() {
    if (!clientName.trim()) {
      setError("Client name is required");
      return;
    }

    try {
      setAddingClient(true);
      setError("");
      console.log("📝 Adding client:", {
        clientName,
        company,
        contact,
        financeCategory,
      });
      const c = await apiPost<ClientRecord>("/api/clients", {
        clientName,
        company,
        contact,
        financeCategory,
      });
      console.log("✅ Client added:", c);
      setClients((x) => [c, ...x]);
      setSuccess("Client added successfully!");
      setClientName("");
      setCompany("");
      setContact("");
      setFinanceCategory("General");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: any) {
      console.error("❌ Failed to add client:", err);
      setError(err?.message || "Failed to add client");
    } finally {
      setAddingClient(false);
    }
  }

  async function handleFiles(file: File) {
    if (!file.type.includes("pdf") && !file.type.includes("image")) {
      setError("Please upload a PDF or image file");
      return;
    }

    setUploading(true);
    setProgress(0);
    setError("");

    const form = new FormData();
    form.append("file", file);
    form.append(
      "clientName",
      clientName || clients[0]?.clientName || "Unknown",
    );
    form.append("project", "Invoice");

    const timer = setInterval(
      () => setProgress((p) => Math.min(95, p + 7)),
      150,
    );

    try {
      console.log("📤 Uploading invoice:", file.name);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout for file upload

      const res = await fetch("/api/upload-invoice", {
        method: "POST",
        headers: {
          ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
        },
        body: form,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      clearInterval(timer);
      setProgress(100);

      if (!res.ok) {
        console.error("Upload response not ok:", res.status);
        throw new Error(`Upload failed: HTTP ${res.status}`);
      }

      const data: UploadInvoiceResponse = await res.json();
      console.log("✅ Invoice processed:", data);
      setSuccess(`✓ Invoice processed! ${data.extracted?.summary}`);

      await refresh();
      setTimeout(() => {
        setProgress(0);
        setSuccess("");
      }, 3000);
    } catch (err: any) {
      clearInterval(timer);
      setProgress(0);
      console.error("❌ Upload failed:", err);
      setError(err?.message || "Failed to upload invoice. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function downloadReport(report: ClientReport) {
    const doc = new jsPDF();
    let yPosition = 20;

    doc.setFontSize(20);
    doc.text(`Financial Report: ${report.clientName}`, 20, yPosition);
    yPosition += 15;

    doc.setFontSize(11);
    doc.text(
      `Report Generated: ${new Date().toLocaleDateString()}`,
      20,
      yPosition,
    );
    yPosition += 10;

    // Summary Section
    doc.setFontSize(14);
    doc.text("Financial Summary", 20, yPosition);
    yPosition += 10;

    doc.setFontSize(11);
    const totalTax = Math.round(report.totalExpenses * 0.18);

    doc.text(
      `Total Expenses: ₹${report.totalExpenses.toLocaleString("en-IN")}`,
      20,
      yPosition,
    );
    yPosition += 7;
    doc.text(
      `Total Tax (18% GST): ₹${totalTax.toLocaleString("en-IN")}`,
      20,
      yPosition,
    );
    yPosition += 7;
    doc.text(
      `Grand Total: ₹${(report.totalExpenses + totalTax).toLocaleString("en-IN")}`,
      20,
      yPosition,
    );
    yPosition += 7;
    doc.text(`Number of Invoices: ${report.invoiceCount}`, 20, yPosition);
    yPosition += 7;
    doc.text(
      `Average Invoice: ₹${Math.round(report.averageInvoice).toLocaleString("en-IN")}`,
      20,
      yPosition,
    );
    yPosition += 7;
    doc.text(
      `Period: ${report.dateRange.from} to ${report.dateRange.to}`,
      20,
      yPosition,
    );
    yPosition += 15;

    // Detailed Invoices
    doc.setFontSize(14);
    doc.text("Detailed Invoices", 20, yPosition);
    yPosition += 10;

    const clientExpenses = expenses.filter(
      (e) => e.clientName === report.clientName,
    );
    clientExpenses.forEach((expense, idx) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(10);
      doc.setTextColor(100, 200, 200);
      if (expense.invoiceData?.invoiceNumber) {
        doc.text(
          `${expense.invoiceData.invoiceNumber} | ${expense.project}`,
          20,
          yPosition,
        );
      } else {
        doc.text(`Invoice ${idx + 1} | ${expense.project}`, 20, yPosition);
      }

      doc.setTextColor(150, 150, 150);
      yPosition += 6;

      doc.text(
        `Date: ${expense.date} | Amount: ₹${expense.invoiceData?.amount.toLocaleString("en-IN") || expense.amount}`,
        20,
        yPosition,
      );
      yPosition += 5;

      if (expense.invoiceData?.taxes) {
        doc.text(
          `Tax: ₹${expense.invoiceData.taxes.toLocaleString("en-IN")} | Total: ₹${expense.amount.toLocaleString("en-IN")}`,
          20,
          yPosition,
        );
        yPosition += 5;
      }

      if (expense.invoiceData?.paymentStatus) {
        doc.text(
          `Status: ${expense.invoiceData.paymentStatus.toUpperCase()}`,
          20,
          yPosition,
        );
        yPosition += 7;
      } else {
        yPosition += 2;
      }

      doc.setTextColor(0, 0, 0);
    });

    doc.save(`${report.clientName}_FinancialReport.pdf`);
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h1 className="text-4xl font-bold neon-text">Client Setup</h1>
        <p className="text-muted-foreground">
          Manage clients and upload invoices for automatic scanning and report
          generation
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300"
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p>{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300"
        >
          <CheckCircle className="w-5 h-5 flex-shrink-0" />
          <p>{success}</p>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <GlassCard>
          <h3 className="font-semibold text-xl mb-4 neon-text">Add a Client</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm opacity-70 mb-1">
                Client Name
              </label>
              <input
                placeholder="Enter client name"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">Company</label>
              <input
                placeholder="Company name"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">
                Contact Email
              </label>
              <input
                placeholder="contact@example.com"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              />
            </div>
            <div>
              <label className="block text-sm opacity-70 mb-1">
                Finance Category
              </label>
              <select
                value={financeCategory}
                onChange={(e) => setFinanceCategory(e.target.value)}
                className="w-full bg-transparent border border-border/60 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-cyan-500/50"
              >
                <option value="General" className="bg-slate-900">
                  General
                </option>
                <option value="Operations" className="bg-slate-900">
                  Operations
                </option>
                <option value="Development" className="bg-slate-900">
                  Development
                </option>
                <option value="Marketing" className="bg-slate-900">
                  Marketing
                </option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <NeonButton
              onClick={addingClient ? undefined : addClient}
              className={`w-full ${addingClient ? "opacity-60 pointer-events-none" : ""}`}
            >
              {addingClient ? "Saving..." : "Save Client"}
            </NeonButton>
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-emerald-300">
              Existing Clients ({clients.length})
            </h4>
            {clients.length === 0 ? (
              <p className="text-sm opacity-60">
                No clients yet. Add your first client above.
              </p>
            ) : (
              <ul className="text-sm space-y-2">
                {clients.map((c) => (
                  <motion.li
                    key={c.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-2 rounded bg-cyan-500/5 border border-cyan-500/20"
                  >
                    <p className="font-medium text-cyan-300">{c.clientName}</p>
                    <p className="text-xs opacity-70">{c.company}</p>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <h3 className="font-semibold text-xl mb-4 neon-text">
            Upload Invoices (AI OCR)
          </h3>
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
              uploading
                ? "border-cyan-400/30 bg-cyan-500/5"
                : "border-border/60 hover:border-cyan-400/60 hover:bg-cyan-500/5 cursor-pointer"
            }`}
            onDragOver={(e) => {
              e.preventDefault();
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files?.[0] && !uploading)
                handleFiles(e.dataTransfer.files[0]);
            }}
          >
            {progress === 0 ? (
              <>
                <p className="mb-2">📄 Drag & drop invoice here or</p>
                <label className="inline-block">
                  <input
                    type="file"
                    disabled={uploading}
                    accept=".pdf,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files && handleFiles(e.target.files[0])
                    }
                  />
                  <span className="underline text-cyan-300 cursor-pointer hover:text-cyan-200">
                    browse
                  </span>
                </label>
              </>
            ) : (
              <>
                <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden mb-3">
                  <motion.div
                    className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 glow"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <p className="text-sm">🔍 AI OCR scanning... {progress}%</p>
              </>
            )}
          </div>

          <div className="mt-6">
            <h4 className="font-semibold mb-3 text-emerald-300">
              Extracted Expenses ({expenses.length})
            </h4>
            {expenses.length === 0 ? (
              <p className="text-sm opacity-60">
                No expenses yet. Upload an invoice to get started.
              </p>
            ) : (
              <div className="space-y-3">
                {expenses.map((e, idx) => (
                  <motion.div
                    key={e.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-4 rounded-lg bg-slate-800/30 border border-emerald-500/20 hover:border-emerald-500/40 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-cyan-300">
                            {e.clientName}
                          </p>
                          {e.invoiceData?.invoiceNumber && (
                            <span className="text-xs bg-cyan-500/20 px-2 py-1 rounded text-cyan-300">
                              {e.invoiceData.invoiceNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-400">{e.project}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-emerald-400">
                          ₹{e.amount.toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>

                    {e.invoiceData && (
                      <div className="space-y-2 text-sm mb-3 pb-3 border-b border-slate-700">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="opacity-60">Invoice Date: </span>
                            <span className="text-cyan-300">
                              {e.invoiceData.invoiceDate}
                            </span>
                          </div>
                          <div>
                            <span className="opacity-60">Due Date: </span>
                            <span className="text-cyan-300">
                              {e.invoiceData.dueDate}
                            </span>
                          </div>
                          <div>
                            <span className="opacity-60">Base Amount: </span>
                            <span>
                              ₹{e.invoiceData.amount.toLocaleString("en-IN")}
                            </span>
                          </div>
                          <div>
                            <span className="opacity-60">
                              Tax ({e.invoiceData.taxRate}%):{" "}
                            </span>
                            <span>
                              ₹{e.invoiceData.taxes?.toLocaleString("en-IN")}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="opacity-60 text-xs">Status: </span>
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              e.invoiceData.paymentStatus === "paid"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : e.invoiceData.paymentStatus === "overdue"
                                  ? "bg-red-500/20 text-red-300"
                                  : "bg-yellow-500/20 text-yellow-300"
                            }`}
                          >
                            {e.invoiceData.paymentStatus?.toUpperCase()}
                            {e.invoiceData.daysPending
                              ? ` (${e.invoiceData.daysPending}d)`
                              : ""}
                          </span>
                        </div>

                        {e.invoiceData.summary && (
                          <p className="text-xs opacity-80 italic pt-1">
                            {e.invoiceData.summary}
                          </p>
                        )}
                      </div>
                    )}

                    {e.invoiceData?.anomalies &&
                      e.invoiceData.anomalies.length > 0 && (
                        <div className="space-y-1">
                          {e.invoiceData.anomalies.map((anomaly, i) => (
                            <div
                              key={i}
                              className="flex items-start gap-2 p-2 rounded bg-red-500/10 border border-red-500/20"
                            >
                              <span className="text-red-400 font-bold mt-0.5">
                                ⚠
                              </span>
                              <span className="text-xs text-red-300">
                                {anomaly}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Financial Analytics Dashboard */}
      {expenses.length > 0 && (
        <GlassCard className="border border-cyan-500/30 bg-cyan-500/5">
          <h3 className="font-semibold text-xl neon-text mb-6">
            Financial Analytics Dashboard
          </h3>
          <div className="grid md:grid-cols-4 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-cyan-500/20"
            >
              <p className="text-xs opacity-70 mb-1">Total Invoiced</p>
              <p className="text-2xl font-bold text-cyan-300">
                ₹
                {expenses
                  .reduce((a, b) => a + b.amount, 0)
                  .toLocaleString("en-IN")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-emerald-500/20"
            >
              <p className="text-xs opacity-70 mb-1">Total Tax (18%)</p>
              <p className="text-2xl font-bold text-emerald-300">
                ₹
                {Math.round(
                  expenses.reduce((a, b) => a + b.amount, 0) * 0.18,
                ).toLocaleString("en-IN")}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-pink-500/20"
            >
              <p className="text-xs opacity-70 mb-1">Invoice Count</p>
              <p className="text-2xl font-bold text-pink-300">
                {expenses.length}
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg bg-slate-800/50 border border-yellow-500/20"
            >
              <p className="text-xs opacity-70 mb-1">Avg Invoice</p>
              <p className="text-2xl font-bold text-yellow-300">
                ₹
                {Math.round(
                  expenses.reduce((a, b) => a + b.amount, 0) / expenses.length,
                ).toLocaleString("en-IN")}
              </p>
            </motion.div>
          </div>

          {/* Payment Status Overview */}
          <div className="mb-6">
            <h4 className="font-semibold text-sm mb-3 text-emerald-300">
              Payment Status Overview
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <p className="text-sm font-semibold text-emerald-300">Paid</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {
                    expenses.filter(
                      (e) => e.invoiceData?.paymentStatus === "paid",
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <p className="text-sm font-semibold text-yellow-300">Pending</p>
                <p className="text-2xl font-bold text-yellow-400">
                  {
                    expenses.filter(
                      (e) => e.invoiceData?.paymentStatus === "pending",
                    ).length
                  }
                </p>
              </div>
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm font-semibold text-red-300">Overdue</p>
                <p className="text-2xl font-bold text-red-400">
                  {
                    expenses.filter(
                      (e) => e.invoiceData?.paymentStatus === "overdue",
                    ).length
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Anomalies Summary */}
          {expenses.some((e) => e.invoiceData?.anomalies?.length) && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
              <h4 className="font-semibold text-sm mb-3 text-red-300">
                ⚠️ Detected Anomalies
              </h4>
              <ul className="space-y-1 text-sm text-red-200">
                {expenses
                  .flatMap((e) =>
                    (e.invoiceData?.anomalies || []).map((a) => ({
                      client: e.clientName,
                      anomaly: a,
                    })),
                  )
                  .map((item, i) => (
                    <li key={i}>
                      • <span className="font-medium">{item.client}:</span>{" "}
                      {item.anomaly}
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </GlassCard>
      )}

      {reports.length > 0 && (
        <GlassCard className="border border-emerald-500/30 bg-emerald-500/5">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-xl neon-text">
              Auto-Generated Reports
            </h3>
            <span className="text-xs bg-emerald-500/20 px-3 py-1 rounded-full">
              Live
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {reports.map((report, idx) => (
              <motion.div
                key={report.clientName}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 rounded-lg bg-slate-800/50 border border-emerald-500/20"
              >
                <h4 className="font-semibold text-cyan-300 mb-3">
                  {report.clientName}
                </h4>
                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="opacity-70">Total Expenses:</span>
                    <span className="font-medium text-emerald-400">
                      ₹{report.totalExpenses.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Invoices:</span>
                    <span className="font-medium">{report.invoiceCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-70">Average:</span>
                    <span className="font-medium">
                      ₹
                      {Math.round(report.averageInvoice).toLocaleString(
                        "en-IN",
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="opacity-70">Period:</span>
                    <span>
                      {report.dateRange.from} to {report.dateRange.to}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => downloadReport(report)}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md bg-cyan-600 hover:bg-cyan-700 text-white text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </motion.div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
