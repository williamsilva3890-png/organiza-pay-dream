import { motion } from "framer-motion";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const cards = [
  {
    title: "Saldo do mês",
    value: "R$ 3.450,00",
    change: "+12%",
    positive: true,
    icon: Wallet,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  {
    title: "Total de receitas",
    value: "R$ 8.200,00",
    change: "+8%",
    positive: true,
    icon: TrendingUp,
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
  {
    title: "Total de despesas",
    value: "R$ 4.750,00",
    change: "+3%",
    positive: false,
    icon: TrendingDown,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
  },
];

const FinancialCards = () => {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-card rounded-xl p-5 border border-border shadow-card"
        >
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}
            >
              <card.icon className={`w-5 h-5 ${card.iconColor}`} />
            </div>
            <div
              className={`flex items-center gap-1 text-xs font-medium rounded-full px-2 py-1 ${
                card.positive
                  ? "bg-success/10 text-success"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {card.positive ? (
                <ArrowUpRight className="w-3 h-3" />
              ) : (
                <ArrowDownRight className="w-3 h-3" />
              )}
              {card.change}
            </div>
          </div>
          <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
          <p className="font-display font-bold text-2xl">{card.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default FinancialCards;
