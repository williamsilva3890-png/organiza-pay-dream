import FinancialCards from "@/components/dashboard/FinancialCards";
import ExpensePieChart from "@/components/dashboard/ExpensePieChart";
import IncomeExpenseBarChart from "@/components/dashboard/IncomeExpenseBarChart";
import TransactionsList from "@/components/dashboard/TransactionsList";
import GoalsProgress from "@/components/dashboard/GoalsProgress";
import { motion } from "framer-motion";
import { CreditCard, ShoppingCart } from "lucide-react";

const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <FinancialCards />

      {/* Gastos & Dívidas summary */}
      <div className="grid sm:grid-cols-2 gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gastos do mês</p>
              <p className="font-display font-bold text-xl">R$ 2.825,00</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Aluguel</span><span className="text-foreground font-medium">R$ 1.500,00</span></div>
            <div className="flex justify-between"><span>Supermercado</span><span className="text-foreground font-medium">R$ 680,00</span></div>
            <div className="flex justify-between"><span>Uber / 99</span><span className="text-foreground font-medium">R$ 320,00</span></div>
            <div className="flex justify-between"><span>Outros</span><span className="text-foreground font-medium">R$ 325,00</span></div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Dívidas do mês</p>
              <p className="font-display font-bold text-xl text-destructive">R$ 3.100,00</p>
            </div>
          </div>
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>Cartão de crédito</span><span className="text-destructive font-medium">R$ 2.300,00</span></div>
            <div className="flex justify-between"><span>Empréstimo pessoal</span><span className="text-destructive font-medium">R$ 800,00</span></div>
          </div>
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <IncomeExpenseBarChart />
        <ExpensePieChart />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <TransactionsList />
        <GoalsProgress />
      </div>
    </div>
  );
};

export default DashboardHome;
