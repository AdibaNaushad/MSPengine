/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/** Core Entities */
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface ClientRecord {
  id: string;
  clientName: string;
  company: string;
  contact: string;
  financeCategory: string;
  createdAt: string;
}

export interface ExtractedInvoice {
  invoiceNumber?: string;
  invoiceDate?: string;
  dueDate?: string;
  clientName: string;
  vendorName?: string;
  project: string;
  amount: number;
  taxes?: number;
  taxRate?: number;
  paymentStatus?: "paid" | "pending" | "overdue" | "cancelled";
  daysPending?: number;
  category?: "revenue" | "expense" | "tax" | "outstanding";
  summary?: string;
  anomalies?: string[];
}

export interface ExpenseItem {
  id: string;
  clientId: string;
  clientName: string;
  project: string;
  amount: number;
  date: string; // ISO date
  source: "upload" | "agent" | "system";
  invoiceData?: ExtractedInvoice;
}

export interface FinanceStats {
  roiPercent: number; // e.g., 35 for 35%
  profitabilitySeries: { date: string; value: number }[];
  wasteAlerts: {
    id: string;
    message: string;
    severity: "low" | "medium" | "high";
  }[];
}

export type AgentType =
  | "license-optimizer"
  | "cloud-spend-guard"
  | "sales-pitch-assistant";

export interface AgentActionResponse {
  success: boolean;
  message: string;
  updatedStats?: FinanceStats;
}

export interface AlertItem {
  id: string;
  title: string;
  createdAt: string;
  read: boolean;
}

/** Auth */
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  ok: boolean;
  token?: string;
  user?: User;
  error?: string;
}

/** CRUD + Upload */
export interface AddClientRequest {
  clientName: string;
  company: string;
  contact: string;
  financeCategory: string;
}

export interface UploadInvoiceResponse {
  ok: boolean;
  totalAmount?: number;
  parsed?: Omit<ExpenseItem, "id" | "clientId"> & { clientId?: string };
  extracted?: ExtractedInvoice;
}

/** Demo endpoint type kept for example */
export interface DemoResponse {
  message: string;
}
