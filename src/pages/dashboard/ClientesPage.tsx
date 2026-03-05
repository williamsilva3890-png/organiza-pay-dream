import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Search, Trash2, Edit2, Users, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

interface Cliente {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  created_at: string;
}

const ClientesPage = ({ isPremium }: { isPremium: boolean }) => {
  const { user } = useAuth();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", notes: "" });
  const [loading, setLoading] = useState(true);

  const fetchClientes = async () => {
    if (!user) return;
    const { data } = await supabase.from("clientes").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setClientes(data as any);
    setLoading(false);
  };

  useEffect(() => { fetchClientes(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.name.trim()) return;
    if (editId) {
      await supabase.from("clientes").update({ name: form.name, email: form.email || null, phone: form.phone || null, notes: form.notes || null } as any).eq("id", editId);
      toast.success("Cliente atualizado!");
    } else {
      await supabase.from("clientes").insert({ user_id: user.id, name: form.name, email: form.email || null, phone: form.phone || null, notes: form.notes || null } as any);
      toast.success("Cliente adicionado!");
    }
    setForm({ name: "", email: "", phone: "", notes: "" });
    setEditId(null);
    setOpen(false);
    fetchClientes();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("clientes").delete().eq("id", id);
    setClientes(prev => prev.filter(c => c.id !== id));
    toast.success("Cliente removido!");
  };

  const handleEdit = (c: Cliente) => {
    setEditId(c.id);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", notes: c.notes || "" });
    setOpen(true);
  };

  const filtered = clientes.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">Controle de Clientes</h2>
        <p className="text-muted-foreground text-sm">Recurso exclusivo para assinantes Premium.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="font-display font-bold text-2xl flex items-center gap-2">
          <Users className="w-6 h-6 text-primary" /> Clientes
        </h1>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditId(null); setForm({ name: "", email: "", phone: "", notes: "" }); } }}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editId ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
            <div className="space-y-3 mt-2">
              <Input placeholder="Nome *" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
              <Input placeholder="Email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              <Input placeholder="Telefone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
              <Input placeholder="Notas" value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
              <Button onClick={handleSave} className="w-full">{editId ? "Salvar" : "Adicionar"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-8">Carregando...</p>
      ) : filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">Nenhum cliente encontrado.</p>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <span className="font-bold text-primary text-sm">{c.name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleEdit(c)} className="p-1.5 rounded-lg hover:bg-accent transition-colors"><Edit2 className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-sm mb-2">{c.name}</h3>
              {c.email && <p className="text-xs text-muted-foreground flex items-center gap-1.5"><Mail className="w-3 h-3" />{c.email}</p>}
              {c.phone && <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1"><Phone className="w-3 h-3" />{c.phone}</p>}
              {c.notes && <p className="text-xs text-muted-foreground mt-2 italic">{c.notes}</p>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClientesPage;
