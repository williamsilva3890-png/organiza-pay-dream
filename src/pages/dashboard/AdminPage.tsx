import { useState, useEffect } from "react";
import { Users, Lightbulb, Trash2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Suggestion {
  id: string;
  user_email: string | null;
  user_name: string | null;
  category: string;
  message: string;
  status: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-500" },
  analisando: { label: "Analisando", icon: AlertCircle, color: "text-blue-500" },
  concluido: { label: "Concluído", icon: CheckCircle, color: "text-green-500" },
};

const AdminPage = () => {
  const [clientCount, setClientCount] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);

    // Count all profiles (clients)
    const { count: profileCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Count premium subscriptions
    const { count: premCount } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "premium");

    // Fetch all suggestions
    const { data: suggestionsData } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    setClientCount(profileCount || 0);
    setPremiumCount(premCount || 0);
    setSuggestions((suggestionsData as Suggestion[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("suggestions")
      .update({ status: newStatus } as any)
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar status");
      return;
    }
    toast.success("Status atualizado!");
    fetchData();
  };

  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao deletar");
      return;
    }
    toast.success("Sugestão removida!");
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando dados admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Visão geral do OrganizaPay</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{clientCount}</p>
              <p className="text-xs text-muted-foreground">Total de Clientes</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10">
              <Users className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-2xl font-bold">{premiumCount}</p>
              <p className="text-xs text-muted-foreground">Clientes Premium</p>
            </div>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10">
              <Lightbulb className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{suggestions.length}</p>
              <p className="text-xs text-muted-foreground">Sugestões Recebidas</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Suggestions list */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
        className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Sugestões dos Usuários</h3>
        </div>

        {suggestions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhuma sugestão recebida ainda.</p>
        ) : (
          <div className="space-y-3">
            {suggestions.map((s) => {
              const statusInfo = STATUS_MAP[s.status] || STATUS_MAP.pendente;
              const StatusIcon = statusInfo.icon;
              return (
                <div key={s.id} className="border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold">{s.user_name || "Anônimo"}</span>
                        <span className="text-xs text-muted-foreground">{s.user_email}</span>
                        <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">{s.category}</span>
                      </div>
                      <p className="text-sm mt-1">{s.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">
                        {new Date(s.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                      <span className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 pt-1 border-t border-border">
                    {s.status !== "analisando" && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(s.id, "analisando")}>
                        Analisando
                      </Button>
                    )}
                    {s.status !== "concluido" && (
                      <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(s.id, "concluido")}>
                        Concluído
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive ml-auto" onClick={() => deleteSuggestion(s.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default AdminPage;
