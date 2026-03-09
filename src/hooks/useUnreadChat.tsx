import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Shows unread indicator only when someone sends a message
 * directly relevant to the current user:
 * - admin-{userId} (support chat directed at this user)
 * - friends-group (group chat)
 * - dm-* chats where the user is a participant
 */
export const useUnreadChat = (userId: string | undefined, isAdmin: boolean = false) => {
  const [hasUnread, setHasUnread] = useState(false);
  const isOnChatPage = useRef(false);

  useEffect(() => {
    if (!userId) return;

    const storageKey = `organizapay-last-chat-seen-${userId}`;

    const isRelevantChat = (chatType: string) => {
      // Admin sees all support chats
      if (isAdmin && chatType.startsWith("admin-")) return true;
      // Support chat directed at this user
      if (chatType === `admin-${userId}`) return true;
      // Group chat
      if (chatType === "friends-group") return true;
      // DM where this user is a participant
      if (chatType.startsWith("dm-") && chatType.includes(userId)) return true;
      return false;
    };

    const checkUnread = async () => {
      if (isOnChatPage.current) return;
      const lastSeen = localStorage.getItem(storageKey) || "1970-01-01T00:00:00Z";

      const { count: supportCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .eq("chat_type", `admin-${userId}`)
        .gt("created_at", lastSeen);

      const { count: groupCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .eq("chat_type", "friends-group")
        .gt("created_at", lastSeen);

      const { count: dmCount } = await supabase
        .from("chat_messages")
        .select("id", { count: "exact", head: true })
        .neq("user_id", userId)
        .like("chat_type", `dm-%${userId}%`)
        .gt("created_at", lastSeen);

      const total = (supportCount ?? 0) + (groupCount ?? 0) + (dmCount ?? 0);
      console.log("[UnreadChat] check:", { supportCount, groupCount, dmCount, total, lastSeen });
      setHasUnread(total > 0);
    };

    checkUnread();

    const channel = supabase
      .channel(`unread-chat-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as any;
          console.log("[UnreadChat] realtime msg:", msg.chat_type, "from:", msg.user_id, "relevant:", isRelevantChat(msg.chat_type), "isMe:", msg.user_id === userId, "onChat:", isOnChatPage.current);
          if (msg.user_id !== userId && isRelevantChat(msg.chat_type) && !isOnChatPage.current) {
            setHasUnread(true);
          }
        }
      )
      .subscribe((status) => {
        console.log("[UnreadChat] channel status:", status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const markAsSeen = () => {
    if (!userId) return;
    const storageKey = `organizapay-last-chat-seen-${userId}`;
    localStorage.setItem(storageKey, new Date().toISOString());
    setHasUnread(false);
    isOnChatPage.current = true;
  };

  const leaveChatPage = () => {
    isOnChatPage.current = false;
  };

  return { hasUnread, markAsSeen, leaveChatPage };
};
