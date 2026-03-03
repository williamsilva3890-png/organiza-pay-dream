import { useEffect, useRef } from "react";
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
  const prevDespesas = useRef(totalDespesas);
  const prevReceitas = useRef(totalReceitas);
  const initialized = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // Triggered notifications - only when values change
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      prevDespesas.current = totalDespesas;
      prevReceitas.current = totalReceitas;
      return;
    }

    // Over budget alert - when expenses just exceeded income
    if (totalDespesas > totalReceitas && totalReceitas > 0 && prevDespesas.current <= totalReceitas) {
      const excess = totalDespesas - totalReceitas;
      const msg = `Opa! Você está gastando ${fmt(excess)} além do seu limite de renda!`;
      toast.error("⚠️ Gastos acima da renda!", { description: msg, duration: 8000 });
      sendPushNotification("⚠️ Gastos acima da renda!", msg);
    }

    // Near limit (>80%) - triggered when crossing threshold
    if (totalDespesas > totalReceitas * 0.8 && totalDespesas <= totalReceitas && totalReceitas > 0 && prevDespesas.current <= totalReceitas * 0.8) {
      const pct = Math.round((totalDespesas / totalReceitas) * 100);
      const msg = `Você já usou ${pct}% da sua renda. Reste apenas ${fmt(totalReceitas - totalDespesas)} disponível.`;
      toast.warning("🔥 Quase no limite!", { description: msg, duration: 6000 });
      sendPushNotification("🔥 Quase no limite!", msg);
    }

    // New income milestone
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

  return null; // No UI - notifications are toasts/push only
};

function sendPushNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(title, { body, icon: "/favicon.ico" });
  }
}

export default NotificationPopup;
