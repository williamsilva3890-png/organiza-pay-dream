import { Progress } from "@/components/ui/progress";
import { Target } from "lucide-react";

const goals = [
  {
    id: 1,
    title: "Reserva de emergência",
    current: 8500,
    target: 15000,
    deadline: "Dez 2026",
  },
  {
    id: 2,
    title: "Viagem de férias",
    current: 2200,
    target: 5000,
    deadline: "Jul 2026",
  },
  {
    id: 3,
    title: "Novo equipamento",
    current: 1800,
    target: 3000,
    deadline: "Abr 2026",
  },
];

const GoalsProgress = () => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-base">Metas financeiras</h3>
      </div>
      <div className="space-y-5">
        {goals.map((goal) => {
          const pct = Math.round((goal.current / goal.target) * 100);
          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-sm font-medium">{goal.title}</p>
                <span className="text-xs text-muted-foreground">
                  {goal.deadline}
                </span>
              </div>
              <Progress value={pct} className="h-2.5 mb-1" />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  R${" "}
                  {goal.current.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span>
                  {pct}% de R${" "}
                  {goal.target.toLocaleString("pt-BR", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GoalsProgress;
