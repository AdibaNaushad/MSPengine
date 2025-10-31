import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ClientSetup from "./pages/ClientSetup";
import Reports from "./pages/Reports";
import AIAssistant from "./pages/AIAssistant";
import AIInsights from "./pages/AIInsights";
import Layout from "./components/Layout";
import { useEffect } from "react";

const queryClient = new QueryClient();

export function App() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Layout>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/login" element={<Login />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/client-setup" element={<ClientSetup />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/ai-insights" element={<AIInsights />} />
              <Route path="/ai-assistant" element={<AIAssistant />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}
