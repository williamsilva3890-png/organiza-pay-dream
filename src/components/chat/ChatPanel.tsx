import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  user_id: string;
  user_name: string | null;
  user_email: string | null;
  message: string;
  created_at: string;
  chat_type: string;
}

interface UserProfile {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface ChatPanelProps {
  chatType: string;
  user: any;
  isAdmin: boolean;
  displayName: string;
  profiles: Map<string, UserProfile>;
}

const ChatPanel = ({ chatType, user, isAdmin, displayName, profiles }: ChatPanelProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;

    const fetchMessages = async () => {
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("chat_type", chatType)
        .order("created_at", { ascending: true })
        .limit(200);
      if (data) setMessages(data as ChatMessage[]);
    };
    fetchMessages();

    const channel = supabase
      .channel(`chat-${chatType}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `chat_type=eq.${chatType}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as ChatMessage]);
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "chat_messages" },
        (payload) => {
          setMessages((prev) => prev.filter((m) => m.id !== (payload.old as any).id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, chatType]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !user) return;
    setSending(true);
    const msgText = newMessage.trim();
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      user_name: displayName,
      user_email: user.email,
      message: msgText,
      chat_type: chatType,
    } as any);
    if (error) {
      toast.error("Erro ao enviar mensagem");
    } else {
      setNewMessage("");
      // Notify admin when user sends support message
      if (chatType.startsWith("admin-") && !isAdmin) {
        supabase.functions.invoke("send-push", {
          body: {
            type: "to_admin",
            title: `💬 Nova mensagem de ${displayName}`,
            body: msgText.slice(0, 100),
            url: "/dashboard/admin",
          },
        }).catch(() => {});
      }
    }
    setSending(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("chat_messages").delete().eq("id", id);
  };

  const getInitials = (name: string | null) =>
    (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  const getProfile = (userId: string) => profiles.get(userId);

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)]">
      <ScrollArea className="flex-1 pr-2">
        <div className="space-y-3 pb-4">
          <AnimatePresence initial={false}>
            {messages.map((msg) => {
              const isMe = msg.user_id === user?.id;
              const profile = getProfile(msg.user_id);
              const avatarUrl = profile?.avatar_url;
              const name = profile?.display_name || msg.user_name;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}
                >
                  <Avatar className="w-8 h-8 shrink-0">
                    {avatarUrl && <AvatarImage src={avatarUrl} alt={name || "User"} />}
                    <AvatarFallback className={`text-xs font-bold ${isMe ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`max-w-[75%] ${isMe ? "items-end" : "items-start"}`}>
                    <div className={`flex items-center gap-2 mb-0.5 ${isMe ? "flex-row-reverse" : ""}`}>
                      <span className={`text-[11px] font-semibold ${isMe ? "text-primary" : "text-foreground"}`}>
                        {isMe ? "Você" : name || "Usuário"}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(msg.created_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                      {(isMe || isAdmin) && (
                        <button onClick={() => handleDelete(msg.id)} className="text-destructive/50 hover:text-destructive" title="Apagar para todos">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <div
                      className={`rounded-2xl px-3 py-2 text-sm ${
                        isMe
                          ? "bg-primary text-primary-foreground rounded-tr-md"
                          : "bg-muted rounded-tl-md"
                      }`}
                    >
                      {msg.message}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="flex gap-2 pt-4 border-t border-border">
        <Input
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="flex-1 rounded-xl"
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          disabled={sending}
        />
        <Button onClick={handleSend} disabled={sending || !newMessage.trim()} size="icon" className="rounded-xl shrink-0">
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
};

export default ChatPanel;
export type { UserProfile };
