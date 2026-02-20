import { useState } from "react";
import { ArrowUpCircle, Plus, Lock, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFinanceData, FREE_LIMITS } from "@/hooks/useFinanceData";

const categories = ["Salário", "Freelance", "Vendas", "Serviços", "Investimentos", "Outros"];

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const ReceitasPage = ({ finance }: Props) => {
  const { receitas, totalReceitas, addReceita, updateReceita, deleteReceita, canAddReceita, isPremium } = finance;
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", date: "", category: "Salário" });

  const handleAdd = async () => {
    if (!canAddReceita) {
      toast.error(`Limite do plano gratuito atingido (${FREE_LIMITS.receitas} receitas). Faça upgrade para Premium!`);
      return;
    }
    if (!form.description || !form.amount || !form.date) return;
    await addReceita({ description: form.description, amount: parseFloat(form.amount), date: form.date, category: form.category });
    setForm({ description: "", amount: "", date: "", category: "Salário" });
    setOpen(false);
  };

  const startEdit = (r: any) => {
    setEditId(r.id);
    setForm({ description: r.description, amount: String(r.amount), date: r.date, category: r.category });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId || !form.description || !form.amount || !form.date) return;
    await updateReceita(editId, { description: form.description, amount: parseFloat(form.amount), date: form.date, category: form.category });
    setForm({ description: "", amount: "", date: "", category: "Salário" });
    setEditOpen(false);
    setEditId(null);
    toast.success("Receita atualizada!");
  };

  const handleDelete = async (id: string) => {
    await deleteReceita(id);
    toast.success("Receita removida!");
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const FormFields = ({ onSubmit, label }: { onSubmit: () => void; label: string }) => (
    <div className="space-y-4 pt-2">
      <div><label className="text-sm font-medium mb-1 block">Descrição</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Ex: Salário mensal" /></div>
      <div><label className="text-sm font-medium mb-1 block">Valor (R$)</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputClass} placeholder="0,00" /></div>
      <div><label className="text-sm font-medium mb-1 block">Data</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputClass} /></div>
      <div><label className="text-sm font-medium mb-1 block">Categoria</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={inputClass}>{categories.map((c) => <option key={c}>{c}</option>)}</select></div>
      <Button onClick={onSubmit} className="w-full">{label}</Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Receitas</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as suas entradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button variant="default" className="gap-2"><Plus className="w-4 h-4" />Nova receita</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova receita</DialogTitle></DialogHeader>
            <FormFields onSubmit={handleAdd} label="Adicionar receita" />
          </DialogContent>
        </Dialog>
      </div>

      {!isPremium && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Plano gratuito: {receitas.length}/{FREE_LIMITS.receitas} rendas usadas</span>
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center"><ArrowUpCircle className="w-5 h-5 text-success" /></div>
          <div><p className="text-sm text-muted-foreground">Total de renda</p><p className="font-display font-bold text-2xl text-success">{fmt(totalReceitas)}</p></div>
        </div>
      </motion.div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Descrição</span><span>Categoria</span><span>Data</span><span className="text-right">Valor</span><span></span>
        </div>
        {receitas.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma receita cadastrada. Adicione sua primeira!</div>}
        {receitas.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium">{r.description}</span>
            <span className="text-xs bg-success/10 text-success rounded-full px-2.5 py-1 font-medium">{r.category}</span>
            <span className="text-sm text-muted-foreground">{new Date(r.date).toLocaleDateString("pt-BR")}</span>
            <span className="text-sm font-semibold text-success text-right">+{fmt(Number(r.amount))}</span>
            <div className="flex gap-1">
              <button onClick={() => startEdit(r)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
              <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
            </div>
          </motion.div>
        ))}
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar receita</DialogTitle></DialogHeader>
          <FormFields onSubmit={handleEdit} label="Salvar alterações" />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ReceitasPage;
