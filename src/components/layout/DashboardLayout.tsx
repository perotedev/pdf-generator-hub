import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  CreditCard,
  Download,
  LogOut,
  Menu,
  X,
  User,
  Receipt,
  Settings,
  Users,
  Key,
  PackageOpen,
  TextQuote,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import CapidocLogo from "@/components/CapidocLogo";

const DashboardLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isManager, canManageUsers } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDateTime = (date: Date) => {
    const diasSemana = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado",
    ];
    const meses = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];

    const diaSemana = diasSemana[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    const ano = date.getFullYear();
    const horas = String(date.getHours()).padStart(2, "0");
    const minutos = String(date.getMinutes()).padStart(2, "0");

    return {
      data: `${diaSemana}, ${dia} de ${mes} de ${ano}`,
      hora: `${horas}:${minutos}`,
    };
  };

  const { data, hora } = formatDateTime(currentDateTime);

  const allNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, requiresPermission: false },
    { href: "/dashboard/assinaturas", label: "Minhas Assinaturas", icon: CreditCard, requiresPermission: false },
    { href: "/dashboard/pagamentos", label: "Pagamentos", icon: Receipt, requiresPermission: false },
    { href: "/dashboard/downloads", label: "Downloads", icon: Download, requiresPermission: false },
    { href: "/dashboard/admin", label: "Configurações", icon: Settings, requiresAdmin: true },
    { href: "/dashboard/admin/usuarios", label: "Gerenciar Usuários", icon: Users, requiresManager: true },
    { href: "/dashboard/admin/licencas", label: "Licenças Standalone", icon: Key, requiresAdmin: true },
    { href: "/dashboard/admin/orcamentos", label: "Orçamentos", icon: TextQuote, requiresAdmin: true },
    { href: "/dashboard/admin/versoes", label: "Versões do Sistema", icon: PackageOpen, requiresAdmin: true },
  ];

  const navLinks = allNavLinks.filter(link => {
    if (link.requiresAdmin) return isAdmin;
    if (link.requiresManager) return canManageUsers;
    return true;
  });

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="flex min-h-screen">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-border bg-card sticky top-0 h-screen">
        <div style={{transform: "scale(0.9)", marginLeft: "-10px"}} className="flex h-16 items-center border-b border-border px-6">
          <CapidocLogo variant="full" linkTo={null} />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Mobile */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-card transition-transform lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center justify-between border-b border-border px-6">
          <CapidocLogo variant="sidebar" size="sm" linkTo={null} />
          <button onClick={() => setSidebarOpen(false)}>
            <X className="h-6 w-6" />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                }`}
              >
                <Icon className="h-5 w-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <button
              className="lg:hidden p-2"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden md:block">
              <div className="text-sm font-medium text-foreground">
                {data}
              </div>
              <div className="text-xs text-muted-foreground">
                {hora}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-row-reverse sm:flex-row">
              
              {/* Avatar */}
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                <User className="h-5 w-5 text-primary-foreground" />
              </div>

              {/* Mobile: primeiro nome + cargo */}
              <div className="sm:hidden text-right">
                <div className="text-sm font-medium text-foreground">
                  {user?.name?.split(' ')[0] || 'Usuário'}
                </div>
                {isAdmin && (
                  <div className="text-xs text-muted-foreground">
                    Administrador
                  </div>
                )}
                {isManager && !isAdmin && (
                  <div className="text-xs text-muted-foreground">
                    Gerente
                  </div>
                )}
              </div>

              {/* Desktop: nome completo + cargo */}
              <div className="hidden sm:block">
                <div className="text-sm font-medium text-foreground">
                  {user?.name || 'Usuário'}
                </div>
                {isAdmin && (
                  <div className="text-xs text-muted-foreground">
                    Administrador
                  </div>
                )}
                {isManager && !isAdmin && (
                  <div className="text-xs text-muted-foreground">
                    Gerente
                  </div>
                )}
              </div>

            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-auto bg-background">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
