import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { ScrollToTop } from "@/components/ScrollToTop";
import PublicLayout from "./components/layout/PublicLayout";
import DashboardLayout from "./components/layout/DashboardLayout";
import Home from "./pages/Home";
import Documentacao from "./pages/Documentacao";
import Planos from "./pages/Planos";
import Login from "./pages/Login";
import Registro from "./pages/Registro";
import Dashboard from "./pages/Dashboard";
import Assinaturas from "./pages/Assinaturas";
import Downloads from "./pages/Downloads";
import MudarPlano from "./pages/MudarPlano";
import HistoricoPagamentos from "./pages/HistoricoPagamentos";
import Admin from "./pages/Admin";
import AdminUsers from "./pages/AdminUsers";
import AdminLicenses from "./pages/AdminLicenses";
import VersoesDoSistema from "./pages/admin/VersoesDoSistema";
import AuthCallback from "./pages/AuthCallback";
import VerificarEmail from "./pages/VerificarEmail";
import RecuperarSenha from "./pages/RecuperarSenha";
import Checkout from "./pages/Checkout";
import OrcamentoEnterprise from "./pages/OrcamentoEnterprise";
import AdminEnterpriseQuotes from "./pages/AdminEnterpriseQuotes";
import AdminContracts from "./pages/AdminContracts";
import MeusContratos from "./pages/MeusContratos";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            {/* Auth Callback Route (must be before PublicLayout) */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Email Verification and Password Recovery Routes */}
            <Route path="/verificar-email" element={<VerificarEmail />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />

            {/* Public Routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/documentacao" element={<Documentacao />} />
              <Route path="/planos" element={<Planos />} />
              <Route path="/planos/enterprise" element={<OrcamentoEnterprise />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Registro />} />
            </Route>

            {/* Authenticated Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="assinaturas" element={<Assinaturas />} />
              <Route path="assinaturas/mudar-plano" element={<MudarPlano />} />
              <Route path="pagamentos" element={<HistoricoPagamentos />} />
              <Route path="downloads" element={<Downloads />} />
              <Route path="contratos" element={<MeusContratos />} />
              <Route
                path="admin"
                element={
                  <ProtectedRoute requireAdmin>
                    <Admin />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/usuarios"
                element={
                  <ProtectedRoute requireManager>
                    <AdminUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/licencas"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminLicenses />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/versoes"
                element={
                  <ProtectedRoute requireAdmin>
                    <VersoesDoSistema />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/orcamentos"
                element={
                  <ProtectedRoute requireAdmin>
                    <AdminEnterpriseQuotes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/contratos"
                element={
                  <ProtectedRoute requireManager>
                    <AdminContracts />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
