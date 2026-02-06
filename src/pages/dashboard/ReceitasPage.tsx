import { ArrowUpCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const receitas = [
  { id: 1, description: "Salário", amount: 5500, date: "01/02/2026", category: "Salário" },
  { id: 2, description: "Freelance Design", amount: 2700, date: "10/02/2026", category: "Freelance" },
  { id: 3, description: "Venda produto", amount: 1200, date: "15/02/2026", category: "Vendas" },
  { id: 4, description: "Consultoria", amount: 800, date: "18/02/2026", category: "Serviços" },
];

const ReceitasPage = () => {
  const total = receitas.reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Receitas</h1>
          <p className="text-sm text-muted-foreground">Gerencie todas as suas entradas</p>
        </div>
        <Button variant="default" className="gap-2">
          <Plus className="w-4 h-4" />
          Nova receita
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-5 border border-border shadow-card"
      >
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
          <motion.div
            key={r.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.05 }}
            className="grid grid-cols-[1fr_auto_auto_auto] gap-4 px-5 py-3.5 border-t border-border items-center hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-medium">{r.description}</span>
            <span className="text-xs bg-success/10 text-success rounded-full px-2.5 py-1 font-medium">
              {r.category}
            </span>
            <span className="text-sm text-muted-foreground">{r.date}</span>
            <span className="text-sm font-semibold text-success text-right">
              +R$ {r.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </span>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ReceitasPage;
