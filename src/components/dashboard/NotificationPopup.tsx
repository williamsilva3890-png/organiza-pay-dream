import { useEffect, useRef } from "react";
import { toast } from "sonner";

interface Props {
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
  metasCount: number;
  despesasPendentes?: number;
  expiresAt?: string | null;
}

const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

const NotificationPopup = ({ totalReceitas, totalDespesas, saldo, metasCount, despesasPendentes = 0, expiresAt }: Props) => {
  const prevDespesas = useRef(totalDespesas);
  const prevReceitas = useRef(totalReceitas);
  const initialized = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Subscription expiration alerts
  useEffect(() => {
    if (!expiresAt) return;
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const todayKey = `exp-notif-${now.toISOString().slice(0, 10)}`;

    if (localStorage.getItem(todayKey)) return;

    if (diffDays === 1) {
      localStorage.setItem(todayKey, "1");
      const msg = "Seu plano Premium vence amanhã! Renove para não perder os benefícios.";
      toast.warning("⏰ Plano vencendo amanhã!", { description: msg, duration: 10000 });
      sendPushNotification("⏰ Plano vencendo amanhã!", msg);
    } else if (diffDays <= 0) {
      localStorage.setItem(todayKey, "1");
      const msg = "Seu plano Premium venceu! Renove agora para continuar usando todos os recursos.";
      toast.error("🚨 Plano Premium vencido!", { description: msg, duration: 10000 });
      sendPushNotification("🚨 Plano Premium vencido!", msg);
    }
  }, [expiresAt]);

  // Triggered notifications - only when values change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      prevDespesas.current = totalDespesas;
      prevReceitas.current = totalReceitas;
      return;
    }

    if (totalDespesas > totalReceitas && totalReceitas > 0 && prevDespesas.current <= totalReceitas) {
      const excess = totalDespesas - totalReceitas;
      const msg = `Opa! Você está gastando ${fmt(excess)} além do seu limite de renda!`;
      toast.error("⚠️ Gastos acima da renda!", { description: msg, duration: 8000 });
      sendPushNotification("⚠️ Gastos acima da renda!", msg);
    }

    if (totalDespesas > totalReceitas * 0.8 && totalDespesas <= totalReceitas && totalReceitas > 0 && prevDespesas.current <= totalReceitas * 0.8) {
      const pct = Math.round((totalDespesas / totalReceitas) * 100);
      const msg = `Você já usou ${pct}% da sua renda. Reste apenas ${fmt(totalReceitas - totalDespesas)} disponível.`;
      toast.warning("🔥 Quase no limite!", { description: msg, duration: 6000 });
      sendPushNotification("🔥 Quase no limite!", msg);
    }

    if (totalReceitas > prevReceitas.current && prevReceitas.current > 0) {
      const diff = totalReceitas - prevReceitas.current;
      toast.success("💰 Nova renda adicionada!", { description: `+${fmt(diff)} adicionado à sua renda total.`, duration: 4000 });
    }

    prevDespesas.current = totalDespesas;
    prevReceitas.current = totalReceitas;
  }, [totalDespesas, totalReceitas]);

  // Daily summary at 23:00
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      const todayKey = `notif-${now.toISOString().slice(0, 10)}`;
      if (now.getHours() === 23 && now.getMinutes() < 5 && !localStorage.getItem(todayKey)) {
        localStorage.setItem(todayKey, "1");
        const msg = `Saldo: ${fmt(saldo)} | Receitas: ${fmt(totalReceitas)} | Despesas: ${fmt(totalDespesas)}`;
        toast.info("📊 Resumo do dia", { description: msg, duration: 10000 });
        sendPushNotification("📊 Resumo do dia - OrganizaPay", msg);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 30000);
    return () => clearInterval(interval);
  }, [totalReceitas, totalDespesas, saldo]);

  return null;
};

function sendPushNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export default NotificationPopup;
