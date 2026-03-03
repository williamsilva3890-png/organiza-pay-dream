import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserPlus, MessageCircle, ArrowLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ChatPanel from "./ChatPanel";
import type { UserProfile } from "./ChatPanel";

interface Friend {
  id: string;
  user_id: string;
  friend_id: string;
  created_at: string;
}

interface FriendsTabProps {
  user: any;
  isAdmin: boolean;
  displayName: string;
  profiles: Map<string, UserProfile>;
  refreshProfiles: () => void;
}

const FriendsTab = ({ user, isAdmin, displayName, profiles, refreshProfiles }: FriendsTabProps) => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendCode, setFriendCode] = useState("");
  const [adding, setAdding] = useState(false);
  const [activeDm, setActiveDm] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFriends = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("friends")
      .select("*")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);
    if (data) setFriends(data as Friend[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchFriends();
  }, [user]);

  const getFriendUserId = (f: Friend) => f.user_id === user.id ? f.friend_id : f.user_id;

  const getDmChatType = (friendUserId: string) => {
    const ids = [user.id, friendUserId].sort();
    return `dm:${ids[0]}:${ids[1]}`;
  };

  const handleAddFriend = async () => {
    if (!friendCode.trim() || !user) return;
    setAdding(true);

    // Find user by referral code
    const codeUpper = friendCode.trim().toUpperCase();
    const { data: refData } = await supabase
      .from("referral_codes")
      .select("user_id")
      .eq("code", codeUpper)
      .maybeSingle();

    if (!refData) {
      toast.error("Código não encontrado");
      setAdding(false);
      return;
    }

    if (refData.user_id === user.id) {
      toast.error("Você não pode adicionar a si mesmo");
      setAdding(false);
      return;
    }

    // Check if already friends
    const existingFriend = friends.find(
      f => getFriendUserId(f) === refData.user_id
    );
    if (existingFriend) {
      toast.error("Vocês já são amigos!");
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("friends").insert({
      user_id: user.id,
      friend_id: refData.user_id,
    } as any);

    if (error) {
      toast.error("Erro ao adicionar amigo");
    } else {
      toast.success("Amigo adicionado! 🎉");
      setFriendCode("");
      fetchFriends();
      refreshProfiles();
    }
    setAdding(false);
  };

  const handleRemoveFriend = async (friendRecord: Friend) => {
    await supabase.from("friends").delete().eq("id", friendRecord.id);
    toast.success("Amigo removido");
    setActiveDm(null);
    fetchFriends();
  };

  const getInitials = (name: string | null) =>
    (name || "U").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

  // If a DM is active, show the chat
  if (activeDm) {
    const friendUserId = activeDm;
    const profile = profiles.get(friendUserId);
    const friendName = profile?.display_name || "Amigo";

    return (
      <div>
        <button
          onClick={() => setActiveDm(null)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar para amigos
        </button>
        <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
          <Avatar className="w-8 h-8">
            {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={friendName} />}
            <AvatarFallback className="text-xs font-bold bg-primary/10">{getInitials(friendName)}</AvatarFallback>
          </Avatar>
          <span className="font-semibold text-sm">{friendName}</span>
        </div>
        <ChatPanel
          chatType={getDmChatType(friendUserId)}
          user={user}
          isAdmin={isAdmin}
          displayName={displayName}
          profiles={profiles}
        />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Add friend by code */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-primary/10 to-accent/10 rounded-xl p-4 border border-primary/20">
        <div className="flex items-center gap-2 mb-3">
          <UserPlus className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-sm">Adicionar amigo por código</h3>
        </div>
        <div className="flex gap-2">
          <Input
            value={friendCode}
            onChange={(e) => setFriendCode(e.target.value)}
            placeholder="Cole o código do amigo (ex: ORG1A2B3C)"
            className="flex-1 rounded-xl"
            onKeyDown={(e) => e.key === "Enter" && handleAddFriend()}
          />
          <Button onClick={handleAddFriend} disabled={adding || !friendCode.trim()} size="sm" className="gap-1.5 rounded-xl">
            <UserPlus className="w-4 h-4" />
            Adicionar
          </Button>
        </div>
      </motion.div>

      {/* Friends list */}
      <div>
        <h3 className="font-display font-bold text-sm mb-3">Seus amigos ({friends.length})</h3>
        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <UserPlus className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Nenhum amigo ainda.</p>
            <p className="text-xs">Peça o código de indicação de um amigo e adicione acima!</p>
          </div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {friends.map((f) => {
                const friendUserId = getFriendUserId(f);
                const profile = profiles.get(friendUserId);
                const friendName = profile?.display_name || "Amigo";
                return (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border hover:border-primary/30 transition-colors"
                  >
                    <Avatar className="w-9 h-9">
                      {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={friendName} />}
                      <AvatarFallback className="text-xs font-bold bg-primary/10">{getInitials(friendName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{friendName}</p>
                      <p className="text-[10px] text-muted-foreground">
                        Amigo desde {new Date(f.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="gap-1 text-xs"
                      onClick={() => setActiveDm(friendUserId)}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive/50 hover:text-destructive"
                      onClick={() => handleRemoveFriend(f)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default FriendsTab;
