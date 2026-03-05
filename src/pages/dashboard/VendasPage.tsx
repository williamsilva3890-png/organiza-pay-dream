import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ShoppingBag, Trash2, CheckCircle2, Clock, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Venda {
  id: string;
  description: string;
  amount: number;
  date: string;
  status: string;
  client_id: string | null;
}

interface Cliente { id: string; name: string; }

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const VendasPage = ({ isPremium }: { isPremium: boolean }) => {
  const { user } = useAuth();
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), client_id: "", status: "pendente" });
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    if (!user) return;
    const [v, c] = await Promise.all([
      supabase.from("vendas").select("*").eq("user_id", user.id).order("date", { ascending: false }),
      supabase.from("clientes").select("id, name").eq("user_id", user.id),
    ]);
    if (v.data) setVendas(v.data as any);
    if (c.data) setClientes(c.data as any);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.description.trim() || !form.amount) return;
    await supabase.from("vendas").insert({
      user_id: user.id, description: form.description, amount: parseFloat(form.amount),
      date: form.date, client_id: form.client_id || null, status: form.status,
    } as any);
    toast.success("Venda registrada!");
    setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), client_id: "", status: "pendente" });
    setOpen(false);
    fetch();
  };

  const toggleStatus = async (id: string, current: string) => {
    const next = current === "pendente" ? "pago" : "pendente";
    await supabase.from("vendas").update({ status: next } as any).eq("id", id);
    setVendas(prev => prev.map(v => v.id === id ? { ...v, status: next } : v));
  };

  const handleDelete = async (id: string) => {
    await supabase.from("vendas").delete().eq("id", id);
    setVendas(prev => prev.filter(v => v.id !== id));
    toast.success("Venda removida!");
  };

  const totalVendas = vendas.reduce((s, v) => s + Number(v.amount), 0);
  const totalPago = vendas.filter(v => v.status === "pago").reduce((s, v) => s + Number(v.amount), 0);
  const totalPendente = totalVendas - totalPago;

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ShoppingBag className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">Controle de Vendas</h2>
        <p className="text-muted-foreground text-sm">Recurso exclusivo para assinantes Premium.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <ShoppingBag className="w-6 h-6 text-primary" /> Vendas
        </h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Venda</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Registrar Venda</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Descrição *" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
              <Input type="number" placeholder="Valor *" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
              <Input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
              {clientes.length > 0 && (
                <Select value={form.client_id} onValueChange={v => setForm(p => ({ ...p, client_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Cliente (opcional)" /></SelectTrigger>
                  <SelectContent>
                    {clientes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Button onClick={handleSave} className="w-full">Registrar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Vendas", value: totalVendas, icon: ShoppingBag, color: "text-primary", bg: "bg-primary/10" },
          { label: "Recebido", value: totalPago, icon: CheckCircle2, color: "text-success", bg: "bg-success/10" },
          { label: "Pendente", value: totalPendente, icon: Clock, color: "text-warning", bg: "bg-warning/10" },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className="font-display font-bold text-xl">{fmt(c.value)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : vendas.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhuma venda registrada.</p>
      ) : (
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="divide-y divide-border">
            {vendas.map((v, i) => {
              const client = clientes.find(c => c.id === v.client_id);
              return (
                <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 p-4 hover:bg-accent/30 transition-colors">
                  <button onClick={() => toggleStatus(v.id, v.status)}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${v.status === "pago" ? "bg-success/10" : "bg-warning/10"}`}>
                    {v.status === "pago" ? <CheckCircle2 className="w-4 h-4 text-success" /> : <Clock className="w-4 h-4 text-warning" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{v.description}</p>
                    <p className="text-xs text-muted-foreground">{client?.name || "—"} · {new Date(v.date).toLocaleDateString("pt-BR")}</p>
                  </div>
                  <p className="text-sm font-bold">{fmt(Number(v.amount))}</p>
                  <button onClick={() => handleDelete(v.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendasPage;
