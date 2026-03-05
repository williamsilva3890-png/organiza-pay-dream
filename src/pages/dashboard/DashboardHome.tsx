import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Wallet, TrendingUp, TrendingDown, CreditCard, ShoppingCart, ArrowUpCircle, ArrowDownCircle, Target, Repeat } from "lucide-react";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, AreaChart, Area, LineChart, Line, Legend, RadialBarChart, RadialBar,
} from "recharts";
import { Progress } from "@/components/ui/progress";
import ScoreFinanceiro from "@/components/dashboard/ScoreFinanceiro";
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

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid hsl(var(--border))",
  fontSize: "12px",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
  boxShadow: "0 8px 24px -4px hsl(var(--foreground) / 0.1)",
};

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

  // Monthly data (last 6 months)
  const monthlyData = (() => {
    const months: Record<string, { month: string; receitas: number; despesas: number; saldo: number }> = {};
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      months[key] = { month: label, receitas: 0, despesas: 0, saldo: 0 };
    }
    receitas.forEach(r => { const k = r.date.substring(0, 7); if (months[k]) months[k].receitas += Number(r.amount); });
    despesas.forEach(d => { const k = d.date.substring(0, 7); if (months[k]) months[k].despesas += Number(d.amount); });
    Object.values(months).forEach(m => { m.saldo = m.receitas - m.despesas; });
    return Object.values(months);
  })();

  const hasMonthlyData = monthlyData.some(m => m.receitas > 0 || m.despesas > 0);

  // Recurring income count
  const recurringCount = receitas.filter(r => (r as any).recurrence).length;

  // Radial data for savings rate
  const savingsRate = totalReceitas > 0 ? Math.max(0, Math.round(((totalReceitas - totalDespesas) / totalReceitas) * 100)) : 0;
  const radialData = [{ name: "Economia", value: savingsRate, fill: "hsl(var(--chart-income))" }];

  // Paid vs unpaid
  const paidCount = despesas.filter(d => d.paid).length;
  const unpaidCount = despesas.length - paidCount;

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
        <ScoreFinanceiro
          receitas={receitas}
          despesas={despesas}
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          saldo={saldo}
          metas={metas}
        />
      </div>
    );
  }

  // ===== AVANÇADO =====
  if (layoutMode === "avancado") {
    // Daily average expense
    const now = new Date();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dayOfMonth = now.getDate();
    const dailyAvgExpense = dayOfMonth > 0 ? Math.round(totalDespesas / dayOfMonth) : 0;

    // Yearly projection
    const monthIndex = now.getMonth();
    const yearlyProjection = monthIndex > 0 ? Math.round(totalReceitas * (12 / (monthIndex + 1))) : totalReceitas * 12;

    // % change mock (based on data variance)
    const lastMonthData = monthlyData[monthlyData.length - 2];
    const thisMonthData = monthlyData[monthlyData.length - 1];
    const incomePctChange = lastMonthData && lastMonthData.receitas > 0 ? Math.round(((thisMonthData.receitas - lastMonthData.receitas) / lastMonthData.receitas) * 100) : 0;
    const expensePctChange = lastMonthData && lastMonthData.despesas > 0 ? Math.round(((thisMonthData.despesas - lastMonthData.despesas) / lastMonthData.despesas) * 100) : 0;

    // Gauge data
    const gauges = [
      { label: "Mensal", value: Math.abs(saldo), pct: savingsRate, change: incomePctChange, color: "hsl(var(--primary))" },
      { label: "Diário", value: dailyAvgExpense, pct: Math.min(100, Math.round((dailyAvgExpense / (totalReceitas / daysInMonth || 1)) * 100)), change: expensePctChange, color: "hsl(270 80% 70%)" },
      { label: "Anual", value: yearlyProjection, pct: Math.min(100, Math.round((monthIndex + 1) / 12 * 100)), change: incomePctChange, color: "hsl(var(--primary))" },
    ];

    // Horizontal bar data for categories
    const topCategories = pieData.sort((a, b) => b.value - a.value).slice(0, 4);
    const maxCatValue = topCategories.length > 0 ? topCategories[0].value : 1;

    // Mini sparkline data for renda/despesa
    const sparkReceitas = monthlyData.map((m, i) => ({ x: i, y: m.receitas }));
    const sparkDespesas = monthlyData.map((m, i) => ({ x: i, y: m.despesas }));

    return (
      <div className="space-y-5">
        {isEmpty && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
            <p className="text-muted-foreground">Seu painel está zerado! 🎉</p>
            <p className="text-sm text-muted-foreground">Comece adicionando suas receitas e despesas.</p>
          </motion.div>
        )}

        {/* Row 1: 3 Donut Gauges + Horizontal Bars */}
        <div className="grid lg:grid-cols-4 gap-4">
          {gauges.map((g, i) => (
            <motion.div key={g.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card flex flex-col items-center">
              <div className="w-28 h-28 relative mb-3">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart cx="50%" cy="50%" innerRadius="75%" outerRadius="100%" barSize={10} data={[{ value: g.pct, fill: g.color }]} startAngle={90} endAngle={-270}>
                    <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-2xl">{g.pct > 999 ? `${(g.pct / 1000).toFixed(0)}k` : g.pct}</span>
                </div>
              </div>
              <p className={`text-[11px] font-medium mb-1 ${g.change >= 0 ? "text-success" : "text-destructive"}`}>
                {g.change >= 0 ? "+" : ""}{g.change}%
              </p>
              <p className="text-xs text-muted-foreground">{g.label}</p>
            </motion.div>
          ))}

          {/* Horizontal bar charts */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <h3 className="font-display font-bold text-sm mb-4">Categorias</h3>
            <div className="space-y-3">
              {topCategories.length > 0 ? topCategories.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{cat.name}</span>
                    <span className="font-medium">{fmt(cat.value)}</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(cat.value / maxCatValue) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ background: cat.color }}
                    />
                  </div>
                </div>
              )) : (
                <p className="text-xs text-muted-foreground text-center py-4">Sem dados</p>
              )}
            </div>
          </motion.div>
        </div>

        {/* Row 2: Two large stat cards with sparklines */}
        <div className="grid sm:grid-cols-2 gap-4">
          {[
            { label: "Renda total", value: totalReceitas, icon: TrendingUp, iconBg: "bg-success/10", iconColor: "text-success", spark: sparkReceitas, sparkColor: "hsl(var(--chart-income))" },
            { label: "Despesas total", value: totalDespesas, icon: TrendingDown, iconBg: "bg-destructive/10", iconColor: "text-destructive", spark: sparkDespesas, sparkColor: "hsl(var(--chart-expense))" },
          ].map((card, i) => (
            <motion.div key={card.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.08 }}
              className="bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl ${card.iconBg} flex items-center justify-center shrink-0`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{card.label}</p>
                  <p className="font-display font-bold text-2xl">{fmt(card.value)}</p>
                </div>
                <div className="w-28 h-14 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.spark}>
                      <defs>
                        <linearGradient id={`spark-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={card.sparkColor} stopOpacity={0.4} />
                          <stop offset="95%" stopColor={card.sparkColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area type="monotone" dataKey="y" stroke={card.sparkColor} fill={`url(#spark-${i})`} strokeWidth={2} dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Row 3: Grouped Bar Chart + Radial Savings Gauge */}
        <div className="grid lg:grid-cols-3 gap-5">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-base">Receitas vs Despesas</h3>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-income))" }} /> Renda</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-expense))" }} /> Despesas</span>
              </div>
            </div>
            {hasMonthlyData ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={monthlyData} barGap={6}>
                  <defs>
                    <linearGradient id="barIncAdvI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-income))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--chart-income))" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="barIncAdvE" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--chart-expense))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                  <Bar dataKey="receitas" name="Renda" fill="url(#barIncAdvI)" radius={[6, 6, 0, 0]} barSize={22} />
                  <Bar dataKey="despesas" name="Despesas" fill="url(#barIncAdvE)" radius={[6, 6, 0, 0]} barSize={22} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-12">Sem dados para exibir</p>
            )}
          </motion.div>

          {/* Savings rate radial + donut */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card flex flex-col items-center justify-center">
            <h3 className="font-display font-bold text-sm mb-2 self-start">Taxa de economia</h3>
            <div className="w-36 h-36 relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart cx="50%" cy="50%" innerRadius="70%" outerRadius="100%" barSize={14} data={radialData} startAngle={90} endAngle={-270}>
                  <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={10} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="font-display font-bold text-3xl">{savingsRate}%</span>
                <span className="text-[10px] text-muted-foreground">economizado</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{fmt(Math.max(0, saldo))} guardado este mês</p>
          </motion.div>
        </div>

        {/* Row 4: Donut categories + Transactions + Goals */}
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Donut */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <h3 className="font-display font-bold text-sm mb-4">Despesas por categoria</h3>
            {pieData.length > 0 ? (
              <div className="flex flex-col items-center">
                <div className="w-36 h-36 relative mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={4} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                      </Pie>
                      <Tooltip formatter={(value: number) => fmt(value)} contentStyle={tooltipStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-sm">{fmt(totalGastos)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs w-full">
                  {pieData.map(item => (
                    <div key={item.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground truncate">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Sem dados</p>
            )}
          </motion.div>

          {/* Transactions */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <h3 className="font-display font-bold text-sm mb-4">Últimas movimentações</h3>
            {transactions.length > 0 ? (
              <div className="space-y-2.5">
                {transactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center gap-2.5 py-1.5 border-b border-border last:border-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${tx.txType === "income" ? "bg-success/10" : "bg-destructive/10"}`}>
                      {tx.txType === "income" ? <ArrowUpCircle className="w-3.5 h-3.5 text-success" /> : <ArrowDownCircle className="w-3.5 h-3.5 text-destructive" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate">{tx.description}</p>
                    </div>
                    <p className={`text-xs font-semibold ${tx.txType === "income" ? "text-success" : "text-destructive"}`}>
                      {tx.txType === "income" ? "+" : "-"}{fmt(Number(tx.amount))}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma movimentação</p>
            )}
          </motion.div>

          {/* Goals */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-2 mb-4"><Target className="w-4 h-4 text-primary" /><h3 className="font-display font-bold text-sm">Metas</h3></div>
            {metas.length > 0 ? (
              <div className="space-y-4">
                {metas.slice(0, 3).map(goal => {
                  const pct = goal.target_amount > 0 ? Math.round((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;
                  return (
                    <div key={goal.id}>
                      <div className="flex items-center justify-between mb-1"><p className="text-xs font-medium truncate">{goal.title}</p><span className="text-[10px] text-muted-foreground">{pct}%</span></div>
                      <Progress value={pct} className="h-2" />
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground text-center py-8">Nenhuma meta definida</p>
            )}
          </motion.div>
        </div>

        <ScoreFinanceiro
          receitas={receitas}
          despesas={despesas}
          totalReceitas={totalReceitas}
          totalDespesas={totalDespesas}
          saldo={saldo}
          metas={metas}
        />
      </div>
    );
  }

  // ===== NORMAL (default) =====
  return (
    <div className="space-y-6">
      {/* Modern gauge cards */}
      {(() => {
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        const dayOfMonth = now.getDate();
        const dailyAvg = dayOfMonth > 0 ? Math.round(totalDespesas / dayOfMonth) : 0;
        const monthIndex = now.getMonth();
        const lastMD = monthlyData[monthlyData.length - 2];
        const thisMD = monthlyData[monthlyData.length - 1];
        const incomePct = lastMD && lastMD.receitas > 0 ? Math.round(((thisMD.receitas - lastMD.receitas) / lastMD.receitas) * 100) : 0;
        const expensePct = lastMD && lastMD.despesas > 0 ? Math.round(((thisMD.despesas - lastMD.despesas) / lastMD.despesas) * 100) : 0;

        const gauges = [
          { label: "Mensal", value: savingsRate, change: incomePct, color: "hsl(270 70% 60%)", trackColor: "hsl(270 30% 20%)" },
          { label: "Diário", value: Math.min(100, Math.round((dailyAvg / (totalReceitas / daysInMonth || 1)) * 100)), change: expensePct, color: "hsl(280 80% 65%)", trackColor: "hsl(280 30% 20%)" },
          { label: "Anual", value: Math.min(100, Math.round((monthIndex + 1) / 12 * 100)), change: incomePct, color: "hsl(260 75% 70%)", trackColor: "hsl(260 30% 20%)" },
        ];

        return (
          <div className="grid sm:grid-cols-3 gap-4">
            {gauges.map((g, i) => (
              <motion.div key={g.label} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.1, type: "spring", stiffness: 200 }}
                className="bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col items-center relative overflow-hidden group">
                {/* Glow effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: `radial-gradient(circle at 50% 50%, ${g.color.replace(')', ' / 0.08)')}, transparent 70%)` }} />
                <div className="w-28 h-28 relative mb-4">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {/* Track */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="7" strokeLinecap="round" />
                    {/* Progress */}
                    <circle cx="50" cy="50" r="42" fill="none" stroke={g.color} strokeWidth="7" strokeLinecap="round"
                      strokeDasharray={`${2 * Math.PI * 42}`}
                      strokeDashoffset={`${2 * Math.PI * 42 * (1 - g.value / 100)}`}
                      className="transition-all duration-1000 ease-out"
                      style={{ filter: `drop-shadow(0 0 6px ${g.color.replace(')', ' / 0.5)')})` }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="font-display font-bold text-3xl">{g.value}</span>
                  </div>
                </div>
                <p className={`text-xs font-semibold mb-1 ${g.change >= 0 ? "text-success" : "text-destructive"}`}>
                  {g.change >= 0 ? "+" : ""}{g.change}%
                </p>
                <p className="text-sm text-muted-foreground font-medium">{g.label}</p>
              </motion.div>
            ))}
          </div>
        );
      })()}

      {isEmpty && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-card rounded-xl p-8 border border-border shadow-card text-center">
          <p className="text-muted-foreground mb-2">Seu painel está zerado! 🎉</p>
          <p className="text-sm text-muted-foreground">Comece adicionando suas receitas e despesas nas páginas ao lado.</p>
        </motion.div>
      )}

      {/* Charts row — Bar + Donut */}
      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.15, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-base">Receitas vs Despesas</h3>
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-income))" }} /> Renda</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm" style={{ background: "hsl(var(--chart-expense))" }} /> Despesas</span>
            </div>
          </div>
          {hasMonthlyData ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={monthlyData} barGap={4}>
                <defs>
                  <linearGradient id="barIncomeGradN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-income))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--chart-income))" stopOpacity={0.6} />
                  </linearGradient>
                  <linearGradient id="barExpenseGradN" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--chart-expense))" stopOpacity={1} />
                    <stop offset="100%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
                <Bar dataKey="receitas" name="Renda" fill="url(#barIncomeGradN)" radius={[6, 6, 0, 0]} barSize={18} />
                <Bar dataKey="despesas" name="Despesas" fill="url(#barExpenseGradN)" radius={[6, 6, 0, 0]} barSize={18} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.25, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
          <h3 className="font-display font-bold text-base mb-4">Despesas por categoria</h3>
          {pieData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div className="w-44 h-44 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4} dataKey="value" strokeWidth={0}>
                      {pieData.map((entry, index) => (<Cell key={index} fill={entry.color} />))}
                    </Pie>
                    <Tooltip formatter={(value: number) => fmt(value)} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display font-bold text-lg">{fmt(totalGastos)}</span>
                  <span className="text-[10px] text-muted-foreground">total</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-5 gap-y-2.5 text-sm">
                {pieData.map(item => {
                  const pct = totalGastos > 0 ? Math.round((item.value / totalGastos) * 100) : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-muted-foreground">{item.name} <span className="text-foreground font-medium">{pct}%</span></span>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">Adicione gastos para ver o gráfico</p>
          )}
        </motion.div>
      </div>

      {/* Area trend chart */}
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.35, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
        <h3 className="font-display font-bold text-base mb-4">Tendência mensal</h3>
        {hasMonthlyData ? (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="gradIncomeN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-income))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-income))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradExpenseN" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--chart-expense))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--chart-expense))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="receitas" name="Renda" stroke="hsl(var(--chart-income))" fill="url(#gradIncomeN)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-income))", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
              <Area type="monotone" dataKey="despesas" name="Despesas" stroke="hsl(var(--chart-expense))" fill="url(#gradExpenseN)" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--chart-expense))", strokeWidth: 2, stroke: "hsl(var(--card))" }} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-8">Sem dados para exibir</p>
        )}
      </motion.div>

      {/* Gastos & Dívidas */}
      {(gastos.length > 0 || dividas.length > 0) && (
        <div className="grid sm:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, x: -20, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.4, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center"><ShoppingCart className="w-5 h-5 text-warning" /></div>
              <div><p className="text-sm text-muted-foreground">Gastos do mês</p><p className="font-display font-bold text-xl">{fmt(totalGastos)}</p></div>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              {gastos.slice(0, 4).map(g => (<div key={g.id} className="flex justify-between"><span>{g.description}</span><span className="text-foreground font-medium">{fmt(Number(g.amount))}</span></div>))}
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20, scale: 0.97 }} animate={{ opacity: 1, x: 0, scale: 1 }} transition={{ delay: 0.45, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
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
      <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.5, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
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
      </motion.div>

      {/* Goals */}
      {metas.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.55, type: "spring", stiffness: 180, damping: 20 }} className="bg-card rounded-xl p-5 border border-border shadow-card hover:shadow-card-hover transition-shadow duration-300">
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
        </motion.div>
      )}

      {/* Score + Thermometer + Spending Map + Detector */}
      <ScoreFinanceiro
        receitas={receitas}
        despesas={despesas}
        totalReceitas={totalReceitas}
        totalDespesas={totalDespesas}
        saldo={saldo}
        metas={metas}
      />
    </div>
  );
};

export default DashboardHome;
