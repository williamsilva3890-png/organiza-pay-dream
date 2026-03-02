import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, TrendingDown, Target, AlertTriangle, FileBarChart, Flame, Wallet } from "lucide-react";
import { toast } from "sonner";

interface Props {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  metasCount: number;
  despesasPendentes?: number;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const NotificationPopup = ({ totalReceitas, totalDespesas, saldo, metasCount, despesasPendentes = 0 }: Props) => {
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState<Array<{ id: string; icon: any; title: string; message: string; type: "warning" | "info" | "success" | "danger" }>>([]);

  // Smart notifications engine
  useEffect(() => {
    const newAlerts: typeof alerts = [];

    // 1. Spending beyond income
    if (totalDespesas > totalReceitas && totalReceitas > 0) {
      const excess = totalDespesas - totalReceitas;
      const pct = Math.round((excess / totalReceitas) * 100);
      newAlerts.push({
        id: "over-budget",
        icon: AlertTriangle,
        title: "⚠️ Gastos acima da renda!",
        message: `Você está gastando ${fmt(excess)} (${pct}%) além da sua renda este mês. Considere revisar seus gastos.`,
        type: "danger",
      });
    }

    // 2. Close to limit (>80% of income spent)
    if (totalDespesas > totalReceitas * 0.8 && totalDespesas <= totalReceitas && totalReceitas > 0) {
      const pct = Math.round((totalDespesas / totalReceitas) * 100);
      newAlerts.push({
        id: "near-limit",
        icon: Flame,
        title: "🔥 Quase no limite!",
        message: `Você já usou ${pct}% da sua renda. Reste apenas ${fmt(totalReceitas - totalDespesas)} disponível.`,
        type: "warning",
      });
    }

    // 3. Unpaid bills
    if (despesasPendentes > 0) {
      newAlerts.push({
        id: "unpaid",
        icon: Wallet,
        title: "📋 Contas pendentes",
        message: `Você tem ${despesasPendentes} despesa(s) ainda não paga(s). Não esqueça de quitar!`,
        type: "info",
      });
    }

    // 4. No income registered
    if (totalReceitas === 0) {
      newAlerts.push({
        id: "no-income",
        icon: TrendingUp,
        title: "💡 Cadastre sua renda",
        message: "Você ainda não registrou nenhuma renda este mês. Adicione suas receitas para ter um controle completo.",
        type: "info",
      });
    }

    // 5. Positive savings congratulation
    if (saldo > 0 && totalReceitas > 0 && totalDespesas > 0) {
      const savingsRate = Math.round((saldo / totalReceitas) * 100);
      if (savingsRate >= 30) {
        newAlerts.push({
          id: "great-savings",
          icon: Target,
          title: "🎉 Excelente economia!",
          message: `Parabéns! Você está economizando ${savingsRate}% da sua renda. Continue assim!`,
          type: "success",
        });
      }
    }

    // 6. Report ready notification
    const now = new Date();
    const dayOfMonth = now.getDate();
    if (dayOfMonth >= 28) {
      newAlerts.push({
        id: "report-ready",
        icon: FileBarChart,
        title: "📊 Relatório mensal pronto",
        message: "O mês está acabando! Seu relatório financeiro está pronto para visualização na aba Relatórios.",
        type: "info",
      });
    }

    setAlerts(newAlerts);
  }, [totalReceitas, totalDespesas, saldo, despesasPendentes]);

  // Show smart toasts on mount for critical alerts
  useEffect(() => {
    const shownKey = `alerts-shown-${new Date().toISOString().slice(0, 10)}`;
    if (localStorage.getItem(shownKey)) return;

    const timer = setTimeout(() => {
      alerts.forEach((alert) => {
        if (alert.type === "danger") {
          toast.error(alert.title, { description: alert.message, duration: 6000 });
        } else if (alert.type === "warning") {
          toast.warning(alert.title, { description: alert.message, duration: 5000 });
        }
      });
      if (alerts.some(a => a.type === "danger" || a.type === "warning")) {
        localStorage.setItem(shownKey, "1");
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [alerts]);

  // Daily summary at 23:00
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = `notif-${now.toISOString().slice(0, 10)}`;

      if (hour === 23 && minute < 5 && !localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, "1");
        setOpen(true);

        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("📊 Resumo do dia - OrganizaPay", {
            body: `Saldo: ${fmt(saldo)} | Receitas: ${fmt(totalReceitas)} | Despesas: ${fmt(totalDespesas)}`,
            icon: "/favicon.ico",
          });
        }
      }
    };

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, [totalReceitas, totalDespesas, saldo]);

  const typeStyles: Record<string, string> = {
    danger: "bg-destructive/10 border-destructive/30",
    warning: "bg-warning/10 border-warning/30",
    success: "bg-success/10 border-success/30",
    info: "bg-primary/10 border-primary/30",
  };

  const iconColor: Record<string, string> = {
    danger: "text-destructive",
    warning: "text-warning",
    success: "text-success",
    info: "text-primary",
  };

  return (
    <>
      {/* Alert banner for critical notifications */}
      {alerts.filter(a => a.type === "danger" || a.type === "warning").length > 0 && (
        <div className="space-y-2 mb-4">
          {alerts.filter(a => a.type === "danger" || a.type === "warning").map((alert) => (
            <div key={alert.id} className={`rounded-xl p-4 border ${typeStyles[alert.type]} flex items-start gap-3`}>
              <alert.icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor[alert.type]}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{alert.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Info/success alerts as compact cards */}
      {alerts.filter(a => a.type === "info" || a.type === "success").length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          {alerts.filter(a => a.type === "info" || a.type === "success").map((alert) => (
            <div key={alert.id} className={`rounded-xl p-3 border ${typeStyles[alert.type]} flex items-start gap-2.5`}>
              <alert.icon className={`w-4 h-4 shrink-0 mt-0.5 ${iconColor[alert.type]}`} />
              <div className="min-w-0">
                <p className="text-xs font-semibold">{alert.title}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily summary dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Resumo do dia
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">
              Aqui está o resumo financeiro do seu dia:
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-success/10 rounded-lg p-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-success" />
                <div>
                  <p className="text-xs text-muted-foreground">Receitas</p>
                  <p className="text-sm font-bold text-success">{fmt(totalReceitas)}</p>
                </div>
              </div>
              <div className="bg-destructive/10 rounded-lg p-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-destructive" />
                <div>
                  <p className="text-xs text-muted-foreground">Despesas</p>
                  <p className="text-sm font-bold text-destructive">{fmt(totalDespesas)}</p>
                </div>
              </div>
            </div>
            <div className={`rounded-lg p-3 text-center ${saldo >= 0 ? "bg-success/10" : "bg-destructive/10"}`}>
              <p className="text-xs text-muted-foreground">Saldo</p>
              <p className={`text-lg font-bold ${saldo >= 0 ? "text-success" : "text-destructive"}`}>{fmt(saldo)}</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="w-4 h-4" />
              <span>Você tem {metasCount} meta(s) ativas</span>
            </div>
            <Button onClick={() => setOpen(false)} className="w-full">Entendi!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default NotificationPopup;
