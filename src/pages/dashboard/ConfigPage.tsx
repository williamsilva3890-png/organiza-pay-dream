import { useState } from "react";
import { User, Bell, Palette, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import type { useFinanceData } from "@/hooks/useFinanceData";

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const ConfigPage = ({ finance }: Props) => {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  const { profile, updateProfile } = finance;

  const [name, setName] = useState(profile?.display_name || "");
  const [profileType, setProfileType] = useState(profile?.profile_type || "solteiro");

  const handleSave = async () => {
    await updateProfile({ display_name: name, profile_type: profileType });
    toast.success("Perfil atualizado!");
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Configurações</h1>
        <p className="text-sm text-muted-foreground">Personalize sua experiência no OrganizaPay</p>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Perfil</h3>
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
              <option value="empreendedor">Pequeno Empreendedor</option>
              <option value="casal">Casal</option>
            </select>
          </div>
          <Button variant="default" size="sm" onClick={handleSave}>Salvar alterações</Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Notificações</h3>
        </div>
        <div className="space-y-4">
          {[
            { label: "Alertas de gastos acima do limite", defaultOn: true },
            { label: "Resumo semanal por email", defaultOn: false },
            { label: "Lembrete de metas próximas ao prazo", defaultOn: true },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between">
              <span className="text-sm">{item.label}</span>
              <Switch defaultChecked={item.defaultOn} />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Palette className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Aparência</h3>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">Modo escuro</span>
          <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Segurança</h3>
        </div>
        <div className="space-y-3">
          <Button variant="outline" size="sm">Alterar senha</Button>
        </div>
      </motion.div>
    </div>
  );
};

export default ConfigPage;
