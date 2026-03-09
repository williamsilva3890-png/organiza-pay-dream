import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const useUnreadChat = (userId: string | undefined) => {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `organizapay-last-chat-seen-${userId}`;

    const checkUnread = async () => {
      const lastSeen = localStorage.getItem(storageKey) || "1970-01-01T00:00:00Z";
      const { count } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .gt("created_at", lastSeen);
      setHasUnread((count ?? 0) > 0);
    };

    checkUnread();

    const channel = supabase
      .channel("unread-chat-indicator")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.user_id !== userId) {
            setHasUnread(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsSeen = () => {
    if (!userId) return;
    const storageKey = `organizapay-last-chat-seen-${userId}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setHasUnread(false);
  };

  return { hasUnread, markAsSeen };
};
