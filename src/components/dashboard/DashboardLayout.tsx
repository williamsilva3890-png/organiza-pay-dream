import { ReactNode, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ArrowUpCircle,
  ArrowDownCircle,
  Target,
  FileBarChart,
  Settings,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/dashboard" },
  { icon: ArrowUpCircle, label: "Receitas", path: "/dashboard/receitas" },
  { icon: ArrowDownCircle, label: "Despesas", path: "/dashboard/despesas" },
  { icon: Target, label: "Metas", path: "/dashboard/metas" },
  { icon: FileBarChart, label: "Relatórios", path: "/dashboard/relatorios" },
  { icon: Settings, label: "Configurações", path: "/dashboard/config" },
];

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
          <div className="w-8 h-8 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <span className="text-sidebar-primary-foreground font-bold text-sm">O</span>
          </div>
          <span className="font-display font-bold text-lg text-sidebar-foreground">
            Organiza<span className="text-sidebar-primary">Pay</span>
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sair
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border flex items-center px-4 lg:px-8">
          <button
            className="lg:hidden p-2 -ml-2 mr-2"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg">Olá, bem-vindo! 👋</h2>
            <p className="text-xs text-muted-foreground">Fevereiro de 2026</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary">JP</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
