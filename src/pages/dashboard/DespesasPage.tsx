import { ArrowDownCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const despesas = [
  { id: 1, description: "Aluguel", amount: 1500, date: "05/02/2026", category: "Moradia" },
  { id: 2, description: "Supermercado", amount: 680, date: "12/02/2026", category: "Alimentação" },
  { id: 3, description: "Uber / 99", amount: 320, date: "14/02/2026", category: "Transporte" },
  { id: 4, description: "Academia", amount: 150, date: "01/02/2026", category: "Saúde" },
  { id: 5, description: "Streaming", amount: 55, date: "08/02/2026", category: "Lazer" },
  { id: 6, description: "Internet", amount: 120, date: "10/02/2026", category: "Moradia" },
];

const categoryColors: Record<string, string> = {
  Moradia: "bg-[hsl(280_60%_55%)]/10 text-[hsl(280_60%_55%)]",
  Alimentação: "bg-[hsl(35_95%_55%)]/10 text-[hsl(35_95%_55%)]",
  Transporte: "bg-[hsl(210_70%_55%)]/10 text-[hsl(210_70%_55%)]",
  Saúde: "bg-[hsl(160_45%_50%)]/10 text-[hsl(160_45%_50%)]",
  Lazer: "bg-[hsl(330_70%_55%)]/10 text-[hsl(330_70%_55%)]",
};

const DespesasPage = () => {
  const total = despesas.reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Despesas</h1>
          <p className="text-sm text-muted-foreground">Controle suas saídas por categoria</p>
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova despesa
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-5 border border-border shadow-card"
      >
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
            <ArrowDownCircle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total de despesas em Fev</p>
            <p className="font-display font-bold text-2xl text-destructive">
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
        {despesas.map((d, i) => (
          <motion.div
            key={d.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium">{d.description}</span>
            <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${categoryColors[d.category] || "bg-muted text-muted-foreground"}`}>
              {d.category}
            </span>
            <span className="text-sm text-muted-foreground">{d.date}</span>
            <span className="text-sm font-semibold text-destructive text-right">
              -R$ {d.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default DespesasPage;
