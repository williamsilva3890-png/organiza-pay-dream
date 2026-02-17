import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, ShoppingCart, ArrowUpCircle, ArrowDownCircle, Target } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Progress } from "@/components/ui/progress";
import type { useFinanceData } from "@/hooks/useFinanceData";

const categoryColors: Record<string, string> = {
  Moradia: "hsl(280 60% 55%)",
  Alimentação: "hsl(35 95% 55%)",
  Transporte: "hsl(210 70% 55%)",
  Saúde: "hsl(160 45% 50%)",
  Lazer: "hsl(330 70% 55%)",
  Educação: "hsl(200 60% 50%)",
  Outros: "hsl(200 10% 65%)",
  Dívida: "hsl(0 72% 55%)",
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const DashboardHome = ({ finance }: Props) => {
  const { receitas, despesas, metas, totalReceitas, totalDespesas, saldo, gastos, dividas, totalGastos, totalDividas, loading } = finance;

  // Pie chart data from real expenses
  const pieMap = new Map<string, number>();
  gastos.forEach(d => {
    const cat = d.category || "Outros";
    pieMap.set(cat, (pieMap.get(cat) || 0) + Number(d.amount));
  });
  const pieData = Array.from(pieMap.entries()).map(([name, value]) => ({
    name, value, color: categoryColors[name] || "hsl(200 10% 65%)",
  }));

  // Recent transactions (mix of receitas + despesas, sorted by date)
  const transactions = [
    ...receitas.slice(0, 5).map(r => ({ ...r, txType: "income" as const })),
    ...despesas.slice(0, 5).map(d => ({ ...d, txType: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando dados...</p></div>;
  }

  const isEmpty = receitas.length === 0 && despesas.length === 0 && metas.length === 0;

  return (
    <div className="space-y-6">
      {/* Financial summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Saldo do mês", value: saldo, icon: Wallet, iconBg: "bg-primary/10", iconColor: "text-primary", positive: saldo >= 0 },
          { title: "Total de receitas", value: totalReceitas, icon: TrendingUp, iconBg: "bg-success/10", iconColor: "text-success", positive: true },
          { title: "Total de despesas", value: totalDespesas, icon: TrendingDown, iconBg: "bg-destructive/10", iconColor: "text-destructive", positive: false },
        ].map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-start justify-between mb-4">
              <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                <card.icon className={`w-5 h-5 ${card.iconColor}`} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{card.title}</p>
            <p className="font-display font-bold text-2xl">{fmt(card.value)}</p>
          </motion.div>
        ))}
      </div>

      {isEmpty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
          <p className="text-muted-foreground mb-2">Seu painel está zerado! 🎉</p>
          <p className="text-sm text-muted-foreground">Comece adicionando suas receitas e despesas nas páginas ao lado.</p>
        </motion.div>
      )}

      {/* Gastos & Dívidas */}
      {(gastos.length > 0 || dividas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gastos do mês</p>
                <p className="font-display font-bold text-xl">{fmt(totalGastos)}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {gastos.slice(0, 4).map(g => (
                <div key={g.id} className="flex justify-between">
                  <span>{g.description}</span>
                  <span className="text-foreground font-medium">{fmt(Number(g.amount))}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Dívidas do mês</p>
                <p className="font-display font-bold text-xl text-destructive">{fmt(totalDividas)}</p>
              </div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {dividas.slice(0, 4).map(d => (
                <div key={d.id} className="flex justify-between">
                  <span>{d.description}</span>
                  <span className="text-destructive font-medium">{fmt(Number(d.amount))}</span>
                </div>
              ))}
              {dividas.length === 0 && <p className="text-center py-2">Nenhuma dívida</p>}
            </div>
          </motion.div>
        </div>
      )}

      {/* Pie chart + Transactions */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4">Despesas por categoria</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)}
                      contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "13px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Adicione gastos para ver o gráfico</p>
          )}
        </div>

        {/* Recent transactions */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4">Últimas movimentações</h3>
          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${tx.txType === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                    {tx.txType === "income" ? <ArrowUpCircle className="w-4 h-4 text-success" /> : <ArrowDownCircle className="w-4 h-4 text-destructive" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.category}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-semibold ${tx.txType === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.txType === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação ainda</p>
          )}
        </div>
      </div>

      {/* Goals */}
      {metas.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-base">Metas financeiras</h3>
          </div>
          <div className="space-y-5">
            {metas.slice(0, 3).map(goal => {
              const pct = goal.target_amount > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium">{goal.title}</p>
                    <span className="text-xs text-muted-foreground">{goal.deadline}</span>
                  </div>
                  <Progress value={pct} className="h-2.5 mb-1" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{fmt(Number(goal.current_amount))}</span>
                    <span>{pct}% de {fmt(Number(goal.target_amount))}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardHome;
