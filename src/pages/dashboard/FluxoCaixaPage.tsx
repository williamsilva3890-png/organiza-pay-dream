import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { DollarSign, TrendingUp, TrendingDown, ArrowRightLeft } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { useFinanceData } from "@/hooks/useFinanceData";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const tooltipStyle = {
  borderRadius: "10px",
  border: "1px solid hsl(var(--border))",
  fontSize: "12px",
  background: "hsl(var(--card))",
  color: "hsl(var(--foreground))",
};

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const FluxoCaixaPage = ({ finance }: Props) => {
  const { receitas, despesas, totalReceitas, totalDespesas, saldo, isPremium } = finance;

  // Build daily cash flow for current month
  const dailyData = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: { day: string; entradas: number; saidas: number; saldo: number }[] = [];
    let runningBalance = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      const dayEntradas = receitas.filter(r => r.date === dateStr).reduce((s, r) => s + Number(r.amount), 0);
      const daySaidas = despesas.filter(de => de.date === dateStr).reduce((s, de) => s + Number(de.amount), 0);
      runningBalance += dayEntradas - daySaidas;
      days.push({ day: String(d), entradas: dayEntradas, saidas: daySaidas, saldo: runningBalance });
    }
    return days;
  }, [receitas, despesas]);

  // Monthly summary (last 6 months)
  const monthlyFlow = useMemo(() => {
    const now = new Date();
    const months: { month: string; entradas: number; saidas: number; liquido: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "");
      const entradas = receitas.filter(r => r.date.startsWith(key)).reduce((s, r) => s + Number(r.amount), 0);
      const saidas = despesas.filter(de => de.date.startsWith(key)).reduce((s, de) => s + Number(de.amount), 0);
      months.push({ month: label, entradas, saidas, liquido: entradas - saidas });
    }
    return months;
  }, [receitas, despesas]);

  if (!isPremium) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ArrowRightLeft className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-xl mb-2">Fluxo de Caixa</h2>
        <p className="text-muted-foreground text-sm">Recurso exclusivo para assinantes Premium.</p>
      </div>
    );
  }

  const hasData = dailyData.some(d => d.entradas > 0 || d.saidas > 0);

  return (
    <div className="space-y-6">
      <h1 className="font-display font-bold text-2xl flex items-center gap-2">
        <ArrowRightLeft className="w-6 h-6 text-primary" /> Fluxo de Caixa
      </h1>

      {/* Summary cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Entradas", value: totalReceitas, icon: TrendingUp, color: "text-success", bg: "bg-success/10" },
          { label: "Saídas", value: totalDespesas, icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10" },
          { label: "Saldo Líquido", value: saldo, icon: DollarSign, color: saldo >= 0 ? "text-success" : "text-destructive", bg: saldo >= 0 ? "bg-success/10" : "bg-destructive/10" },
        ].map((c, i) => (
          <motion.div key={c.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-5 border border-border shadow-card">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                <c.icon className={`w-5 h-5 ${c.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{c.label}</p>
                <p className={`font-display font-bold text-xl ${c.color}`}>{fmt(c.value)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Daily cash flow chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-card rounded-xl p-5 border border-border shadow-card">
        <h3 className="font-display font-bold text-base mb-4">Fluxo Diário (mês atual)</h3>
        {hasData ? (
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={dailyData}>
              <defs>
                <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
              <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
              <Area type="monotone" dataKey="saldo" name="Saldo acumulado" stroke="hsl(var(--primary))" fill="url(#flowGrad)" strokeWidth={2.5} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">Sem dados para o mês atual</p>
        )}
      </motion.div>

      {/* Monthly comparison */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-card rounded-xl p-5 border border-border shadow-card">
        <h3 className="font-display font-bold text-base mb-4">Comparativo Mensal</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyFlow} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)} />
            <Tooltip formatter={(v: number) => fmt(v)} contentStyle={tooltipStyle} />
            <Bar dataKey="entradas" name="Entradas" fill="hsl(var(--chart-income))" radius={[4, 4, 0, 0]} barSize={16} />
            <Bar dataKey="saidas" name="Saídas" fill="hsl(var(--chart-expense))" radius={[4, 4, 0, 0]} barSize={16} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
};

export default FluxoCaixaPage;
