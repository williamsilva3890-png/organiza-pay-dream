import { ReactNode, useState, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Target,
  FileBarChart, Settings, Menu, LogOut, Crown, Camera, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/hooks/useFinanceData";
import logoImg from "@/assets/logo.png";
import { toast } from "sonner";

const navItems = [
  { icon: LayoutDashboard, label: "Painel", path: "/dashboard" },
  { icon: ArrowUpCircle, label: "Renda", path: "/dashboard/receitas" },
  { icon: ArrowDownCircle, label: "Despesas", path: "/dashboard/despesas" },
  { icon: Target, label: "Metas", path: "/dashboard/metas" },
  { icon: FileBarChart, label: "Relatórios", path: "/dashboard/relatorios" },
  { icon: Settings, label: "Configurações", path: "/dashboard/config" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  profile: Profile | null;
  isPremium: boolean;
  onProfileUpdate?: () => void;
  isAdmin?: boolean;
}

const DashboardLayout = ({ children, profile, isPremium, onProfileUpdate, isAdmin }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const displayName = profile?.display_name || "Usuário";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    const fileExt = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });
    
    if (uploadError) {
      toast.error("Erro ao enviar foto");
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    await supabase.from("profiles").update({ avatar_url: publicUrl } as any).eq("user_id", user.id);
    onProfileUpdate?.();
    toast.success("Foto atualizada!");
  };

  const AvatarDisplay = ({ size = "sm" }: { size?: "sm" | "lg" }) => {
    const sizeClass = size === "lg" ? "w-9 h-9" : "w-9 h-9";
    return avatarUrl ? (
      <img src={avatarUrl} alt={displayName} className={`${sizeClass} rounded-full object-cover`} />
    ) : (
      <div className={`${sizeClass} rounded-full bg-sidebar-primary/20 flex items-center justify-center`}>
        <span className="text-sm font-semibold text-sidebar-primary">{initials}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground flex flex-col transition-transform duration-200 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-sidebar-border">
          <img src={logoImg} alt="OrganizaPay" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-display font-bold text-lg text-sidebar-foreground">
            Organiza<span className="text-sidebar-primary">Pay</span>
          </span>
        </div>
        {/* User info with avatar edit */}
        <div className="px-4 py-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <AvatarDisplay />
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              {isPremium ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-full px-2 py-0.5 mt-0.5">
                  <Crown className="w-2.5 h-2.5" />
                  PREMIUM
                </span>
              ) : (
                <span className="text-[10px] text-sidebar-foreground/50 mt-0.5">Plano Gratuito</span>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                <item.icon className="w-5 h-5" />
                {item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/dashboard/admin" onClick={() => setSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                location.pathname === "/dashboard/admin" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
              <ShieldCheck className="w-5 h-5" />
              Admin
            </Link>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-sidebar-border">
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full">
            <LogOut className="w-5 h-5" />
            Sair
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-lg border-b border-border flex items-center px-4 lg:px-8">
          <button className="lg:hidden p-2 -ml-2 mr-2" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h2 className="font-display font-bold text-lg">Olá, {displayName}! 👋</h2>
            <p className="text-xs text-muted-foreground">
              {new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isPremium && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 text-amber-950 rounded-full px-2.5 py-1">
                <Crown className="w-3 h-3" />
                Premium
              </span>
            )}
            {avatarUrl ? (
              <img src={avatarUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-sm font-semibold text-primary">{initials}</span>
              </div>
            )}
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
