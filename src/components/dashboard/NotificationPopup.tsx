import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Bell, TrendingUp, TrendingDown, Target } from "lucide-react";

interface Props {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  metasCount: number;
}

const NotificationPopup = ({ totalReceitas, totalDespesas, saldo, metasCount }: Props) => {
  const [open, setOpen] = useState(false);

  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      const todayKey = `notif-${now.toISOString().slice(0, 10)}`;

      if (hour === 23 && minute < 5 && !localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, "1");
        setOpen(true);

        // Push notification
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("📊 Resumo do dia - OrganizaPay", {
            body: `Saldo: ${fmt(saldo)} | Receitas: ${fmt(totalReceitas)} | Despesas: ${fmt(totalDespesas)}`,
            icon: "/favicon.ico",
          });
        }
      }
    };

    // Request permission on mount
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    checkTime();
    const interval = setInterval(checkTime, 30000); // check every 30s
    return () => clearInterval(interval);
  }, [totalReceitas, totalDespesas, saldo]);

  return (
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
  );
};

export default NotificationPopup;
