import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Gift, Copy, Check, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion } from "framer-motion";

const ReferralTab = ({ user }: { user: any }) => {
  const [code, setCode] = useState("");
  const [referrals, setReferrals] = useState<any[]>([]);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
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

export default ReferralTab;
