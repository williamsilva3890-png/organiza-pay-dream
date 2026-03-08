import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export function usePushSubscription(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return;

    const subscribe = async () => {
      try {
        // Request permission if not yet decided
        if (Notification.permission === "default") {
          const result = await Notification.requestPermission();
          if (result !== "granted") return;
        }

        if (Notification.permission !== "granted") return;

        const reg = await navigator.serviceWorker.ready;
        const existingSub = await reg.pushManager.getSubscription();
        if (existingSub) {
          await saveSubscription(userId, existingSub);
          return;
        }

        const { data, error } = await supabase.functions.invoke("get-vapid-key");
        if (error || !data?.publicKey) {
          console.log("Could not get VAPID key:", error);
          return;
        }

        const applicationServerKey = urlBase64ToUint8Array(data.publicKey) as unknown as BufferSource;
        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey,
        });

        await saveSubscription(userId, subscription);
        console.log("Push subscription successful");
      } catch (err) {
        console.log("Push subscription failed:", err);
      }
    };

    // Small delay to let the app load first
    const timer = setTimeout(subscribe, 2000);
    return () => clearTimeout(timer);
  }, [userId]);
}

async function saveSubscription(userId: string, subscription: PushSubscription) {
  const subJson = subscription.toJSON();
  if (!subJson.endpoint || !subJson.keys?.p256dh || !subJson.keys?.auth) return;

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
