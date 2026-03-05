import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import type { Receita, Despesa, Meta } from "@/hooks/useFinanceData";

interface Props {
  receitas: Receita[];
  despesas: Despesa[];
  metas: Meta[];
  totalReceitas: number;
  totalDespesas: number;
}

interface Achievement {
  id: string;
  emoji: string;
  title: string;
  description: string;
  unlocked: boolean;
}

const Conquistas = ({ receitas, despesas, metas, totalReceitas, totalDespesas }: Props) => {
  // Calculate achievements based on real data
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  // Months with any data
  const monthsWithData = new Set<string>();
  receitas.forEach(r => monthsWithData.add(r.date.substring(0, 7)));
  despesas.forEach(d => monthsWithData.add(d.date.substring(0, 7)));

  // Consecutive saving months (receitas > despesas)
  const monthBalances = new Map<string, { rec: number; desp: number }>();
  receitas.forEach(r => {
    const k = r.date.substring(0, 7);
    const cur = monthBalances.get(k) || { rec: 0, desp: 0 };
    cur.rec += Number(r.amount);
    monthBalances.set(k, cur);
  });
  despesas.forEach(d => {
    const k = d.date.substring(0, 7);
    const cur = monthBalances.get(k) || { rec: 0, desp: 0 };
    cur.desp += Number(d.amount);
    monthBalances.set(k, cur);
  });

  const sortedMonths = Array.from(monthBalances.keys()).sort();
  let consecutiveSaving = 0;
  let maxConsecutiveSaving = 0;
  for (const m of sortedMonths) {
    const b = monthBalances.get(m)!;
    if (b.rec > b.desp) {
      consecutiveSaving++;
      maxConsecutiveSaving = Math.max(maxConsecutiveSaving, consecutiveSaving);
    } else {
      consecutiveSaving = 0;
    }
  }

  // Goals completed
  const goalsCompleted = metas.filter(m => Number(m.current_amount) >= Number(m.target_amount)).length;

  // All despesas paid
  const allPaid = despesas.length > 0 && despesas.every(d => d.paid);

  // First receita added
  const hasReceita = receitas.length >= 1;
  const hasDespesa = despesas.length >= 1;
  const hasMeta = metas.length >= 1;

  const achievements: Achievement[] = [
    {
      id: "first-income",
      emoji: "💰",
      title: "Primeira receita",
      description: "Adicionou sua primeira receita",
      unlocked: hasReceita,
    },
    {
      id: "first-expense",
      emoji: "📝",
      title: "Controle iniciado",
      description: "Registrou sua primeira despesa",
      unlocked: hasDespesa,
    },
    {
      id: "first-goal",
      emoji: "🎯",
      title: "Sonhador",
      description: "Criou sua primeira meta financeira",
      unlocked: hasMeta,
    },
    {
      id: "1-month",
      emoji: "🏆",
      title: "1 mês organizado",
      description: "Dados registrados em pelo menos 1 mês",
      unlocked: monthsWithData.size >= 1,
    },
    {
      id: "3-months",
      emoji: "🔥",
      title: "3 meses organizando",
      description: "Dados registrados em 3 meses diferentes",
      unlocked: monthsWithData.size >= 3,
    },
    {
      id: "goal-reached",
      emoji: "🏆",
      title: "Primeira meta atingida",
      description: "Completou 100% de uma meta",
      unlocked: goalsCompleted >= 1,
    },
    {
      id: "3-months-saving",
      emoji: "🏆",
      title: "3 meses economizando",
      description: "Economizou por 3 meses consecutivos",
      unlocked: maxConsecutiveSaving >= 3,
    },
    {
      id: "all-paid",
      emoji: "✅",
      title: "Contas em dia",
      description: "Todas as despesas estão pagas",
      unlocked: allPaid,
    },
    {
      id: "positive-balance",
      emoji: "📈",
      title: "Saldo positivo",
      description: "Receitas maiores que despesas",
      unlocked: totalReceitas > totalDespesas && totalReceitas > 0,
    },
    {
      id: "5-goals",
      emoji: "⭐",
      title: "Planejador master",
      description: "Criou 5 ou mais metas",
      unlocked: metas.length >= 5,
    },
  ];

  const unlocked = achievements.filter(a => a.unlocked);
  const locked = achievements.filter(a => !a.unlocked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.6 }}
      className="bg-card rounded-xl p-5 border border-border shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <Trophy className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-base">Conquistas</h3>
        <span className="ml-auto text-xs text-muted-foreground">
          {unlocked.length}/{achievements.length} desbloqueadas
        </span>
      </div>

      {unlocked.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
          {unlocked.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-primary/5 border border-primary/20 text-center"
            >
              <span className="text-2xl">{a.emoji}</span>
              <p className="text-xs font-semibold leading-tight">{a.title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{a.description}</p>
            </motion.div>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {locked.map((a) => (
            <div
              key={a.id}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl bg-muted/30 border border-border text-center opacity-50"
            >
              <span className="text-2xl grayscale">🔒</span>
              <p className="text-xs font-semibold leading-tight">{a.title}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{a.description}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default Conquistas;
