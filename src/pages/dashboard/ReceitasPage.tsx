import { useState } from "react";
import { ArrowUpCircle, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Receita {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
}

const initialReceitas: Receita[] = [
  { id: 1, description: "Salário", amount: 5500, date: "01/02/2026", category: "Salário" },
  { id: 2, description: "Freelance Design", amount: 2700, date: "10/02/2026", category: "Freelance" },
  { id: 3, description: "Venda produto", amount: 1200, date: "15/02/2026", category: "Vendas" },
  { id: 4, description: "Consultoria", amount: 800, date: "18/02/2026", category: "Serviços" },
];

const categories = ["Salário", "Freelance", "Vendas", "Serviços", "Investimentos", "Outros"];

const ReceitasPage = () => {
  const [receitas, setReceitas] = useState<Receita[]>(initialReceitas);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", date: "", category: "Salário" });

  const total = receitas.reduce((sum, r) => sum + r.amount, 0);

  const handleAdd = () => {
    if (!form.description || !form.amount || !form.date) return;
    const newReceita: Receita = {
      id: Date.now(),
      description: form.description,
      amount: parseFloat(form.amount),
      date: form.date,
      category: form.category,
    };
    setReceitas([newReceita, ...receitas]);
    setForm({ description: "", amount: "", date: "", category: "Salário" });
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Receitas</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as suas entradas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova receita
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nova receita</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="Ex: Salário mensal" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valor (R$)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Data</label>
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Categoria</label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
                  {categories.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <Button onClick={handleAdd} className="w-full">Adicionar receita</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
            <ArrowUpCircle className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de receitas em Fev</p>
            <p className="font-display font-bold text-2xl text-success">
              R$ {total.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </motion.div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          <span>Descrição</span>
          <span>Categoria</span>
          <span>Data</span>
          <span className="text-right">Valor</span>
        </div>
        {receitas.map((r, i) => (
          <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors">
            <span className="text-sm font-medium">{r.description}</span>
            <span className="text-xs bg-success/10 text-success rounded-full px-2.5 py-1 font-medium">{r.category}</span>
            <span className="text-sm text-muted-foreground">{r.date}</span>
            <span className="text-sm font-semibold text-success text-right">+R$ {r.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReceitasPage;
