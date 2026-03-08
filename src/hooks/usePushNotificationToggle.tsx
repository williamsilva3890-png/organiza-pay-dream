import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotificationToggle(userId: string | undefined) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported("serviceWorker" in navigator && "PushManager" in window);
  }, []);

  useEffect(() => {
    if (!supported || !userId) return;
    const check = async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setIsSubscribed(!!sub);
    };
    check();
  }, [supported, userId]);

  const toggle = useCallback(async () => {
    if (!supported || !userId) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const existingSub = await reg.pushManager.getSubscription();

      if (existingSub) {
        // Unsubscribe
        await existingSub.unsubscribe();
        await (supabase as any).from("push_subscriptions").delete().eq("user_id", userId).eq("endpoint", existingSub.endpoint);
        setIsSubscribed(false);
        toast.success("Notificações desativadas");
      } else {
        // Request permission first
        if (Notification.permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") {
            toast.error("Permissão de notificação negada. Ative nas configurações do navegador.");
            return;
          }
        }
        if (Notification.permission !== "granted") {
          toast.error("Permissão de notificação bloqueada. Ative nas configurações do navegador.");
          return;
        }

        // Subscribe
        const { data, error } = await supabase.functions.invoke("get-vapid-key");
        if (error || !data?.publicKey) {
          toast.error("Erro ao obter chave de notificação");
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(data.publicKey) as unknown as BufferSource;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        const subJson = subscription.toJSON();
        if (subJson.endpoint && subJson.keys?.p256dh && subJson.keys?.auth) {
          await (supabase as any).from("push_subscriptions").upsert(
            {
              user_id: userId,
              endpoint: subJson.endpoint,
              p256dh_key: subJson.keys.p256dh,
              auth_key: subJson.keys.auth,
            },
            { onConflict: "user_id,endpoint" }
          );
        }
        setIsSubscribed(true);
        toast.success("Notificações ativadas! 🔔");
      }
    } catch (err: any) {
      if (err?.name === "NotAllowedError") {
        toast.error("Permissão de notificação bloqueada. Ative nas configurações do navegador.");
      } else {
        toast.error("Erro ao alterar notificações");
      }
      console.log("Push toggle error:", err);
    } finally {
      setLoading(false);
    }
  }, [supported, userId]);

  return { isSubscribed, loading, supported, toggle };
}
