import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shows unread indicator only when someone sends a message
 * directly relevant to the current user:
 * - admin-{userId} (support chat directed at this user)
 * - friends-group (group chat)
 * - dm-* chats where the user is a participant
 */
export const useUnreadChat = (userId: string | undefined) => {
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `organizapay-last-chat-seen-${userId}`;

    const isRelevantChat = (chatType: string) => {
      // Support chat directed at this user
      if (chatType === `admin-${userId}`) return true;
      // Group chat
      if (chatType === "friends-group") return true;
      // DM where this user is a participant (format: dm-{id1}-{id2})
      if (chatType.startsWith("dm-") && chatType.includes(userId)) return true;
      return false;
    };

    const checkUnread = async () => {
      const lastSeen = localStorage.getItem(storageKey) || "1970-01-01T00:00:00Z";

      // Check support messages for this user
      const { count: supportCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .eq("chat_type", `admin-${userId}`)
        .gt("created_at", lastSeen);

      // Check group messages
      const { count: groupCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .eq("chat_type", "friends-group")
        .gt("created_at", lastSeen);

      // Check DM messages containing this user's ID
      const { count: dmCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .like("chat_type", `dm-%${userId}%`)
        .gt("created_at", lastSeen);

      setHasUnread(((supportCount ?? 0) + (groupCount ?? 0) + (dmCount ?? 0)) > 0);
    };

    checkUnread();

    const channel = supabase
      .channel("unread-chat-indicator")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.user_id !== userId && isRelevantChat(msg.chat_type)) {
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
