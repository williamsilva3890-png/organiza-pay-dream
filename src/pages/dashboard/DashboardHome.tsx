import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, CreditCard, ShoppingCart, ArrowUpCircle, ArrowDownCircle, Target, CalendarDays, Repeat } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, AreaChart, Area } from "recharts";
import { Progress } from "@/components/ui/progress";
import type { useFinanceData } from "@/hooks/useFinanceData";

const DEFAULT_CATEGORY_COLORS: Record<string, string> = {
  Moradia: "hsl(280 60% 55%)", Alimentação: "hsl(35 95% 55%)", Transporte: "hsl(210 70% 55%)",
  Saúde: "hsl(270 45% 60%)", Lazer: "hsl(330 70% 55%)", Educação: "hsl(200 60% 50%)",
  Outros: "hsl(200 10% 65%)", Dívida: "hsl(0 72% 55%)",
};

const CHART_COLOR_PRESETS: Record<string, Record<string, string>> = {
  "Roxo Clássico": DEFAULT_CATEGORY_COLORS,
  "Vibrante": {
    Moradia: "hsl(340 80% 55%)", Alimentação: "hsl(45 100% 50%)", Transporte: "hsl(190 80% 45%)",
    Saúde: "hsl(150 60% 45%)", Lazer: "hsl(290 70% 55%)", Educação: "hsl(25 90% 55%)",
    Outros: "hsl(220 15% 60%)", Dívida: "hsl(0 85% 50%)",
  },
  "Pastel": {
    Moradia: "hsl(280 40% 70%)", Alimentação: "hsl(35 70% 70%)", Transporte: "hsl(210 50% 70%)",
    Saúde: "hsl(160 40% 70%)", Lazer: "hsl(330 50% 70%)", Educação: "hsl(200 40% 70%)",
    Outros: "hsl(200 10% 75%)", Dívida: "hsl(0 50% 70%)",
  },
};

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const DashboardHome = ({ finance }: Props) => {
  const { receitas, despesas, metas, totalReceitas, totalDespesas, saldo, gastos, dividas, totalGastos, totalDividas, loading } = finance;
  const [layoutMode, setLayoutMode] = useState(() => localStorage.getItem("dashboard-layout") || "normal");

  useEffect(() => {
    const handler = () => setLayoutMode(localStorage.getItem("dashboard-layout") || "normal");
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }, []);

  const chartPreset = localStorage.getItem("chart-preset") || "Roxo Clássico";
  const categoryColors = CHART_COLOR_PRESETS[chartPreset] || DEFAULT_CATEGORY_COLORS;

  // Pie chart data
  const pieMap = new Map<string, number>();
  gastos.forEach(d => {
    const cat = d.category || "Outros";
    pieMap.set(cat, (pieMap.get(cat) || 0) + Number(d.amount));
  });
  const pieData = Array.from(pieMap.entries()).map(([name, value]) => ({
    name, value, color: categoryColors[name] || "hsl(200 10% 65%)",
  }));

  // Recent transactions
  const transactions = [
    ...receitas.slice(0, 5).map(r => ({ ...r, txType: "income" as const })),
    ...despesas.slice(0, 5).map(d => ({ ...d, txType: "expense" as const })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6);

  // Bar chart data for advanced mode (last 6 months)
  const monthlyData = (() => {
    const months: Record<string, { month: string; receitas: number; despesas: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = { month: label, receitas: 0, despesas: 0 };
    }
    receitas.forEach(r => { const k = r.date.substring(0, 7); if (months[k]) months[k].receitas += Number(r.amount); });
    despesas.forEach(d => { const k = d.date.substring(0, 7); if (months[k]) months[k].despesas += Number(d.amount); });
    return Object.values(months);
  })();

  // Recurring income count
  const recurringCount = receitas.filter(r => (r as any).recurrence).length;

  if (loading) {
    return <div className="flex items-center justify-center py-20"><p className="text-muted-foreground">Carregando dados...</p></div>;
  }

  const isEmpty = receitas.length === 0 && despesas.length === 0 && metas.length === 0;

  // ===== BÁSICO =====
  if (layoutMode === "basico") {
    return (
      <div className="space-y-6">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { title: "Saldo", value: saldo, icon: Wallet, iconBg: "bg-primary/10", iconColor: "text-primary" },
            { title: "Renda", value: totalReceitas, icon: TrendingUp, iconBg: "bg-success/10", iconColor: "text-success" },
            { title: "Despesas", value: totalDespesas, icon: TrendingDown, iconBg: "bg-destructive/10", iconColor: "text-destructive" },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-5 h-5 ${card.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{card.title}</p>
                  <p className="font-display font-bold text-xl">{fmt(card.value)}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        {isEmpty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
            <p className="text-muted-foreground">Seu painel está zerado! 🎉</p>
            <p className="text-sm text-muted-foreground">Comece adicionando suas receitas e despesas.</p>
          </motion.div>
        )}
      </div>
    );
  }

  // ===== AVANÇADO =====
  if (layoutMode === "avancado") {
    const paidCount = despesas.filter(d => d.paid).length;
    const unpaidCount = despesas.length - paidCount;
    const savingsRate = totalReceitas > 0 ? Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100) : 0;

    return (
      <div className="space-y-6">
        {/* 4 summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: "Saldo do mês", value: saldo, icon: Wallet, iconBg: "bg-primary/10", iconColor: "text-primary", extra: `${savingsRate >= 0 ? "+" : ""}${savingsRate}% economia` },
            { title: "Total de renda", value: totalReceitas, icon: TrendingUp, iconBg: "bg-success/10", iconColor: "text-success", extra: `${receitas.length} entradas` },
            { title: "Total de despesas", value: totalDespesas, icon: TrendingDown, iconBg: "bg-destructive/10", iconColor: "text-destructive", extra: `${paidCount} pagas, ${unpaidCount} pendentes` },
            { title: "Recorrentes", value: recurringCount, icon: Repeat, iconBg: "bg-primary/10", iconColor: "text-primary", extra: "rendas fixas", isCount: true },
          ].map((card, i) => (
            <motion.div key={card.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-4 border border-border shadow-card">
              <div className="flex items-start justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 ${card.iconColor}`} />
                </div>
                <span className="text-[10px] text-muted-foreground bg-muted rounded-full px-2 py-0.5">{card.extra}</span>
              </div>
              <p className="text-xs text-muted-foreground">{card.title}</p>
              <p className="font-display font-bold text-xl">{(card as any).isCount ? card.value : fmt(card.value as number)}</p>
            </motion.div>
          ))}
        </div>

        {isEmpty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
            <p className="text-muted-foreground">Seu painel está zerado! 🎉</p>
            <p className="text-sm text-muted-foreground">Comece adicionando suas receitas e despesas.</p>
          </motion.div>
        )}

        {/* Gastos & Dívidas */}
        {(gastos.length > 0 || dividas.length > 0) && (
          <div className="grid sm:grid-cols-2 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-warning" /></div>
                <div><p className="text-sm text-muted-foreground">Gastos</p><p className="font-display font-bold text-xl">{fmt(totalGastos)}</p></div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {gastos.slice(0, 5).map(g => (
                  <div key={g.id} className="flex justify-between"><span>{g.description}</span><span className="text-foreground font-medium">{fmt(Number(g.amount))}</span></div>
                ))}
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-destructive" /></div>
                <div><p className="text-sm text-muted-foreground">Dívidas</p><p className="font-display font-bold text-xl text-destructive">{fmt(totalDividas)}</p></div>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                {dividas.slice(0, 5).map(d => (
                  <div key={d.id} className="flex justify-between"><span>{d.description}</span><span className="text-destructive font-medium">{fmt(Number(d.amount))}</span></div>
                ))}
                {dividas.length === 0 && <p className="text-center py-2">Nenhuma dívida</p>}
              </div>
            </motion.div>
          </div>
        )}

        {/* Bar chart + Pie chart */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-5 border border-border shadow-card">
            <h3 className="font-display font-bold text-base mb-4">Receitas vs Despesas</h3>
            {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))" }} />
                  <Bar dataKey="receitas" name="Renda" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
            )}
          </div>

          <div className="bg-card rounded-xl p-5 border border-border shadow-card">
            <h3 className="font-display font-bold text-base mb-4">Despesas por categoria</h3>
            {pieData.length > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="w-48 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "13px" }} />
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
        </div>

        {/* Area chart trend */}
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4">Tendência mensal</h3>
          {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
            <ResponsiveContainer width="100%" height={180}>
              <AreaChart data={monthlyData}>
                <defs>
                  <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))" }} />
                <Area type="monotone" dataKey="receitas" name="Renda" stroke="hsl(var(--chart-income))" fill="url(#gradIncome)" strokeWidth={2} />
                <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-expense))" fill="url(#gradExpense)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
          )}
        </div>

        {/* Transactions + Goals side by side */}
        <div className="grid lg:grid-cols-2 gap-6">
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
                    <p className={`text-sm font-semibold ${tx.txType === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.txType === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma movimentação ainda</p>
            )}
          </div>

          {metas.length > 0 && (
            <div className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><h3 className="font-display font-bold text-base">Metas financeiras</h3></div>
              <div className="space-y-5">
                {metas.slice(0, 4).map(goal => {
                  const pct = goal.target_amount > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1.5"><p className="text-sm font-medium">{goal.title}</p><span className="text-xs text-muted-foreground">{goal.deadline}</span></div>
                      <Progress value={pct} className="h-2.5 mb-1" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{fmt(Number(goal.current_amount))}</span><span>{pct}% de {fmt(Number(goal.target_amount))}</span></div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

   // ===== NORMAL (default) =====
  return (
    <div className="space-y-6">
      {/* Financial summary cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { title: "Saldo do mês", value: saldo, icon: Wallet, iconBg: "bg-primary/10", iconColor: "text-primary", positive: saldo >= 0 },
          { title: "Total de renda", value: totalReceitas, icon: TrendingUp, iconBg: "bg-success/10", iconColor: "text-success", positive: true },
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

      {/* Charts row — Bar + Pie */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4">Receitas vs Despesas</h3>
          {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))" }} />
                <Bar dataKey="receitas" name="Renda" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} barSize={18} />
                <Bar dataKey="despesas" name="Despesas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
          <h3 className="font-display font-bold text-base mb-4">Despesas por categoria</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-48 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "13px" }} />
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
        </motion.div>
      </div>

      {/* Area chart trend */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <h3 className="font-display font-bold text-base mb-4">Tendência mensal</h3>
        {monthlyData.some(m => m.receitas > 0 || m.despesas > 0) ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradIncomeNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExpenseNormal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))", fontSize: "12px", background: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="receitas" name="Renda" stroke="hsl(var(--chart-income))" fill="url(#gradIncomeNormal)" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--chart-income))" }} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-expense))" fill="url(#gradExpenseNormal)" strokeWidth={2} dot={{ r: 3, fill: "hsl(var(--chart-expense))" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
        )}
      </motion.div>

      {/* Gastos & Dívidas */}
      {(gastos.length > 0 || dividas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Gastos do mês</p><p className="font-display font-bold text-xl">{fmt(totalGastos)}</p></div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {gastos.slice(0, 4).map(g => (<div key={g.id} className="flex justify-between"><span>{g.description}</span><span className="text-foreground font-medium">{fmt(Number(g.amount))}</span></div>))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center"><CreditCard className="w-5 h-5 text-destructive" /></div>
              <div><p className="text-sm text-muted-foreground">Dívidas do mês</p><p className="font-display font-bold text-xl text-destructive">{fmt(totalDividas)}</p></div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {dividas.slice(0, 4).map(d => (<div key={d.id} className="flex justify-between"><span>{d.description}</span><span className="text-destructive font-medium">{fmt(Number(d.amount))}</span></div>))}
              {dividas.length === 0 && <p className="text-center py-2">Nenhuma dívida</p>}
            </div>
          </motion.div>
        </div>
      )}

      {/* Transactions */}
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

      {/* Goals */}
      {metas.length > 0 && (
        <div className="bg-card rounded-xl p-5 border border-border shadow-card">
          <div className="flex items-center gap-2 mb-4"><Target className="w-5 h-5 text-primary" /><h3 className="font-display font-bold text-base">Metas financeiras</h3></div>
          <div className="space-y-5">
            {metas.slice(0, 3).map(goal => {
              const pct = goal.target_amount > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
              return (
                <div key={goal.id}>
                  <div className="flex items-center justify-between mb-1.5"><p className="text-sm font-medium">{goal.title}</p><span className="text-xs text-muted-foreground">{goal.deadline}</span></div>
                  <Progress value={pct} className="h-2.5 mb-1" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground"><span>{fmt(Number(goal.current_amount))}</span><span>{pct}% de {fmt(Number(goal.target_amount))}</span></div>
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