import { ReactNode, useState, useRef, useEffect } from "react";
import AvatarCropDialog from "@/components/dashboard/AvatarCropDialog";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, ArrowUpCircle, ArrowDownCircle, Target,
  FileBarChart, Settings, Menu, LogOut, Crown, Camera, ShieldCheck,
  ChevronLeft, ChevronRight, MessageCircle, Phone,
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
  { icon: MessageCircle, label: "Chat", path: "/dashboard/chat" },
  { icon: Phone, label: "WhatsApp", path: "/dashboard/whatsapp" },
];

interface DashboardLayoutProps {
  children: ReactNode;
  profile: Profile | null;
  isPremium: boolean;
  onProfileUpdate?: () => void;
  isAdmin?: boolean;
  subscription?: { plan: string; expires_at?: string | null };
}

const DashboardLayout = ({ children, profile, isPremium, onProfileUpdate, isAdmin, subscription }: DashboardLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem("sidebar-collapsed") === "true");
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Check for unread admin replies on suggestions
  useEffect(() => {
    if (!user) return;
    const checkReplies = async () => {
      const { data } = await supabase
        .from("suggestions")
        .select("id, admin_reply")
        .eq("user_id", user.id)
        .not("admin_reply", "is", null);
      if (data && data.length > 0) {
        const readKey = "organizapay-read-replies";
        const readIds: string[] = JSON.parse(localStorage.getItem(readKey) || "[]");
        const unread = data.filter((s: any) => !readIds.includes(s.id));
        if (unread.length > 0) {
          toast.info(`📩 Você tem ${unread.length} resposta(s) da equipe! Veja em Configurações > Sugestões.`, { duration: 8000 });
        }
      }
    };
    checkReplies();
  }, [user]);

  // Check for new friend-created debts
  useEffect(() => {
    if (!user) return;
    const checkFriendDebts = async () => {
      const { data } = await supabase
        .from("despesas")
        .select("id, description, creditor_name, date, amount")
        .eq("user_id", user.id)
        .not("created_by", "is", null)
        .eq("paid", false);
      if (data && data.length > 0) {
        const seenKey = "organizapay-seen-debts";
        const seenIds: string[] = JSON.parse(localStorage.getItem(seenKey) || "[]");
        const unseen = data.filter((d: any) => !seenIds.includes(d.id));
        if (unseen.length > 0) {
          unseen.forEach((d: any) => {
            toast.warning(`💸 ${d.creditor_name} criou uma dívida: "${d.description}" de R$ ${Number(d.amount).toFixed(2)} para ${new Date(d.date).toLocaleDateString("pt-BR")}`, { duration: 10000 });
          });
          localStorage.setItem(seenKey, JSON.stringify([...seenIds, ...unseen.map((d: any) => d.id)]));
        }
      }
    };
    checkFriendDebts();
  }, [user]);

  const displayName = profile?.display_name || "Usuário";
  const initials = displayName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
  const avatarUrl = profile?.avatar_url;

  const handleLogout = async () => {
    await signOut();
    navigate("/");
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setCropDialogOpen(true);
    e.target.value = "";
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!user) return;
    const filePath = `${user.id}/avatar.png`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, croppedBlob, { upsert: true, contentType: 'image/png' });
    
    if (uploadError) {
      toast.error("Erro ao enviar foto");
      return;
    }
    
    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);
    
    const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
    await supabase.from("profiles").update({ avatar_url: urlWithCacheBust } as any).eq("user_id", user.id);
    onProfileUpdate?.();
    toast.success("Foto atualizada!");
  };

  const sidebarWidth = sidebarCollapsed ? "w-[72px]" : "w-64";

  return (
    <div className="min-h-screen bg-background flex">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 left-0 z-50 h-screen bg-sidebar text-sidebar-foreground flex flex-col transition-all duration-200 lg:translate-x-0",
        sidebarWidth,
        sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0"
      )}>
        {/* Logo */}
        <div className={cn("flex items-center gap-2 h-16 border-b border-sidebar-border", sidebarCollapsed ? "px-3 justify-center" : "px-6")}>
          <img src={logoImg} alt="OrganizaPay" className="w-8 h-8 rounded-lg object-cover shrink-0" />
          {!sidebarCollapsed && (
            <span className="font-display font-bold text-lg text-sidebar-foreground">
              Organiza<span className="text-sidebar-primary">Pay</span>
            </span>
          )}
        </div>

        {/* User info */}
        <div className={cn("border-b border-sidebar-border", sidebarCollapsed ? "px-2 py-3" : "px-4 py-6")}>
          <div className="flex flex-col items-center gap-2">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className={cn("rounded-full object-cover border-2 border-sidebar-foreground/30", sidebarCollapsed ? "w-10 h-10" : "w-20 h-20")} />
              ) : (
                <div className={cn("rounded-full bg-sidebar-accent border-2 border-sidebar-foreground/30 flex items-center justify-center", sidebarCollapsed ? "w-10 h-10" : "w-20 h-20")}>
                  <span className={cn("font-semibold text-sidebar-foreground", sidebarCollapsed ? "text-sm" : "text-2xl")}>{initials}</span>
                </div>
              )}
              {!sidebarCollapsed && (
                <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-5 h-5 text-white" />
                </div>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarSelect} />
            </div>
            {!sidebarCollapsed && (
              <div className="text-center mt-1">
                <p className="text-sm font-semibold text-sidebar-foreground truncate max-w-[180px]">{displayName}</p>
                <p className="text-[11px] text-sidebar-foreground/50 truncate max-w-[180px]">{user?.email}</p>
                {isPremium && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-gradient-to-r from-sidebar-primary to-sidebar-primary/80 text-sidebar-primary-foreground rounded-full px-2 py-0.5 mt-1.5">
                    <Crown className="w-2.5 h-2.5" />
                    PREMIUM
                  </span>
                )}
                {isPremium && subscription?.expires_at && (
                  <p className="text-[10px] text-sidebar-foreground/60 mt-1">
                    Vence: {new Date(subscription.expires_at).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  sidebarCollapsed ? "px-2 justify-center" : "px-3",
                  isActive ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}>
                <item.icon className="w-5 h-5 shrink-0" />
                {!sidebarCollapsed && item.label}
              </Link>
            );
          })}
          {isAdmin && (
            <Link to="/dashboard/admin" onClick={() => setSidebarOpen(false)}
              title={sidebarCollapsed ? "Admin" : undefined}
              className={cn(
                "flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                sidebarCollapsed ? "px-2 justify-center" : "px-3",
                location.pathname === "/dashboard/admin" ? "bg-sidebar-accent text-sidebar-primary" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              )}>
              <ShieldCheck className="w-5 h-5 shrink-0" />
              {!sidebarCollapsed && "Admin"}
            </Link>
          )}
        </nav>

        {/* Collapse toggle (desktop only) */}
        <div className="hidden lg:flex px-2 py-2 border-t border-sidebar-border">
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn("flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full",
              sidebarCollapsed ? "px-2 justify-center" : "px-3"
            )}>
            {sidebarCollapsed ? <ChevronRight className="w-5 h-5" /> : <><ChevronLeft className="w-5 h-5" /> Recolher</>}
          </button>
        </div>

        <div className="px-2 py-3 border-t border-sidebar-border">
          <button onClick={handleLogout}
            title={sidebarCollapsed ? "Sair" : undefined}
            className={cn("flex items-center gap-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors w-full",
              sidebarCollapsed ? "px-2 justify-center" : "px-3"
            )}>
            <LogOut className="w-5 h-5 shrink-0" />
            {!sidebarCollapsed && "Sair"}
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
              <span className="hidden sm:inline-flex items-center gap-1 text-xs font-bold bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full px-2.5 py-1">
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
      <AvatarCropDialog
        open={cropDialogOpen}
        onOpenChange={setCropDialogOpen}
        imageFile={selectedFile}
        onCropComplete={handleCropComplete}
      />
    </div>
  );
};

export default DashboardLayout;
