import { useState, useEffect } from "react";
import { User, Bell, Palette, Shield, Crown, Lock, Type, Layout, Monitor, Moon, Sun, MessageCircle, Lightbulb, Send, Check, RotateCcw, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFinanceData, FREE_LIMITS } from "@/hooks/useFinanceData";
import PremiumCheckoutDialog from "@/components/dashboard/PremiumCheckoutDialog";

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const ACCENT_COLORS = [
  { name: "Navy", hsl: "215 65% 25%", hslDark: "38 92% 50%" },
  { name: "Azul", hsl: "210 70% 50%", hslDark: "210 65% 55%" },
  { name: "Amber", hsl: "38 92% 50%", hslDark: "38 88% 55%" },
  { name: "Rosa", hsl: "330 70% 50%", hslDark: "330 65% 55%" },
  { name: "Laranja", hsl: "25 90% 50%", hslDark: "25 85% 55%" },
  { name: "Vermelho", hsl: "0 72% 50%", hslDark: "0 67% 50%" },
  { name: "Verde", hsl: "160 60% 40%", hslDark: "160 55% 50%" },
  { name: "Ciano", hsl: "190 80% 42%", hslDark: "190 75% 50%" },
  { name: "Roxo", hsl: "270 60% 55%", hslDark: "270 55% 60%" },
];

const FONT_OPTIONS = [
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "System", value: "system-ui, sans-serif" },
];

const CARD_STYLES = [
  { name: "Padrão", value: "default", borderRadius: "0.75rem", shadow: "0 1px 3px rgba(0,0,0,0.1)" },
  { name: "Arredondado", value: "rounded", borderRadius: "1.25rem", shadow: "0 2px 8px rgba(0,0,0,0.08)" },
  { name: "Flat", value: "flat", borderRadius: "0.5rem", shadow: "none" },
];

const SUGGESTION_OPTIONS = [
  { category: "Funcionalidade", text: "Adicionar controle de cartão de crédito" },
  { category: "Funcionalidade", text: "Criar relatório mensal em PDF" },
  { category: "Funcionalidade", text: "Adicionar categorias personalizadas" },
  { category: "Integração", text: "Integração com banco/conta digital" },
  { category: "Funcionalidade", text: "Adicionar lembrete de contas a pagar" },
  { category: "Funcionalidade", text: "Modo de orçamento mensal" },
];

