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

const todayKey = (prefix: string) => `${prefix}-${new Date().toISOString().slice(0, 10)}`;

const wasShownToday = (key: string) => localStorage.getItem(todayKey(key)) === "1";
const markShownToday = (key: string) => localStorage.setItem(todayKey(key), "1");

const NotificationPopup = ({ totalReceitas, totalDespesas, saldo, metasCount, despesasPendentes = 0, expiresAt }: Props) => {
  const initialized = useRef(false);

  // Request notification permission on mount
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    registerServiceWorker();
  }, []);

  // Subscription expiration alerts — once per day
  useEffect(() => {
    if (!expiresAt) return;
    const expDate = new Date(expiresAt);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1 && !wasShownToday("exp-notif")) {
      markShownToday("exp-notif");
      const msg = "Seu plano Premium vence amanhã! Renove para não perder os benefícios.";
      toast.warning("⏰ Plano vencendo amanhã!", { description: msg, duration: 10000 });
      sendPushNotification("⏰ Plano vencendo amanhã!", msg);
    } else if (diffDays <= 0 && !wasShownToday("exp-notif")) {
      markShownToday("exp-notif");
      const msg = "Seu plano Premium venceu! Renove agora para continuar usando todos os recursos.";
      toast.error("🚨 Plano Premium vencido!", { description: msg, duration: 10000 });
      sendPushNotification("🚨 Plano Premium vencido!", msg);
    }
  }, [expiresAt]);

  // Spending alerts — once per day each
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
    }

    if (totalReceitas <= 0) return;

    // Over budget alert — once per day
    if (totalDespesas > totalReceitas && !wasShownToday("notif-over-budget")) {
      markShownToday("notif-over-budget");
      const excess = totalDespesas - totalReceitas;
      const msg = `Opa! Você está gastando ${fmt(excess)} além do seu limite de renda!`;
      toast.error("⚠️ Gastos acima da renda!", { description: msg, duration: 8000 });
      sendPushNotification("⚠️ Gastos acima da renda!", msg);
    }

    // Near limit alert — once per day
    if (totalDespesas > totalReceitas * 0.8 && totalDespesas <= totalReceitas && !wasShownToday("notif-near-limit")) {
      markShownToday("notif-near-limit");
      const pct = Math.round((totalDespesas / totalReceitas) * 100);
      const msg = `Você já usou ${pct}% da sua renda. Resta apenas ${fmt(totalReceitas - totalDespesas)} disponível.`;
      toast.warning("🔥 Quase no limite!", { description: msg, duration: 6000 });
      sendPushNotification("🔥 Quase no limite!", msg);
    }
  }, [totalDespesas, totalReceitas]);

  // Daily reminder: "Já adicionou seus gastos hoje?" — once per day on app open
  useEffect(() => {
    if (!wasShownToday("notif-daily-reminder")) {
      markShownToday("notif-daily-reminder");
      // Small delay so it doesn't clash with other toasts
      const timer = setTimeout(() => {
        toast.info("📝 Já adicionou seus gastos hoje?", {
          description: "Mantenha suas finanças em dia registrando suas despesas diariamente!",
          duration: 8000,
        });
        sendPushNotification("📝 Já adicionou seus gastos hoje?", "Mantenha suas finanças em dia registrando suas despesas diariamente!");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  // Daily summary at 23:00 — once per day
  useEffect(() => {
    const checkTime = () => {
      const now = new Date();
      if (now.getHours() === 23 && now.getMinutes() < 5 && !wasShownToday("notif-summary")) {
        markShownToday("notif-summary");
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
    // Use service worker notification if available (works even when tab is in background)
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: "SHOW_NOTIFICATION",
        title,
        body,
      });
    } else {
      new Notification(title, { body, icon: "/favicon.png", badge: "/icon-192.png" });
    }
  }
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      // Service worker registration failed silently
    });
  }
}

export default NotificationPopup;
