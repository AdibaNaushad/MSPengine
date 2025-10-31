import "dotenv/config";
import express from "express";
import cors from "cors";
import multer from "multer";
import cron from "node-cron";
import { handleDemo } from "./routes/demo";
import { randomUUID } from "crypto";
import {
  AddClientRequest,
  AgentActionResponse,
  AgentType,
  AlertItem,
  ClientRecord,
  ExpenseItem,
  FinanceStats,
  LoginRequest,
  LoginResponse,
  UploadInvoiceResponse,
  User,
} from "@shared/api";

// Simple in-memory store (persist file optional future)
const store = {
  users: [{ id: "u1", email: "admin@demo.com", name: "Admin" } as User],
  sessions: new Map<string, string>(), // token -> userId
  clients: [] as ClientRecord[],
  expenses: [] as ExpenseItem[],
  alerts: [] as AlertItem[],
};

function calcStats(): FinanceStats {
  // Profitability series: compute by month based on expenses
  const byMonth = new Map<string, number>();
  for (const e of store.expenses) {
    const month = e.date.slice(0, 7);
    byMonth.set(month, (byMonth.get(month) || 0) - e.amount);
  }
  // Add baseline revenue to make ROI meaningful
  const months = Array.from(byMonth.keys()).sort();
  const series = months.map((m, i) => ({
    date: m + "-01",
    value: (byMonth.get(m) || 0) + 5000 + i * 200,
  }));
  const latest = series.length ? series[series.length - 1].value : 5000;
  const spend = store.expenses.reduce((a, b) => a + b.amount, 0);
  const revenue = Math.max(5000 + series.length * 200, spend + 1000);
  const roi =
    spend === 0
      ? 42
      : Math.round(((revenue - spend) / Math.max(spend, 1)) * 100);
  const wasteAlerts = [] as FinanceStats["wasteAlerts"];
  if (spend > 3000) {
    wasteAlerts.push({
      id: randomUUID(),
      message: "Overspending detected in Cloud Services",
      severity: "high",
    });
  }
  return {
    roiPercent: Math.max(0, Math.min(roi, 300)),
    profitabilitySeries: series.length
      ? series
      : [{ date: new Date().toISOString().slice(0, 10), value: 5200 }],
    wasteAlerts,
  };
}

function requireAuth(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  const auth = req.get("authorization");
  if (!auth) return res.status(401).json({ error: "Missing token" });
  const token = auth.replace("Bearer ", "");
  const userId = store.sessions.get(token);
  if (!userId) return res.status(401).json({ error: "Invalid token" });
  (req as any).userId = userId;
  next();
}

