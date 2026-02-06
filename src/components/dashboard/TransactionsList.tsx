import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";

const transactions = [
  {
    id: 1,
    description: "Salário",
    category: "Receita",
    amount: 5500,
    type: "income" as const,
    date: "01/02/2026",
  },
  {
    id: 2,
    description: "Aluguel",
    category: "Moradia",
    amount: -1500,
    type: "expense" as const,
    date: "05/02/2026",
  },
  {
    id: 3,
    description: "Freelance Design",
    category: "Receita",
    amount: 2700,
    type: "income" as const,
    date: "10/02/2026",
  },
  {
    id: 4,
    description: "Supermercado",
    category: "Alimentação",
    amount: -680,
    type: "expense" as const,
    date: "12/02/2026",
  },
  {
    id: 5,
    description: "Uber / 99",
    category: "Transporte",
    amount: -320,
    type: "expense" as const,
    date: "14/02/2026",
  },
  {
    id: 6,
    description: "Venda produto",
    category: "Receita",
    amount: 1200,
    type: "income" as const,
    date: "15/02/2026",
  },
];

const TransactionsList = () => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-base">Últimas movimentações</h3>
        <span className="text-xs text-muted-foreground">Fev 2026</span>
      </div>
      <div className="space-y-3">
        {transactions.map((tx) => (
          <div
            key={tx.id}
            className="flex items-center gap-3 py-2 border-b border-border last:border-0"
          >
            <div
              className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                tx.type === "income"
                  ? "bg-success/10"
                  : "bg-destructive/10"
              }`}
            >
              {tx.type === "income" ? (
                <ArrowUpCircle className="w-4 h-4 text-success" />
              ) : (
                <ArrowDownCircle className="w-4 h-4 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{tx.description}</p>
              <p className="text-xs text-muted-foreground">{tx.category}</p>
            </div>
            <div className="text-right">
              <p
                className={`text-sm font-semibold ${
                  tx.type === "income" ? "text-success" : "text-destructive"
                }`}
              >
                {tx.type === "income" ? "+" : ""}
                R$ {Math.abs(tx.amount).toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </p>
              <p className="text-xs text-muted-foreground">{tx.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsList;
