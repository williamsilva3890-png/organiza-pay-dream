import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { MessageCircle, ShieldCheck, Users, Gift } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ChatPanel from "@/components/chat/ChatPanel";
import FriendsTab from "@/components/chat/FriendsTab";
import ReferralTab from "@/components/chat/ReferralTab";
import type { UserProfile } from "@/components/chat/ChatPanel";

const ChatPage = () => {
  const { user } = useAuth();
  const { isAdmin } = useAdmin();
  const [displayName, setDisplayName] = useState("");
  const [profiles, setProfiles] = useState<Map<string, UserProfile>>(new Map());

  const fetchProfiles = async () => {
    if (!user) return;
    const { data: allProfiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url");
    if (allProfiles) {
      const profileMap = new Map<string, UserProfile>();
      allProfiles.forEach(p => profileMap.set(p.user_id, p as UserProfile));
      setProfiles(profileMap);
    }
  };

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
    fetchProfiles();
  }, [user]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 pb-4 border-b border-border mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <MessageCircle className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Chat</h1>
          <p className="text-xs text-muted-foreground">Converse com amigos e administração</p>
        </div>
      </div>

      <Tabs defaultValue="amigos" className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto gap-1 mb-4">
          <TabsTrigger value="amigos" className="gap-1.5 text-xs">
            <Users className="w-3.5 h-3.5" />
            Amigos
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
          <FriendsTab
            user={user}
            isAdmin={isAdmin}
            displayName={displayName}
            profiles={profiles}
            refreshProfiles={fetchProfiles}
          />
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
