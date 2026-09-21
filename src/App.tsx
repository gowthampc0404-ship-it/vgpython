import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Index from "./pages/Index";
import Admin from "./pages/Admin";
import LearnPython from "./pages/LearnPython";
import LearnFiles from "./pages/LearnFiles";
import LearnMySQL from "./pages/LearnMySQL";
import Practicals from "./pages/Practicals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/ide" element={<Index />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/learn/python" element={<LearnPython />} />
          <Route path="/learn/files" element={<LearnFiles />} />
          <Route path="/learn/mysql" element={<LearnMySQL />} />
          <Route path="/practicals" element={<Practicals />} />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
