import { useState, useEffect } from "react";
import { User, Bell, Palette, Shield, Crown, Lock, Type, Layout } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useFinanceData, FREE_LIMITS } from "@/hooks/useFinanceData";

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const ACCENT_COLORS = [
  { name: "Esmeralda", hsl: "160 60% 38%", hslDark: "160 55% 48%" },
  { name: "Azul", hsl: "210 70% 50%", hslDark: "210 65% 55%" },
  { name: "Roxo", hsl: "270 60% 55%", hslDark: "270 55% 60%" },
  { name: "Rosa", hsl: "330 70% 50%", hslDark: "330 65% 55%" },
  { name: "Laranja", hsl: "25 90% 50%", hslDark: "25 85% 55%" },
  { name: "Vermelho", hsl: "0 72% 50%", hslDark: "0 67% 50%" },
];

const FONT_OPTIONS = [
  { name: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Inter", value: "'Inter', sans-serif" },
  { name: "System", value: "system-ui, sans-serif" },
];

const ConfigPage = ({ finance }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile, isPremium, subscription } = finance;

  const [name, setName] = useState(profile?.display_name || "");
  const [profileType, setProfileType] = useState(profile?.profile_type || "solteiro");
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem("accent-color") || "160 60% 38%");
  const [fontFamily, setFontFamily] = useState(() => localStorage.getItem("font-family") || "'Plus Jakarta Sans', sans-serif");
  const [compactLayout, setCompactLayout] = useState(() => localStorage.getItem("compact-layout") === "true");

  useEffect(() => {
    document.documentElement.style.setProperty("--primary", accentColor);
    const darkColor = ACCENT_COLORS.find(c => c.hsl === accentColor)?.hslDark || accentColor;
    if (theme === "dark") document.documentElement.style.setProperty("--primary", darkColor);
    document.documentElement.style.setProperty("--ring", accentColor);
    document.documentElement.style.setProperty("--sidebar-primary", theme === "dark" ? darkColor : accentColor);
    document.documentElement.style.setProperty("--sidebar-ring", theme === "dark" ? darkColor : accentColor);
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
    localStorage.setItem("compact-layout", String(compactLayout));
  }, [compactLayout]);

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="perfil" className="gap-1.5 text-xs"><User className="w-3.5 h-3.5" />Perfil</TabsTrigger>
          <TabsTrigger value="aparencia" className="gap-1.5 text-xs"><Palette className="w-3.5 h-3.5" />Aparência</TabsTrigger>
          <TabsTrigger value="notificacoes" className="gap-1.5 text-xs"><Bell className="w-3.5 h-3.5" />Alertas</TabsTrigger>
          <TabsTrigger value="seguranca" className="gap-1.5 text-xs"><Shield className="w-3.5 h-3.5" />Segurança</TabsTrigger>
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
              <p className="text-sm text-muted-foreground">Você tem acesso ilimitado a todas as funcionalidades! 🎉</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Limites do plano gratuito:</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>{FREE_LIMITS.receitas} receitas</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>{FREE_LIMITS.despesas} despesas</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>{FREE_LIMITS.metas} metas</span></div>
                  <div className="flex items-center gap-1.5"><Lock className="w-3 h-3 text-muted-foreground" /><span>Conta individual</span></div>
                </div>
                <Button variant="default" size="sm" className="mt-3 gap-1.5"><Crown className="w-4 h-4" />Fazer upgrade para Premium</Button>
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
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Tema</h3>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Modo escuro</span>
              <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Cor de destaque</h3>
            </div>
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
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

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Layout className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Layout</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-medium">Layout compacto</span>
                <p className="text-xs text-muted-foreground">Reduz espaçamentos para mostrar mais informações</p>
              </div>
              <Switch checked={compactLayout} onCheckedChange={setCompactLayout} />
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
      </Tabs>
    </div>
  );
};

export default ConfigPage;
