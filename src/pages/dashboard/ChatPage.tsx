import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { Send, Trash2, MessageCircle, ShieldCheck, Users, Gift, Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

const ChatPanel = ({ chatType, user, isAdmin, displayName, profiles }: {
  chatType: string;
  user: any;
  isAdmin: boolean;
  displayName: string;
  profiles: Map<string, UserProfile>;
}) => {
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
    const { error } = await supabase.from("chat_messages").insert({
      user_id: user.id,
      user_name: displayName,
      user_email: user.email,
      message: newMessage.trim(),
      chat_type: chatType,
    } as any);
    if (error) toast.error("Erro ao enviar mensagem");
    else setNewMessage("");
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

const ReferralTab = ({ user }: { user: any }) => {
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Fetch or create referral code
      const { data: existing } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existing) {
        setCode(existing.code);
      } else {
        const newCode = `ORG${user.id.slice(0, 6).toUpperCase()}`;
        await supabase.from("referral_codes").insert({ user_id: user.id, code: newCode } as any);
        setCode(newCode);
      }

      // Fetch referrals
      const { data: refs } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);
      if (refs) setReferrals(refs);
      setLoading(false);
    };
    init();
  }, [user]);

  const handleCopy = () => {
    const shareText = `🎉 Use meu código ${code} ao criar sua conta no OrganizaPay e ganhe benefícios! ${window.location.origin}/login?ref=${code}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const shareText = `🎉 Use meu código ${code} ao criar sua conta no OrganizaPay e ganhe benefícios!`;
    const shareUrl = `${window.location.origin}/login?ref=${code}`;
    if (navigator.share) {
      navigator.share({ title: "OrganizaPay - Indique e Ganhe", text: shareText, url: shareUrl });
    } else {
      handleCopy();
    }
  };

  if (loading) return <div className="text-center text-muted-foreground py-8">Carregando...</div>;

  return (
    <div className="space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-5 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <Gift className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Indique e Ganhe</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Compartilhe seu código com amigos! Ao se cadastrarem com seu código, vocês ganham uma badge especial no perfil. 🏅
        </p>

        <div className="bg-background rounded-lg p-4 border border-border">
          <p className="text-xs text-muted-foreground mb-1">Seu código de indicação</p>
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-lg text-primary tracking-wider">{code}</span>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 mt-4">
          <Button onClick={handleCopy} variant="outline" size="sm" className="gap-1.5 flex-1">
            <Copy className="w-4 h-4" /> Copiar Link
          </Button>
          <Button onClick={handleShare} size="sm" className="gap-1.5 flex-1">
            <Share2 className="w-4 h-4" /> Compartilhar
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="bg-card rounded-xl p-5 border border-border">
        <h4 className="font-display font-bold text-sm mb-3">Suas indicações ({referrals.length})</h4>
        {referrals.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhuma indicação ainda. Compartilhe seu código!</p>
        ) : (
          <div className="space-y-2">
            {referrals.map((r) => (
              <div key={r.id} className="flex items-center gap-2 text-sm bg-muted/50 rounded-lg px-3 py-2">
                <span className="text-primary">🏅</span>
                <span>Amigo indicado</span>
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {new Date(r.created_at).toLocaleDateString("pt-BR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

const ChatPage = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [displayName, setDisplayName] = useState("");
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());

  useEffect(() => {
    if (!user) return;

    const fetchProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", user.id)
        .maybeSingle();
      setDisplayName(data?.display_name || "Usuário");
    };
    fetchProfile();

    // Fetch all profiles for avatars (admin can see all, users see via chat)
    const fetchProfiles = async () => {
      // We'll build profiles from chat messages user_ids
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("user_id")
        .limit(500);
      
      if (msgs) {
        const uniqueIds = [...new Set(msgs.map(m => m.user_id))];
        // Fetch profiles one by one for non-admin (RLS)
        const profileMap = new Map<string, UserProfile>();
        
        // For current user's profile
        const { data: myProfile } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .eq("user_id", user.id)
          .maybeSingle();
        if (myProfile) profileMap.set(myProfile.user_id, myProfile as UserProfile);
        
        // For admin, fetch all
        if (isAdmin) {
          const { data: allProfiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url");
          if (allProfiles) {
            allProfiles.forEach(p => profileMap.set(p.user_id, p as UserProfile));
          }
        }
        
        setProfiles(profileMap);
      }
    };
    fetchProfiles();
  }, [user, isAdmin]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Chat</h1>
          <p className="text-xs text-muted-foreground">Converse e indique amigos</p>
        </div>
      </div>

      <Tabs defaultValue="amigos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto gap-1 mb-4">
          <TabsTrigger value="amigos" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            Chat Amigos
          </TabsTrigger>
          <TabsTrigger value="admin" className="gap-1.5 text-xs">
            <ShieldCheck className="w-3.5 h-3.5" />
            Chat ADM
          </TabsTrigger>
          <TabsTrigger value="indicar" className="gap-1.5 text-xs">
            <Gift className="w-3.5 h-3.5" />
            Indicar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="amigos">
          <ChatPanel chatType="friends" user={user} isAdmin={isAdmin} displayName={displayName} profiles={profiles} />
        </TabsContent>

        <TabsContent value="admin">
          <ChatPanel chatType="admin" user={user} isAdmin={isAdmin} displayName={displayName} profiles={profiles} />
        </TabsContent>

        <TabsContent value="indicar">
          <ReferralTab user={user} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatPage;