export function createServer() {
  const app = express();
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health + demo
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // Auth
  app.post("/api/login", (req, res) => {
    const body = req.body as LoginRequest;
    const valid = body.email === "admin@demo.com" && body.password === "12345";
    if (!valid) {
      const resp: LoginResponse = { ok: false, error: "Invalid credentials" };
      return res.status(401).json(resp);
    }
    const user = store.users[0];
    const token = randomUUID();
    store.sessions.set(token, user.id);
    const resp: LoginResponse = { ok: true, token, user };
    res.json(resp);
  });

  // Clients - with optional auth (demo mode without login)
  app.get("/api/clients", (_req, res) => {
    res.json(store.clients);
  });

  app.post("/api/clients", (req, res) => {
    const body = req.body as AddClientRequest;
    const newClient: ClientRecord = {
      id: randomUUID(),
      clientName: body.clientName,
      company: body.company,
      contact: body.contact,
      financeCategory: body.financeCategory,
      createdAt: new Date().toISOString(),
    };
    store.clients.push(newClient);
    res.status(201).json(newClient);
  });

  // Upload + OCR simulation with Financial Analytics
  app.post("/api/upload-invoice", upload.single("file"), (req, res) => {
    const { clientName = "Unknown", project = "General" } = req.body as Record<
      string,
      string
    >;
    const buffer = (req as any).file?.buffer || Buffer.alloc(0);

    // Simulate OCR extraction
    const baseAmount = Math.round(
      (buffer.length % 1500) + 500 + Math.random() * 3000,
    );
    const taxRate = 18; // 18% GST
    const taxes = Math.round((baseAmount * taxRate) / 100);
    const totalAmount = baseAmount + taxes;

    const invoiceDate = new Date(
      Date.now() - Math.floor(Math.random() * 30) * 24 * 3600 * 1000,
    )
      .toISOString()
      .slice(0, 10);
    const dueDate = new Date(
      Date.now() + Math.floor(Math.random() * 30) * 24 * 3600 * 1000,
    )
      .toISOString()
      .slice(0, 10);

    // Simulate payment status
    const paymentStatusOptions: Array<"paid" | "pending" | "overdue"> = [
      "paid",
      "pending",
      "overdue",
    ];
    const paymentStatus =
      paymentStatusOptions[
        Math.floor(Math.random() * paymentStatusOptions.length)
      ];
    const daysPending =
      paymentStatus === "pending"
        ? Math.floor(Math.random() * 30) + 5
        : paymentStatus === "overdue"
          ? Math.floor(Math.random() * 60) + 10
          : 0;

    // Anomaly detection
    const anomalies: string[] = [];
    if (paymentStatus === "overdue" && daysPending > 30) {
      anomalies.push(
        `Invoice overdue by ${daysPending} days - immediate action required`,
      );
    }
    if (totalAmount > 50000) {
      anomalies.push("High invoice amount detected - verify before processing");
    }

    // Check for duplicates in recent expenses
    const recentDuplicates = store.expenses.filter(
      (e) =>
        e.clientName === clientName &&
        Math.abs(e.amount - totalAmount) < 100 &&
        new Date(e.date).getTime() > Date.now() - 7 * 24 * 3600 * 1000,
    );
    if (recentDuplicates.length > 0) {
      anomalies.push("Potential duplicate invoice detected");
    }

    const client =
      store.clients.find((c) => c.clientName === clientName) ||
      store.clients[0];

    // Determine category
    const category = totalAmount > 20000 ? "expense" : "expense";

    const extractedInvoice = {
      invoiceNumber: `INV-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      invoiceDate,
      dueDate,
      clientName: clientName || client?.clientName || "Unknown",
      project: project || "General",
      amount: baseAmount,
      taxes,
      taxRate,
      paymentStatus,
      daysPending,
      category,
      summary: `${clientName}'s invoice for ${project} shows ₹${totalAmount.toLocaleString("en-IN")} total with ${taxRate}% GST, payment ${paymentStatus}${daysPending > 0 ? ` since ${invoiceDate}` : ""}`,
      anomalies: anomalies.length > 0 ? anomalies : undefined,
    };

    const expense: ExpenseItem = {
      id: randomUUID(),
      clientId: client?.id || "unknown",
      clientName: clientName || client?.clientName || "Unknown",
      project: project || "General",
      amount: totalAmount,
      date: invoiceDate,
      source: "upload",
      invoiceData: extractedInvoice,
    };
    store.expenses.push(expense);

    const resp: UploadInvoiceResponse = {
      ok: true,
      totalAmount,
      extracted: extractedInvoice,
      parsed: {
        clientName: expense.clientName,
        project: expense.project,
        amount: expense.amount,
        date: expense.date,
        source: expense.source,
      },
    };
    res.json(resp);
  });

  // Expenses + stats
  app.get("/api/expenses", (_req, res) => {
    res.json(store.expenses);
  });

  app.get("/api/finance/stats", (_req, res) => {
    res.json(calcStats());
  });

  // Agents
  app.post("/api/agents/activate", (req, res) => {
    const { type } = req.body as { type: AgentType };
    let message = "";
    if (type === "license-optimizer") {
      const removed = 5;
      const savings = removed * 20;
      store.expenses.push({
        id: randomUUID(),
        clientId: "system",
        clientName: "System",
        project: "License Cleanup",
        amount: -savings,
        date: new Date().toISOString().slice(0, 10),
        source: "agent",
      });
      message = `${removed} Unused Licenses Found and Removed`;
      store.alerts.unshift({
        id: randomUUID(),
        title: "License Cleanup Completed",
        createdAt: new Date().toISOString(),
        read: false,
      });
    } else if (type === "cloud-spend-guard") {
      const total = store.expenses.reduce(
        (a, b) => a + (b.amount > 0 ? b.amount : 0),
        0,
      );
      const reduction = Math.round(total * 0.08);
      store.expenses.push({
        id: randomUUID(),
        clientId: "system",
        clientName: "System",
        project: "Cloud Spend Reduction",
        amount: -reduction,
        date: new Date().toISOString().slice(0, 10),
        source: "agent",
      });
      message = "Cloud Expenses Reduced by 8%";
      store.alerts.unshift({
        id: randomUUID(),
        title: "Cloud Optimization Applied",
        createdAt: new Date().toISOString(),
        read: false,
      });
    } else if (type === "sales-pitch-assistant") {
      message = "3 New Upsell Opportunities Generated";
      store.alerts.unshift({
        id: randomUUID(),
        title: "Upsell Opportunities Ready",
        createdAt: new Date().toISOString(),
        read: false,
      });
    }
    const resp: AgentActionResponse = {
      success: true,
      message,
      updatedStats: calcStats(),
    };
    res.json(resp);
  });

  // Alerts
  app.get("/api/alerts", (_req, res) => {
    res.json(store.alerts);
  });
  app.post("/api/alerts/:id/read", (req, res) => {
    const id = req.params.id;
    const alert = store.alerts.find((a) => a.id === id);
    if (alert) alert.read = true;
    res.json({ ok: true });
  });

  // Cron jobs: weekly ROI analysis, monthly alerts
  cron.schedule("0 9 * * 1", () => {
    store.alerts.unshift({
      id: randomUUID(),
      title: "Weekly ROI Analysis Complete",
      createdAt: new Date().toISOString(),
      read: false,
    });
  });
  cron.schedule("0 8 1 * *", () => {
    store.alerts.unshift({
      id: randomUUID(),
      title: "Monthly ROI Report Ready",
      createdAt: new Date().toISOString(),
      read: false,
    });
  });

  return app;
}
