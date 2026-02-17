import { useState } from "react";
import { ArrowDownCircle, Plus, CreditCard, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { useFinanceData } from "@/hooks/useFinanceData";

const categoryColors: Record<string, string> = {
  Moradia: "bg-[hsl(280_60%_55%)]/10 text-[hsl(280_60%_55%)]",
  Alimentação: "bg-[hsl(35_95%_55%)]/10 text-[hsl(35_95%_55%)]",
  Transporte: "bg-[hsl(210_70%_55%)]/10 text-[hsl(210_70%_55%)]",
  Saúde: "bg-[hsl(160_45%_50%)]/10 text-[hsl(160_45%_50%)]",
  Lazer: "bg-[hsl(330_70%_55%)]/10 text-[hsl(330_70%_55%)]",
  Dívida: "bg-destructive/10 text-destructive",
};

const expenseCategories = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Outros"];

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const DespesasPage = ({ finance }: Props) => {
  const { gastos, dividas, totalGastos, totalDividas, totalDespesas, addDespesa } = finance;
  const [openGasto, setOpenGasto] = useState(false);
  const [openDivida, setOpenDivida] = useState(false);
  const [formGasto, setFormGasto] = useState({ description: "", amount: "", date: "", category: "Moradia" });
  const [formDivida, setFormDivida] = useState({ description: "", amount: "", date: "", details: "" });

  const handleAddGasto = async () => {
    if (!formGasto.description || !formGasto.amount || !formGasto.date) return;
    await addDespesa({ description: formGasto.description, amount: parseFloat(formGasto.amount), date: formGasto.date, category: formGasto.category, type: "gasto" });
    setFormGasto({ description: "", amount: "", date: "", category: "Moradia" });
    setOpenGasto(false);
  };

  const handleAddDivida = async () => {
    if (!formDivida.description || !formDivida.amount || !formDivida.date) return;
    await addDespesa({ description: formDivida.description, amount: parseFloat(formDivida.amount), date: formDivida.date, category: "Dívida", type: "divida", details: formDivida.details });
    setFormDivida({ description: "", amount: "", date: "", details: "" });
    setOpenDivida(false);
  };

  const inputClass = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Despesas</h1>
          <p className="text-sm text-muted-foreground">Controle suas saídas por categoria</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={openGasto} onOpenChange={setOpenGasto}>
            <DialogTrigger asChild><Button variant="default" className="gap-2"><Plus className="w-4 h-4" />Novo gasto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo gasto</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><label className="text-sm font-medium mb-1 block">Com o que está gastando?</label><input value={formGasto.description} onChange={(e) => setFormGasto({ ...formGasto, description: e.target.value })} className={inputClass} placeholder="Ex: Conta de luz" /></div>
                <div><label className="text-sm font-medium mb-1 block">Valor (R$)</label><input type="number" value={formGasto.amount} onChange={(e) => setFormGasto({ ...formGasto, amount: e.target.value })} className={inputClass} placeholder="0,00" /></div>
                <div><label className="text-sm font-medium mb-1 block">Data</label><input type="date" value={formGasto.date} onChange={(e) => setFormGasto({ ...formGasto, date: e.target.value })} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1 block">Categoria</label><select value={formGasto.category} onChange={(e) => setFormGasto({ ...formGasto, category: e.target.value })} className={inputClass}>{expenseCategories.map((c) => <option key={c}>{c}</option>)}</select></div>
                <Button onClick={handleAddGasto} className="w-full">Adicionar gasto</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openDivida} onOpenChange={setOpenDivida}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2"><CreditCard className="w-4 h-4" />Nova dívida</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova dívida</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><label className="text-sm font-medium mb-1 block">Descrição da dívida</label><input value={formDivida.description} onChange={(e) => setFormDivida({ ...formDivida, description: e.target.value })} className={inputClass} placeholder="Ex: Financiamento do carro" /></div>
                <div><label className="text-sm font-medium mb-1 block">Valor da parcela (R$)</label><input type="number" value={formDivida.amount} onChange={(e) => setFormDivida({ ...formDivida, amount: e.target.value })} className={inputClass} placeholder="0,00" /></div>
                <div><label className="text-sm font-medium mb-1 block">Data de vencimento</label><input type="date" value={formDivida.date} onChange={(e) => setFormDivida({ ...formDivida, date: e.target.value })} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1 block">Detalhes (parcelas, etc.)</label><input value={formDivida.details} onChange={(e) => setFormDivida({ ...formDivida, details: e.target.value })} className={inputClass} placeholder="Ex: Parcela 3/12" /></div>
                <Button onClick={handleAddDivida} className="w-full">Adicionar dívida</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><ArrowDownCircle className="w-5 h-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Total geral</p><p className="font-display font-bold text-xl text-destructive">{fmt(totalDespesas)}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Gastos</p><p className="font-display font-bold text-xl">{fmt(totalGastos)}</p></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-destructive" /></div>
            <div><p className="text-sm text-muted-foreground">Dívidas</p><p className="font-display font-bold text-xl text-destructive">{fmt(totalDividas)}</p></div>
          </div>
        </motion.div>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-warning" /> Gastos</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Descrição</span><span>Categoria</span><span>Data</span><span className="text-right">Valor</span>
          </div>
          {gastos.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum gasto cadastrado</div>}
          {gastos.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium">{d.description}</span>
              <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${categoryColors[d.category] || "bg-muted text-muted-foreground"}`}>{d.category}</span>
              <span className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR")}</span>
              <span className="text-sm font-semibold text-destructive text-right">-{fmt(Number(d.amount))}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-destructive" /> Dívidas</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Descrição</span><span>Detalhes</span><span>Vencimento</span><span className="text-right">Valor</span>
          </div>
          {dividas.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma dívida cadastrada</div>}
          {dividas.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors">
              <span className="text-sm font-medium">{d.description}</span>
              <span className="text-xs bg-destructive/10 text-destructive rounded-full px-2.5 py-1 font-medium">{d.details || "—"}</span>
              <span className="text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR")}</span>
              <span className="text-sm font-semibold text-destructive text-right">-{fmt(Number(d.amount))}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DespesasPage;