const SuggestionsTab = ({ user, profile }: { user: any; profile: any }) => {
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sentIds, setSentIds] = useState<string[]>([]);

  const sendSuggestion = async (category: string, message: string, id?: string) => {
    if (!user) return;
    setSending(true);
    const { error } = await supabase.from("suggestions").insert({
      user_id: user.id,
      user_email: user.email,
      user_name: profile?.display_name || "Usuário",
      category,
      message,
    } as any);

    if (error) {
      toast.error("Erro ao enviar sugestão");
    } else {
      toast.success("Sugestão enviada com sucesso! Obrigado 🎉");
      if (id) setSentIds(prev => [...prev, id]);
      setCustomMessage("");
    }
    setSending(false);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Lightbulb className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-base">Envie sua sugestão</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-4">
        Escolha uma opção abaixo ou escreva sua própria sugestão. Sua opinião é muito importante para melhorarmos o OrganizaPay!
      </p>

      <div className="space-y-2 mb-4">
        {SUGGESTION_OPTIONS.map((opt) => {
          const isSent = sentIds.includes(opt.text);
          return (
            <button
              key={opt.text}
              disabled={sending || isSent}
              onClick={() => sendSuggestion(opt.category, opt.text, opt.text)}
              className={`w-full text-left p-3 rounded-lg border transition-all flex items-center gap-3 ${
                isSent ? "border-green-300 bg-green-50 dark:bg-green-950/20 dark:border-green-800" : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
            >
              {isSent ? (
                <Check className="w-4 h-4 text-green-500 shrink-0" />
              ) : (
                <Send className="w-4 h-4 text-muted-foreground shrink-0" />
              )}
              <span className="text-sm">{opt.text}</span>
              {isSent && <span className="text-[10px] text-green-600 dark:text-green-400 ml-auto">Enviada!</span>}
            </button>
          );
        })}
      </div>

      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-sm font-medium">Outra sugestão?</p>
        <Textarea
          placeholder="Descreva sua sugestão ou o que está precisando no sistema..."
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          className="min-h-[80px]"
          maxLength={500}
        />
        <Button
          variant="default"
          size="sm"
          className="gap-1.5"
          disabled={sending || !customMessage.trim()}
          onClick={() => sendSuggestion("Outra", customMessage.trim())}
        >
          <Send className="w-4 h-4" />
          Enviar Sugestão
        </Button>
      </div>
    </motion.div>
  );
};

const ResetTab = ({ finance }: Props) => {
  const { isPremium, resetAll, resetReceitas, resetDespesas, resetMetas } = finance;
  const [scheduledReset, setScheduledReset] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("organizapay-scheduled-reset") || "null");
    } catch { return null; }
  });
  const [resetDays, setResetDays] = useState("30");
  const [resetSections, setResetSections] = useState({ receitas: true, despesas: true, metas: false });

  // Check scheduled reset on mount
  useEffect(() => {
    if (!scheduledReset) return;
    const resetDate = new Date(scheduledReset.date);
    if (resetDate <= new Date()) {
      // Time to reset!
      resetAll(scheduledReset.sections).then(() => {
        localStorage.removeItem("organizapay-scheduled-reset");
        setScheduledReset(null);
        toast.success("Reset agendado executado com sucesso! 🔄");
      });
    }
  }, [scheduledReset]);

  const handleScheduleReset = () => {
    if (!isPremium) { toast.error("Disponível apenas no plano Premium! 🔒"); return; }
    const days = parseInt(resetDays);
    if (isNaN(days) || days < 1) { toast.error("Insira um número de dias válido"); return; }
    if (!resetSections.receitas && !resetSections.despesas && !resetSections.metas) {
      toast.error("Selecione pelo menos uma seção para resetar");
      return;
    }
    const resetDate = new Date();
    resetDate.setDate(resetDate.getDate() + days);
    const config = { date: resetDate.toISOString(), sections: resetSections, days };
    localStorage.setItem("organizapay-scheduled-reset", JSON.stringify(config));
    setScheduledReset(config);
    toast.success(`Reset agendado para ${resetDate.toLocaleDateString("pt-BR")}!`);
  };

  const cancelScheduledReset = () => {
    localStorage.removeItem("organizapay-scheduled-reset");
    setScheduledReset(null);
    toast.success("Reset agendado cancelado");
  };

  return (
    <>
      {/* Manual reset */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <RotateCcw className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Reset manual</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Zere dados de seções específicas. Esta ação não pode ser desfeita.</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!isPremium}
            onClick={async () => { if (confirm("Zerar todas as rendas?")) { await resetReceitas(); toast.success("Rendas zeradas!"); } }}>
            <RotateCcw className="w-3.5 h-3.5" />Zerar Rendas
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!isPremium}
            onClick={async () => { if (confirm("Zerar todas as despesas?")) { await resetDespesas(); toast.success("Despesas zeradas!"); } }}>
            <RotateCcw className="w-3.5 h-3.5" />Zerar Despesas
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!isPremium}
            onClick={async () => { if (confirm("Zerar todas as metas?")) { await resetMetas(); toast.success("Metas zeradas!"); } }}>
            <RotateCcw className="w-3.5 h-3.5" />Zerar Metas
          </Button>
        </div>
        {!isPremium && (
          <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1"><Lock className="w-3 h-3" /> Disponível apenas no plano Premium</p>
        )}
      </motion.div>

      {/* Scheduled reset */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Reset agendado</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Programe um reset automático. Escolha o intervalo em dias e quais seções deseja resetar.
        </p>

        {scheduledReset ? (
          <div className="space-y-3">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <p className="text-sm font-medium">📅 Reset agendado para {new Date(scheduledReset.date).toLocaleDateString("pt-BR")}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Seções: {[
                  scheduledReset.sections.receitas && "Rendas",
                  scheduledReset.sections.despesas && "Despesas",
                  scheduledReset.sections.metas && "Metas",
                ].filter(Boolean).join(", ")}
              </p>
            </div>
            <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={cancelScheduledReset}>
              Cancelar reset agendado
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Intervalo (dias)</label>
              <input
                type="number"
                value={resetDays}
                onChange={(e) => setResetDays(e.target.value)}
                min="1"
                className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                placeholder="Ex: 30"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Seções para resetar</label>
              <div className="space-y-2">
                {[
                  { key: "receitas" as const, label: "Rendas" },
                  { key: "despesas" as const, label: "Despesas" },
                  { key: "metas" as const, label: "Metas" },
                ].map((item) => (
                  <label key={item.key} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={resetSections[item.key]}
                      onChange={(e) => setResetSections(prev => ({ ...prev, [item.key]: e.target.checked }))}
                      className="rounded border-border"
                    />
                    <span className="text-sm">{item.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <Button variant="default" size="sm" className="gap-1.5" disabled={!isPremium} onClick={handleScheduleReset}>
              <Calendar className="w-4 h-4" />Agendar reset
            </Button>
            {!isPremium && (
              <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="w-3 h-3" /> Disponível apenas no plano Premium</p>
            )}
          </div>
        )}
      </motion.div>
    </>
  );
};

const ConfigPage = ({ finance }: Props) => {

  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile, isPremium, subscription } = finance;

  const [name, setName] = useState(profile?.display_name || "");
  const [profileType, setProfileType] = useState(profile?.profile_type || "solteiro");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("accent-color") || "270 60% 55%");
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem("font-family") || "'Plus Jakarta Sans', sans-serif");
  const [_compactLayout, _setCompactLayout] = useState(() => localStorage.getItem("compact-layout") === "true");
  const [cardStyle, setCardStyle] = useState(() => localStorage.getItem("card-style") || "default");
  const [borderRadius, setBorderRadius] = useState(() => parseInt(localStorage.getItem("border-radius") || "12"));
  const [showPremiumDialog, setShowPremiumDialog] = useState(false);

  // Apply accent color globally
  useEffect(() => {
    const darkColor = ACCENT_COLORS.find(c => c.hsl === accentColor)?.hslDark || accentColor;
    const color = theme === "dark" ? darkColor : accentColor;
    document.documentElement.style.setProperty("--primary", color);
    document.documentElement.style.setProperty("--ring", color);
    document.documentElement.style.setProperty("--sidebar-primary", color);
    document.documentElement.style.setProperty("--sidebar-ring", color);
    // Also update accent and success to match
    const parts = accentColor.split(" ");
    if (parts.length === 3) {
      const hue = parseInt(parts[0]);
      document.documentElement.style.setProperty("--accent", `${(hue + 10) % 360} 70% 60%`);
      document.documentElement.style.setProperty("--success", `${hue} 55% 50%`);
      document.documentElement.style.setProperty("--chart-income", color);
    }
    localStorage.setItem("accent-color", accentColor);
  }, [accentColor, theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-display", fontFamily);
    document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(el => {
      (el as HTMLElement).style.fontFamily = fontFamily;
    });
    localStorage.setItem("font-family", fontFamily);
  }, [fontFamily]);


  useEffect(() => {
    const style = CARD_STYLES.find(s => s.value === cardStyle);
    if (style) {
      document.documentElement.style.setProperty("--radius", style.borderRadius);
    }
    localStorage.setItem("card-style", cardStyle);
  }, [cardStyle]);

  useEffect(() => {
    document.documentElement.style.setProperty("--radius", `${borderRadius / 16}rem`);
    localStorage.setItem("border-radius", String(borderRadius));
  }, [borderRadius]);

  const handleSave = async () => {
    if (profileType === "casal" && !isPremium) {
      toast.error("O perfil Casal está disponível apenas no plano Premium!");
      return;
    }
    await updateProfile({ display_name: name, profile_type: profileType });
    toast.success("Perfil atualizado!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua experiência no OrganizaPay</p>
      </div>

      <Tabs defaultValue="perfil" className="w-full">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 h-auto gap-1">
          <TabsTrigger value="perfil" className="gap-1 text-xs px-2"><User className="w-3.5 h-3.5" /><span className="hidden sm:inline">Perfil</span><span className="sm:hidden">Perfil</span></TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1 text-xs px-2"><Palette className="w-3.5 h-3.5" /><span className="hidden sm:inline">Aparência</span><span className="sm:hidden">Tema</span></TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1 text-xs px-2"><Bell className="w-3.5 h-3.5" /><span className="hidden sm:inline">Alertas</span><span className="sm:hidden">Alertas</span></TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1 text-xs px-2"><Shield className="w-3.5 h-3.5" /><span className="hidden sm:inline">Segurança</span><span className="sm:hidden">Seg.</span></TabsTrigger>
          <TabsTrigger value="sugestoes" className="gap-1 text-xs px-2"><Lightbulb className="w-3.5 h-3.5" /><span className="hidden sm:inline">Sugestões</span><span className="sm:hidden">Sugest.</span></TabsTrigger>
          <TabsTrigger value="reset" className="gap-1 text-xs px-2"><RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset</span><span className="sm:hidden">Reset</span></TabsTrigger>
        </TabsList>

        {/* Profile tab */}
        <TabsContent value="perfil" className="space-y-5 mt-5">
          {/* Plan info */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-xl p-5 border shadow-card ${isPremium ? "bg-gradient-to-r from-primary/10 to-accent/10 border-primary/30" : "bg-card border-border"}`}>
            <div className="flex items-center gap-2 mb-3">
              <Crown className={`w-5 h-5 ${isPremium ? "text-primary" : "text-muted-foreground"}`} />
              <h3 className="font-display font-bold text-base">Plano {isPremium ? "Premium" : "Gratuito"}</h3>
              {isPremium && <span className="text-xs bg-primary/20 text-primary rounded-full px-2 py-0.5 font-semibold">Ativo</span>}
            </div>
            {isPremium ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Você tem acesso ilimitado a todas as funcionalidades! 🎉</p>
                <div className="flex items-center gap-3 pt-2">
                  <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Data de vencimento do plano</label>
                    <input
                      type="date"
                      defaultValue={(finance.subscription as any)?.expires_at || ""}
                      className="h-9 px-3 rounded-lg border border-border bg-background text-sm w-full max-w-[200px] focus:outline-none focus:ring-2 focus:ring-primary/30"
                      onChange={async (e) => {
                        if (!e.target.value || !user) return;
                        await supabase.from("subscriptions").update({ expires_at: e.target.value } as any).eq("user_id", user.id);
                        toast.success("Data de vencimento salva!");
                        finance.fetchAll();
                      }}
                    />
                  </div>
                  {(finance.subscription as any)?.expires_at && (
                    <span className="text-xs text-muted-foreground mt-4">
                      {new Date((finance.subscription as any).expires_at).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Limites do plano gratuito:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>{FREE_LIMITS.receitas} renda</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>{FREE_LIMITS.despesas} despesas</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>Conta individual</span></div>
                </div>

                {/* User ID for support */}
                <div className="bg-muted rounded-lg p-3 text-center space-y-1">
                  <p className="text-xs text-muted-foreground">Seu código de identificação:</p>
                  <p className="font-mono font-bold text-sm select-all">{user?.id || "—"}</p>
                </div>

                <Button variant="default" size="sm" className="w-full gap-1.5" onClick={() => window.open("https://go.tribopay.com.br/i7egqo5x95", "_blank", "noopener,noreferrer")}>
                  <Crown className="w-4 h-4" />Assinar Premium — R$ 9,90/mês
                </Button>

                <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                  <p className="text-xs text-amber-900 dark:text-amber-200">
                    Caso tenha feito o pagamento e não tenha ficado Premium, envie seu <strong>código acima</strong>, o <strong>comprovante do Pix</strong> e o <strong>Gmail utilizado</strong> para nosso suporte:
                  </p>
                  <a
                    href={`https://wa.me/5592985968379?text=${encodeURIComponent("Fiz o pagamento, mas não fui para o Premium.")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs text-green-700 dark:text-green-400 font-semibold hover:underline"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    WhatsApp de Suporte
                  </a>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Dados do Perfil</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nome</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Email</label>
                <input type="email" value={user?.email || ""} disabled
                  className="w-full h-10 px-3 rounded-lg border border-border bg-muted text-sm text-muted-foreground" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tipo de perfil</label>
                <select value={profileType} onChange={(e) => setProfileType(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="solteiro">Solteiro</option>
                  <option value="empreendedor">Micro Empreendedor</option>
                  <option value="casal">Casal {!isPremium ? "🔒 Premium" : ""}</option>
                </select>
              </div>
              <Button variant="default" size="sm" onClick={handleSave}>Salvar alterações</Button>
            </div>
          </motion.div>
        </TabsContent>

        {/* Appearance tab */}
        <TabsContent value="aparencia" className="space-y-5 mt-5">
          {/* Theme toggle */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Tema</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => { if (theme === "dark") toggleTheme(); }}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "light" ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"}`}>
                <Sun className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Claro</p>
                  <p className="text-xs text-muted-foreground">Fundo branco</p>
                </div>
              </button>
              <button onClick={() => { if (theme === "light") toggleTheme(); }}
                className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all ${theme === "dark" ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"}`}>
                <Moon className="w-5 h-5" />
                <div className="text-left">
                  <p className="text-sm font-medium">Escuro</p>
                  <p className="text-xs text-muted-foreground">Fundo escuro</p>
                </div>
              </button>
            </div>
          </motion.div>

          {/* Accent color */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Cor de destaque</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Muda a cor principal do painel inteiro</p>
            <div className="grid grid-cols-3 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button key={color.name} onClick={() => setAccentColor(color.hsl)}
                  className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all ${accentColor === color.hsl ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"}`}>
                  <div className="w-6 h-6 rounded-full" style={{ backgroundColor: `hsl(${color.hsl})` }} />
                  <span className="text-sm font-medium">{color.name}</span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Border radius */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Arredondamento</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Ajuste o arredondamento dos cards e botões</p>
            <div className="flex items-center gap-4">
              <span className="text-xs text-muted-foreground w-8">0px</span>
              <Slider value={[borderRadius]} onValueChange={(v) => setBorderRadius(v[0])} min={0} max={24} step={2} className="flex-1" />
              <span className="text-xs text-muted-foreground w-10">{borderRadius}px</span>
            </div>
            <div className="mt-3 flex gap-3">
              <div className="w-20 h-12 bg-primary/10 border border-border" style={{ borderRadius: `${borderRadius}px` }} />
              <div className="flex-1 h-12 bg-primary/10 border border-border" style={{ borderRadius: `${borderRadius}px` }} />
            </div>
          </motion.div>

          {/* Font */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Type className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Fonte</h3>
            </div>
            <div className="space-y-2">
              {FONT_OPTIONS.map((font) => (
                <button key={font.name} onClick={() => setFontFamily(font.value)}
                  className={`w-full text-left p-3 rounded-lg border-2 transition-all ${fontFamily === font.value ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"}`}>
                  <span className="text-sm font-medium" style={{ fontFamily: font.value }}>{font.name}</span>
                  <p className="text-xs text-muted-foreground mt-0.5" style={{ fontFamily: font.value }}>O rápido rato marrom pula sobre o cão preguiçoso.</p>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Layout mode */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Modo do Painel</h3>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Escolha o nível de detalhes exibido no dashboard</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: "basico", label: "Básico", desc: "Cards resumidos", preview: (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded bg-primary/30" />
                    <div className="h-2 w-3/4 rounded bg-primary/20" />
                  </div>
                )},
                { value: "normal", label: "Normal", desc: "Cards + gráficos", preview: (
                  <div className="space-y-1">
                    <div className="h-2 w-full rounded bg-primary/30" />
                    <div className="flex gap-0.5">
                      <div className="h-3 w-1/3 rounded bg-primary/25" />
                      <div className="h-3 w-1/3 rounded bg-primary/20" />
                      <div className="h-3 w-1/3 rounded bg-primary/15" />
                    </div>
                    <div className="h-2 w-2/3 rounded bg-primary/20" />
                  </div>
                )},
                { value: "avancado", label: "Avançado", desc: "Tudo + detalhes", preview: (
                  <div className="space-y-1">
                    <div className="flex gap-0.5">
                      <div className="h-2 w-1/4 rounded bg-primary/30" />
                      <div className="h-2 w-1/4 rounded bg-primary/25" />
                      <div className="h-2 w-1/4 rounded bg-primary/20" />
                      <div className="h-2 w-1/4 rounded bg-primary/15" />
                    </div>
                    <div className="flex gap-0.5">
                      <div className="h-3 w-1/2 rounded bg-primary/25" />
                      <div className="h-3 w-1/2 rounded bg-primary/20" />
                    </div>
                    <div className="h-2 w-full rounded bg-primary/15" />
                    <div className="h-1.5 w-3/4 rounded bg-primary/10" />
                  </div>
                )},
              ].map((mode) => {
                const current = localStorage.getItem("dashboard-layout") || "normal";
                return (
                  <button key={mode.value} onClick={() => { localStorage.setItem("dashboard-layout", mode.value); window.dispatchEvent(new Event("storage")); toast.success(`Layout "${mode.label}" ativado!`); }}
                    className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${current === mode.value ? "border-primary shadow-md" : "border-border hover:border-muted-foreground/30"}`}>
                    <div className="w-full p-2 rounded bg-muted/50">{mode.preview}</div>
                    <span className="text-xs font-medium">{mode.label}</span>
                    <span className="text-[10px] text-muted-foreground">{mode.desc}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </TabsContent>

        {/* Notifications tab */}
        <TabsContent value="notificacoes" className="space-y-5 mt-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Notificações</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: "Alertas de gastos acima do limite", defaultOn: true },
                { label: "Resumo semanal por email", defaultOn: false },
                { label: "Lembrete de metas próximas ao prazo", defaultOn: true },
                { label: "Resumo diário às 23h (push + popup)", defaultOn: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm">{item.label}</span>
                  <Switch defaultChecked={item.defaultOn} />
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">
                💡 Para receber notificações push, permita as notificações do navegador quando solicitado.
              </p>
            </div>
          </motion.div>
        </TabsContent>

        {/* Security tab */}
        <TabsContent value="seguranca" className="space-y-5 mt-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Segurança</h3>
            </div>
            <div className="space-y-3">
              <Button variant="outline" size="sm">Alterar senha</Button>
            </div>
          </motion.div>
        </TabsContent>
        {/* Suggestions tab */}
        <TabsContent value="sugestoes" className="space-y-5 mt-5">
          <SuggestionsTab user={user} profile={profile} />

          {/* WhatsApp support */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <MessageCircle className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Suporte</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Precisa de ajuda? Entre em contato pelo nosso WhatsApp.</p>
            <a
              href={`https://wa.me/5592985968379?text=${encodeURIComponent("Olá, preciso de ajuda com o OrganizaPay.")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="outline" size="sm" className="gap-1.5">
                <MessageCircle className="w-4 h-4" />
                WhatsApp de Suporte
              </Button>
            </a>
          </motion.div>
        </TabsContent>
        {/* Reset tab */}
        <TabsContent value="reset" className="space-y-5 mt-5">
          <ResetTab finance={finance} />
        </TabsContent>
      </Tabs>
      <PremiumCheckoutDialog open={showPremiumDialog} onOpenChange={setShowPremiumDialog} />
    </div>
  );
};

export default ConfigPage;
