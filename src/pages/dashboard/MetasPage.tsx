import { useState } from "react";
import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Goal {
  id: number;
  title: string;
  current: number;
  target: number;
  deadline: string;
  description: string;
}

const initialGoals: Goal[] = [
  { id: 1, title: "Reserva de emergência", current: 8500, target: 15000, deadline: "Dez 2026", description: "6 meses de despesas guardadas" },
  { id: 2, title: "Viagem de férias", current: 2200, target: 5000, deadline: "Jul 2026", description: "Viagem em família para o litoral" },
  { id: 3, title: "Novo equipamento", current: 1800, target: 3000, deadline: "Abr 2026", description: "Notebook para trabalho" },
];

const MetasPage = () => {
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", target: "", deadline: "", description: "" });

  const handleAdd = () => {
    if (!form.title || !form.target || !form.deadline) return;
    setGoals([...goals, {
      id: Date.now(),
      title: form.title,
      current: 0,
      target: parseFloat(form.target),
      deadline: form.deadline,
      description: form.description,
    }]);
    setForm({ title: "", target: "", deadline: "", description: "" });
    setOpen(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Metas financeiras</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso das suas metas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2">
              <Plus className="w-4 h-4" />
              Nova meta
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta financeira</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-1 block">Título</label>
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Ex: Reserva de emergência" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Valor alvo (R$)</label>
                <input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className={inputClass} placeholder="0,00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Prazo</label>
                <input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} placeholder="Ex: Dez 2026" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Descrição</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Ex: Guardar para emergências" />
              </div>
              <Button onClick={handleAdd} className="w-full">Criar meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {goals.map((goal, i) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">{goal.deadline}</span>
              </div>
              <h3 className="font-display font-bold text-base mb-1">{goal.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{goal.description}</p>
              <Progress value={pct} className="h-2.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>R$ {goal.current.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                <span className="font-semibold text-foreground">{pct}%</span>
                <span>R$ {goal.target.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MetasPage;
