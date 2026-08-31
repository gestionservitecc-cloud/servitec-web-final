import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const Index = lazy(() => import("./pages/Index"));
const Servicios = lazy(() => import("./pages/Servicios"));
const Tienda = lazy(() => import("./pages/Tienda"));
const Condiciones = lazy(() => import("./pages/Condiciones"));
const Conocenos = lazy(() => import("./pages/Conocenos"));
const Contacto = lazy(() => import("./pages/Contacto"));
const FAQs = lazy(() => import("./pages/FAQs"));
const FormasPago = lazy(() => import("./pages/FormasPago"));
const Presupuesto = lazy(() => import("./pages/Presupuesto"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Stock = lazy(() => import("./pages/Stock"));
const Admin = lazy(() => import("./pages/Admin"));
const ArmarPc = lazy(() => import("./pages/ArmarPc"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense
          fallback={<div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">Cargando...</div>}
        >
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/servicios" element={<Servicios />} />
            <Route path="/tienda" element={<Tienda />} />
            <Route path="/condiciones" element={<Condiciones />} />
            <Route path="/conocenos" element={<Conocenos />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/faqs" element={<FAQs />} />
            <Route path="/formas-de-pago" element={<FormasPago />} />
            <Route path="/presupuesto" element={<Presupuesto />} />
            <Route path="/stock" element={<Stock />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/armar-pc" element={<ArmarPc />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
