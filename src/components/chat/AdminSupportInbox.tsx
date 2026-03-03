import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ChatPanel from "@/components/chat/ChatPanel";
import type { UserProfile } from "@/components/chat/ChatPanel";

interface SupportThread {
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  lastMessage: string;
  lastMessageAt: string;
}

interface AdminSupportInboxProps {
  user: any;
  isAdmin: boolean;
  displayName: string;
  profiles: Map<string, UserProfile>;
}

const AdminSupportInbox = ({ user, isAdmin, displayName, profiles }: AdminSupportInboxProps) => {
  const [threads, setThreads] = useState<SupportThread[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !isAdmin) return;

    const fetchThreads = async () => {
      setLoading(true);
      // Get all admin-* chat messages to find unique users
      const { data } = await supabase
        .from("chat_messages")
        .select("*")
        .like("chat_type", "admin-%")
        .order("created_at", { ascending: false })
        .limit(1000);

      if (data) {
        const threadMap = new Map<string, SupportThread>();
        data.forEach((msg: any) => {
          // Extract userId from chat_type "admin-{userId}"
          const threadUserId = msg.chat_type.replace("admin-", "");
          if (!threadMap.has(threadUserId)) {
            const profile = profiles.get(threadUserId);
            threadMap.set(threadUserId, {
              userId: threadUserId,
              displayName: profile?.display_name || msg.user_name || "Usuário",
              avatarUrl: profile?.avatar_url || null,
              lastMessage: msg.message,
              lastMessageAt: msg.created_at,
            });
          }
        });
        setThreads(Array.from(threadMap.values()));
      }
      setLoading(false);
    };

    fetchThreads();

    // Listen for new support messages
    const channel = supabase
      .channel("admin-support-inbox")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages" },
        (payload) => {
          const msg = payload.new as any;
          if (msg.chat_type?.startsWith("admin-")) {
            const threadUserId = msg.chat_type.replace("admin-", "");
            setThreads((prev) => {
              const profile = profiles.get(threadUserId);
              const updated = prev.filter((t) => t.userId !== threadUserId);
              return [
                {
                  userId: threadUserId,
                  displayName: profile?.display_name || msg.user_name || "Usuário",
                  avatarUrl: profile?.avatar_url || null,
                  lastMessage: msg.message,
                  lastMessageAt: msg.created_at,
                },
                ...updated,
              ];
            });
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, isAdmin, profiles]);

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  if (selectedUserId) {
    const thread = threads.find((t) => t.userId === selectedUserId);
    return (
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-3 gap-1.5"
          onClick={() => setSelectedUserId(null)}
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar
        </Button>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <Avatar className="w-8 h-8">
            {thread?.avatarUrl && <AvatarImage src={thread.avatarUrl} />}
            <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
              {getInitials(thread?.displayName || "U")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-semibold">{thread?.displayName}</p>
            <p className="text-[10px] text-muted-foreground">Suporte individual</p>
          </div>
        </div>
        <ChatPanel
          chatType={`admin-${selectedUserId}`}
          user={user}
          isAdmin={isAdmin}
          displayName={displayName}
          profiles={profiles}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <MessageCircle className="w-5 h-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">Conversas de Suporte</h3>
          <p className="text-[10px] text-muted-foreground">
            {threads.length} conversa(s) ativa(s)
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-8">Carregando...</p>
      ) : threads.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">Nenhuma conversa de suporte ainda.</p>
      ) : (
        <ScrollArea className="h-[calc(100vh-18rem)]">
          <div className="space-y-1">
            {threads.map((thread) => (
              <button
                key={thread.userId}
                onClick={() => setSelectedUserId(thread.userId)}
                className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors text-left"
              >
                <Avatar className="w-10 h-10 shrink-0">
                  {thread.avatarUrl && <AvatarImage src={thread.avatarUrl} />}
                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                    {getInitials(thread.displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{thread.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{thread.lastMessage}</p>
                </div>
                <span className="text-[10px] text-muted-foreground shrink-0">
                  {new Date(thread.lastMessageAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  );
};

export default AdminSupportInbox;
