import { useState, useEffect } from "react";
import { Users, Lightbulb, Trash2, CheckCircle, Clock, AlertCircle, Send, MessageSquare, Calendar, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Suggestion {
  id: string;
  user_email: string | null;
  user_name: string | null;
  category: string;
  message: string;
  status: string;
  created_at: string;
  admin_reply: string | null;
  replied_at: string | null;
}

interface SubscriberInfo {
  user_id: string;
  plan: string;
  expires_at: string | null;
  display_name: string | null;
  user_email?: string;
}

interface AdminMessage {
  id: string;
  title: string;
  message: string;
  created_at: string;
}

const STATUS_MAP: Record<string, { label: string; icon: typeof Clock; color: string }> = {
  pendente: { label: "Pendente", icon: Clock, color: "text-amber-500" },
  analisando: { label: "Analisando", icon: AlertCircle, color: "text-blue-500" },
  concluido: { label: "Concluído", icon: CheckCircle, color: "text-green-500" },
};

const AdminPage = () => {
  const { user } = useAuth();
  const [clientCount, setClientCount] = useState(0);
  const [premiumCount, setPremiumCount] = useState(0);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberInfo[]>([]);
  const [adminMessages, setAdminMessages] = useState<AdminMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [msgTitle, setMsgTitle] = useState("");
  const [msgBody, setMsgBody] = useState("");
  const [sending, setSending] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "subscribers" | "messages">("overview");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchData = async () => {
    setLoading(true);

    const { count: profileCount } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    const { count: premCount } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("plan", "premium");

    const { data: suggestionsData } = await supabase
      .from("suggestions")
      .select("*")
      .order("created_at", { ascending: false });

    // Fetch premium subscribers with profile info
    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("user_id, plan, expires_at")
      .eq("plan", "premium");

    let subscriberList: SubscriberInfo[] = [];
    if (subsData && subsData.length > 0) {
      const userIds = subsData.map(s => s.user_id);
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);

      subscriberList = subsData.map(s => {
        const prof = profilesData?.find(p => p.user_id === s.user_id);
        return {
          user_id: s.user_id,
          plan: s.plan,
          expires_at: (s as any).expires_at || null,
          display_name: prof?.display_name || "Sem nome",
        };
      });
    }

    // Fetch admin messages
    const { data: messagesData } = await supabase
      .from("admin_messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    setClientCount(profileCount || 0);
    setPremiumCount(premCount || 0);
    setSuggestions((suggestionsData as Suggestion[]) || []);
    setSubscribers(subscriberList);
    setAdminMessages((messagesData as AdminMessage[]) || []);
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
    if (error) { toast.error("Erro ao atualizar status"); return; }
    toast.success("Status atualizado!");
    fetchData();
  };

  const deleteSuggestion = async (id: string) => {
    const { error } = await supabase.from("suggestions").delete().eq("id", id);
    if (error) { toast.error("Erro ao deletar"); return; }
    toast.success("Sugestão removida!");
    fetchData();
  };

  const sendReply = async (id: string) => {
    if (!replyText.trim()) return;
    const { error } = await supabase
      .from("suggestions")
      .update({ admin_reply: replyText.trim(), replied_at: new Date().toISOString() } as any)
      .eq("id", id);
    if (error) { toast.error("Erro ao enviar resposta"); return; }
    toast.success("Resposta enviada ao cliente! ✉️");
    setReplyingTo(null);
    setReplyText("");
    fetchData();
  };

  const updateExpiresAt = async (userId: string, date: string) => {
    const { error } = await supabase
      .from("subscriptions")
      .update({ expires_at: date } as any)
      .eq("user_id", userId);
    if (error) { toast.error("Erro ao atualizar data"); return; }
    toast.success("Data de vencimento atualizada!");
    fetchData();
  };

  const sendBroadcast = async () => {
    if (!msgTitle.trim() || !msgBody.trim() || !user) return;
    setSending(true);
    const { error } = await supabase.from("admin_messages").insert({
      title: msgTitle.trim(),
      message: msgBody.trim(),
      created_by: user.id,
    } as any);
    if (error) { toast.error("Erro ao enviar mensagem"); setSending(false); return; }
    toast.success("Mensagem enviada para todos os usuários!");
    setMsgTitle("");
    setMsgBody("");
    setSending(false);
    fetchData();
  };

  const deleteMessage = async (id: string) => {
    await supabase.from("admin_messages").delete().eq("id", id);
    toast.success("Mensagem removida!");
    fetchData();
  };

  const getExpirationStatus = (expiresAt: string | null) => {
    if (!expiresAt) return { label: "Sem data", color: "text-muted-foreground", bg: "bg-muted" };
    const now = new Date();
    const exp = new Date(expiresAt);
    const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diff < 0) return { label: "Vencido", color: "text-destructive", bg: "bg-destructive/10" };
    if (diff <= 3) return { label: `Vence em ${diff}d`, color: "text-amber-500", bg: "bg-amber-500/10" };
    return { label: "Ativo", color: "text-success", bg: "bg-success/10" };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Carregando dados admin...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="font-display font-bold text-2xl">Painel Administrativo</h1>
        <p className="text-sm text-muted-foreground">Visão geral do OrganizaPay</p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Users className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{clientCount}</p><p className="text-xs text-muted-foreground">Total de Clientes</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/10"><Crown className="w-5 h-5 text-amber-500" /></div>
            <div><p className="text-2xl font-bold">{premiumCount}</p><p className="text-xs text-muted-foreground">Clientes Premium</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-primary/10"><Lightbulb className="w-5 h-5 text-primary" /></div>
            <div><p className="text-2xl font-bold">{suggestions.length}</p><p className="text-xs text-muted-foreground">Sugestões</p></div>
          </div>
        </motion.div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-2">
        {[
          { key: "overview" as const, label: "Sugestões", icon: Lightbulb },
          { key: "subscribers" as const, label: "Assinantes", icon: Crown },
          { key: "messages" as const, label: "Mensagens", icon: MessageSquare },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Suggestions tab */}
      {activeTab === "overview" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
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

                    {/* Admin reply display */}
                    {s.admin_reply && (
                      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 ml-4">
                        <div className="flex items-center gap-1.5 mb-1">
                          <MessageSquare className="w-3 h-3 text-primary" />
                          <span className="text-[11px] font-semibold text-primary">Resposta do Admin</span>
                          {s.replied_at && (
                            <span className="text-[10px] text-muted-foreground ml-auto">
                              {new Date(s.replied_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          )}
                        </div>
                        <p className="text-sm">{s.admin_reply}</p>
                      </div>
                    )}

                    {/* Reply input */}
                    {replyingTo === s.id && (
                      <div className="flex gap-2 ml-4">
                        <Textarea
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="Escreva sua resposta ao cliente..."
                          className="min-h-[60px] text-sm flex-1"
                        />
                        <div className="flex flex-col gap-1">
                          <Button size="sm" className="text-xs h-7" onClick={() => sendReply(s.id)} disabled={!replyText.trim()}>
                            <Send className="w-3 h-3 mr-1" /> Enviar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => { setReplyingTo(null); setReplyText(""); }}>
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-border">
                      {s.status !== "analisando" && (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(s.id, "analisando")}>Analisando</Button>
                      )}
                      {s.status !== "concluido" && (
                        <Button variant="outline" size="sm" className="text-xs h-7" onClick={() => updateStatus(s.id, "concluido")}>Concluído</Button>
                      )}
                      {replyingTo !== s.id && (
                        <Button variant="outline" size="sm" className="text-xs h-7 gap-1" onClick={() => { setReplyingTo(s.id); setReplyText(s.admin_reply || ""); }}>
                          <MessageSquare className="w-3 h-3" /> {s.admin_reply ? "Editar resposta" : "Responder"}
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
      )}

      {/* Subscribers tab */}
      {activeTab === "subscribers" && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Crown className="w-5 h-5 text-amber-500" />
            <h3 className="font-display font-bold text-base">Assinantes Premium</h3>
          </div>
          {subscribers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhum assinante premium.</p>
          ) : (
            <div className="space-y-3">
              {subscribers.map((sub) => {
                const status = getExpirationStatus(sub.expires_at);
                return (
                  <div key={sub.user_id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{sub.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{sub.user_id.slice(0, 8)}...</p>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.bg} ${status.color}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Calendar className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium">
                        {sub.expires_at
                          ? `Vence: ${new Date(sub.expires_at).toLocaleDateString("pt-BR")}`
                          : "Sem data de vencimento definida"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      )}

      {/* Messages tab */}
      {activeTab === "messages" && (
        <div className="space-y-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-primary" />
              <h3 className="font-display font-bold text-base">Enviar Mensagem para Todos</h3>
            </div>
            <div className="space-y-3">
              <Input placeholder="Título da mensagem" value={msgTitle} onChange={e => setMsgTitle(e.target.value)} />
              <Textarea placeholder="Escreva sua mensagem aqui..." value={msgBody} onChange={e => setMsgBody(e.target.value)} rows={3} />
              <Button onClick={sendBroadcast} disabled={sending || !msgTitle.trim() || !msgBody.trim()} className="w-full sm:w-auto">
                <Send className="w-4 h-4 mr-2" />
                {sending ? "Enviando..." : "Enviar para todos"}
              </Button>
            </div>
          </motion.div>

          {adminMessages.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card">
              <h3 className="font-display font-bold text-base mb-4">Mensagens Enviadas</h3>
              <div className="space-y-3">
                {adminMessages.map(msg => (
                  <div key={msg.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{msg.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">{msg.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-2">
                          {new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0" onClick={() => deleteMessage(msg.id)}>
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminPage;
