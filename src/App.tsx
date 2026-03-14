import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import ChatWidget from "@/components/chat/ChatWidget";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Components from "./pages/Components.tsx";
import Users from "./pages/cadastros/Users.tsx";
import Companies from "./pages/cadastros/Companies.tsx";
import People from "./pages/cadastros/People.tsx";
import ProductsServices from "./pages/cadastros/ProductsServices.tsx";
import Leads from "./pages/cadastros/Leads.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/componentes" element={<Components />} />
          <Route path="/cadastros/usuarios" element={<Users />} />
          <Route path="/cadastros/empresas" element={<Companies />} />
          <Route path="/cadastros/pessoas" element={<People />} />
          <Route path="/cadastros/produtos-servicos" element={<ProductsServices />} />
          <Route path="/cadastros/leads" element={<Leads />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
        <ChatWidget />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
