import { FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import IncomeExpenseBarChart from "@/components/dashboard/IncomeExpenseBarChart";
import ExpensePieChart from "@/components/dashboard/ExpensePieChart";

const RelatoriosPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visualize e exporte seus relatórios financeiros</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid sm:grid-cols-3 gap-4"
      >
        {[
          { label: "Receitas totais", value: "R$ 8.200,00", color: "text-success" },
          { label: "Despesas totais", value: "R$ 4.750,00", color: "text-destructive" },
          { label: "Economia do mês", value: "R$ 3.450,00", color: "text-primary" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-card rounded-xl p-5 border border-border shadow-card text-center"
          >
            <p className="text-sm text-muted-foreground mb-1">{item.label}</p>
            <p className={`font-display font-bold text-2xl ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <IncomeExpenseBarChart />
        <ExpensePieChart />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-6 border border-border shadow-card"
      >
        <div className="flex items-center gap-2 mb-4">
          <FileBarChart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Resumo mensal</h3>
        </div>
        <div className="space-y-3">
          {[
            { month: "Fevereiro 2026", receitas: "R$ 8.200", despesas: "R$ 4.750", saldo: "R$ 3.450" },
            { month: "Janeiro 2026", receitas: "R$ 7.600", despesas: "R$ 4.600", saldo: "R$ 3.000" },
            { month: "Dezembro 2025", receitas: "R$ 8.500", despesas: "R$ 5.500", saldo: "R$ 3.000" },
          ].map((row) => (
            <div
              key={row.month}
              className="grid grid-cols-4 gap-4 py-3 border-b border-border last:border-0 text-sm"
            >
              <span className="font-medium">{row.month}</span>
              <span className="text-success">{row.receitas}</span>
              <span className="text-destructive">{row.despesas}</span>
              <span className="font-semibold text-primary">{row.saldo}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default RelatoriosPage;
