import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, Lightbulb } from "lucide-react";
import type { Receita, Despesa } from "@/hooks/useFinanceData";

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

interface Props {
  receitas: Receita[];
  despesas: Despesa[];
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  metas: { current_amount: number; target_amount: number }[];
}

const CATEGORY_EMOJI: Record<string, string> = {
  Alimentação: "🍔", Transporte: "🚗", Lazer: "🎮", Moradia: "🏠",
  Saúde: "💊", Educação: "📚", Outros: "📦", Dívida: "💳",
};

export default function ScoreFinanceiro({ receitas, despesas, totalReceitas, totalDespesas, saldo, metas }: Props) {
  // === SCORE CALCULATION ===
  const savingsRate = totalReceitas > 0 ? (saldo / totalReceitas) * 100 : 0;
  const paidRatio = despesas.length > 0 ? despesas.filter(d => d.paid).length / despesas.length : 1;
  const metasProgress = metas.length > 0
    ? metas.reduce((s, m) => s + (m.target_amount > 0 ? Math.min(1, m.current_amount / m.target_amount) : 0), 0) / metas.length
    : 0;
  const diversityScore = new Set(receitas.map(r => r.category)).size >= 2 ? 1 : 0.5;

  const rawScore = Math.round(
    (Math.min(savingsRate, 40) / 40) * 35 + // savings up to 35pts
    paidRatio * 25 + // paid bills 25pts
    metasProgress * 20 + // goals progress 20pts
    diversityScore * 10 + // income diversity 10pts
    (despesas.length > 0 ? 10 : 0) // tracking expenses 10pts
  );
  const score = Math.max(0, Math.min(100, rawScore));

  // Thermometer
  const thermometer = score >= 70 ? { label: "Saudável", emoji: "🟢", color: "text-success", bg: "bg-success/10" }
    : score >= 40 ? { label: "Atenção", emoji: "🟡", color: "text-warning", bg: "bg-warning/10" }
    : { label: "Crítico", emoji: "🔴", color: "text-destructive", bg: "bg-destructive/10" };

  // === SPENDING MAP ===
  const catMap = new Map<string, number>();
  despesas.filter(d => d.type === "gasto").forEach(d => {
    const cat = d.category || "Outros";
    catMap.set(cat, (catMap.get(cat) || 0) + Number(d.amount));
  });
  const categories = Array.from(catMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);
  const maxCat = categories.length > 0 ? categories[0][1] : 1;

  // === UNNECESSARY SPENDING DETECTOR ===
  const leisureCategories = ["Lazer", "Alimentação"];
  const alerts = categories
    .filter(([cat, val]) => leisureCategories.includes(cat) && totalReceitas > 0 && (val / totalReceitas) > 0.15)
    .map(([cat, val]) => {
      const reduction = Math.round(val * 0.3);
      return { cat, val, reduction };
    });

  // Score ring
  const circumference = 2 * Math.PI * 54;
  const strokeOffset = circumference * (1 - score / 100);
  const scoreColor = score >= 70 ? "hsl(var(--chart-income))" : score >= 40 ? "hsl(45 93% 47%)" : "hsl(var(--chart-expense))";

  return (
    <div className="space-y-4">
      {/* Score + Thermometer Row */}
      <div className="grid sm:grid-cols-2 gap-4">
        {/* Score Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card flex flex-col items-center relative overflow-hidden group">
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: `radial-gradient(circle at 50% 30%, ${scoreColor.replace(')', ' / 0.06)')}, transparent 70%)` }} />
          <h3 className="font-display font-bold text-sm mb-4 self-start">📊 Score OrganizaPay</h3>
          <div className="w-32 h-32 relative mb-3">
            <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
              <circle cx="60" cy="60" r="54" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <motion.circle cx="60" cy="60" r="54" fill="none" stroke={scoreColor} strokeWidth="8" strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: strokeOffset }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                style={{ filter: `drop-shadow(0 0 8px ${scoreColor.replace(')', ' / 0.4)')})` }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span className="font-display font-bold text-4xl"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
                {score}
              </motion.span>
              <span className="text-xs text-muted-foreground">/100</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            {score >= 80 ? "Excelente controle financeiro! 🏆" :
             score >= 60 ? "Bom caminho, continue assim! 💪" :
             score >= 40 ? "Há espaço para melhorar 📈" :
             "Atenção! Revise seus gastos 🚨"}
          </p>
        </motion.div>

        {/* Thermometer Card */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-bold text-sm mb-4">🌡️ Termômetro Financeiro</h3>
          <div className="flex items-center gap-4 mb-5">
            <div className={`w-16 h-16 rounded-xl ${thermometer.bg} flex items-center justify-center text-3xl`}>
              {thermometer.emoji}
            </div>
            <div>
              <p className={`font-display font-bold text-xl ${thermometer.color}`}>{thermometer.label}</p>
              <p className="text-xs text-muted-foreground">Baseado nos seus hábitos</p>
            </div>
          </div>
          {/* Thermometer bar */}
          <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-destructive via-warning to-success">
            <motion.div className="absolute top-0 h-full w-1 bg-foreground rounded-full shadow-lg"
              initial={{ left: "0%" }}
              animate={{ left: `${Math.min(score, 98)}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>🔴 Crítico</span><span>🟡 Atenção</span><span>🟢 Saudável</span>
          </div>
        </motion.div>
      </div>

      {/* Spending Map */}
      {categories.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-bold text-sm mb-4">🗺️ Mapa de Gastos</h3>
          <p className="text-xs text-muted-foreground mb-4">Onde o dinheiro está indo:</p>
          <div className="space-y-3">
            {categories.map(([cat, val], i) => {
              const pct = totalDespesas > 0 ? Math.round((val / totalDespesas) * 100) : 0;
              const emoji = CATEGORY_EMOJI[cat] || "📦";
              return (
                <motion.div key={cat} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.05 }}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{emoji}</span>
                      <span className="font-medium">{cat}</span>
                    </span>
                    <span className="text-muted-foreground">{fmt(val)} <span className="text-xs">({pct}%)</span></span>
                  </div>
                  <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                    <motion.div className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(val / maxCat) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.4 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Unnecessary Spending Alerts */}
      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 border border-border shadow-card">
          <h3 className="font-display font-bold text-sm mb-4 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-warning" />
            Detector de Gastos Desnecessários
          </h3>
          <div className="space-y-3">
            {alerts.map(({ cat, val, reduction }) => (
              <div key={cat} className="bg-warning/5 border border-warning/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <TrendingDown className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">
                      ⚠️ Você gastou <span className="text-warning font-bold">{fmt(val)}</span> em {cat} este mês.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Lightbulb className="w-3.5 h-3.5 text-primary" />
                      <span>Sugestão: Se reduzir 30%, você economiza <span className="text-success font-semibold">{fmt(reduction)}/mês</span>.</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
