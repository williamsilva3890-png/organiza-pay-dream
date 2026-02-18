import { useState } from "react";
import { Target, Plus, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFinanceData, FREE_LIMITS } from "@/hooks/useFinanceData";

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const MetasPage = ({ finance }: Props) => {
  const { metas, addMeta, canAddMeta, isPremium } = finance;
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", target: "", deadline: "", description: "" });

  const handleAdd = async () => {
    if (!canAddMeta) {
      toast.error(`Limite do plano gratuito atingido (${FREE_LIMITS.metas} metas). Faça upgrade para Premium!`);
      return;
    }
    if (!form.title || !form.target || !form.deadline) return;
    await addMeta({
      title: form.title,
      current_amount: 0,
      target_amount: parseFloat(form.target),
      deadline: form.deadline,
      description: form.description,
    });
    setForm({ title: "", target: "", deadline: "", description: "" });
    setOpen(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Metas financeiras</h1>
          <p className="text-sm text-muted-foreground">Acompanhe o progresso das suas metas</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="default" className="gap-2"><Plus className="w-4 h-4" />Nova meta</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Nova meta financeira</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-1 block">Título</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} placeholder="Ex: Reserva de emergência" /></div>
              <div><label className="text-sm font-medium mb-1 block">Valor alvo (R$)</label><input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: e.target.value })} className={inputClass} placeholder="0,00" /></div>
              <div><label className="text-sm font-medium mb-1 block">Prazo</label><input value={form.deadline} onChange={(e) => setForm({ ...form, deadline: e.target.value })} className={inputClass} placeholder="Ex: Dez 2026" /></div>
              <div><label className="text-sm font-medium mb-1 block">Descrição</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputClass} placeholder="Ex: Guardar para emergências" /></div>
              <Button onClick={handleAdd} className="w-full">Criar meta</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {!isPremium && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Plano gratuito: {metas.length}/{FREE_LIMITS.metas} metas usadas</span>
        </div>
      )}

      {metas.length === 0 && (
        <div className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
          <p className="text-muted-foreground">Nenhuma meta cadastrada. Crie sua primeira meta!</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {metas.map((goal, i) => {
          const pct = goal.target_amount > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
          return (
            <motion.div key={goal.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Target className="w-5 h-5 text-primary" /></div>
                <span className="text-xs text-muted-foreground bg-muted rounded-full px-2.5 py-1">{goal.deadline}</span>
              </div>
              <h3 className="font-display font-bold text-base mb-1">{goal.title}</h3>
              <p className="text-xs text-muted-foreground mb-4">{goal.description}</p>
              <Progress value={pct} className="h-2.5 mb-2" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{fmt(Number(goal.current_amount))}</span>
                <span className="font-semibold text-foreground">{pct}%</span>
                <span>{fmt(Number(goal.target_amount))}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default MetasPage;
