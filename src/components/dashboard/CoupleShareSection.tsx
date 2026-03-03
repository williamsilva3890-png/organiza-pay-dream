import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Heart, Copy, Check, UserPlus, Unlink, Users, Shield, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { motion } from "framer-motion";
import type { SharedAccount, Profile } from "@/hooks/useFinanceData";

interface CoupleShareSectionProps {
  user: any;
  isPremium: boolean;
  profileType: string;
  sharedAccount: SharedAccount | null;
  partnerProfile: Profile | null;
  onRefresh: () => void;
}

const CoupleShareSection = ({
  user,
  isPremium,
  profileType,
  sharedAccount,
  partnerProfile,
  onRefresh,
}: CoupleShareSectionProps) => {
  const [inviteCode, setInviteCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const isOwner = sharedAccount?.owner_id === user?.id;
  const isActive = sharedAccount?.status === "active";

  // Generate invite (create shared_accounts row)
  const handleGenerateInvite = async () => {
    if (!user) return;
    setLoading(true);
    const { error } = await supabase.from("shared_accounts").insert({
      owner_id: user.id,
    } as any);
    if (error) {
      if (error.code === "23505") {
        toast.error("Você já possui um convite ativo.");
      } else {
        toast.error("Erro ao gerar convite");
      }
    } else {
      toast.success("Convite gerado! Compartilhe o código com seu parceiro(a).");
      onRefresh();
    }
    setLoading(false);
  };

  // Accept invite
  const handleAcceptInvite = async () => {
    if (!inviteCode.trim()) return;
    setLoading(true);
    const { data, error } = await supabase.rpc("accept_couple_invite", {
      p_code: inviteCode.trim(),
    });
    if (error) {
      toast.error("Erro ao aceitar convite");
    } else {
      const result = data as any;
      if (result.success) {
        toast.success(result.message);
        setInviteCode("");
        onRefresh();
      } else {
        toast.error(result.error);
      }
    }
    setLoading(false);
  };

  // Revoke/unlink
  const handleUnlink = async () => {
    if (!sharedAccount || !confirm("Tem certeza que deseja desvincular a conta compartilhada? Ambos perderão o acesso aos dados compartilhados.")) return;
    setLoading(true);
    
    if (isOwner) {
      await supabase.from("shared_accounts").delete().eq("id", sharedAccount.id);
    } else {
      // Partner leaves: reset to pending
      await supabase.from("shared_accounts").update({
        partner_id: null,
        status: "pending",
      } as any).eq("id", sharedAccount.id);
    }
    
    toast.success("Conta desvinculada com sucesso");
    onRefresh();
    setLoading(false);
  };

  const copyCode = () => {
    if (!sharedAccount?.invite_code) return;
    navigator.clipboard.writeText(sharedAccount.invite_code);
    setCopied(true);
    toast.success("Código copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  // Non-premium: can only accept invites, not create
  if (!isPremium) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Conta de Casal</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-4">
          Recebeu um código do seu parceiro(a)? Insira abaixo para vincular as contas.
        </p>
        <div className="flex gap-2">
          <Input
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
            placeholder="Código do convite"
            className="flex-1 font-mono"
            maxLength={8}
          />
          <Button
            variant="default"
            size="sm"
            className="gap-1.5 shrink-0"
            onClick={handleAcceptInvite}
            disabled={loading || !inviteCode.trim()}
          >
            <Check className="w-3.5 h-3.5" />
            Vincular
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          💡 Para <strong>criar</strong> um convite, é necessário o plano Premium com perfil Casal.
        </p>
      </motion.div>
    );
  }

  // Premium but not casal profile
  if (profileType !== "casal") {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-3">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Conta de Casal</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Para compartilhar, altere seu tipo de perfil para "Casal" acima.
        </p>
      </motion.div>
    );
  }

  // Active shared account
  if (isActive && sharedAccount) {
    const partnerName = partnerProfile?.display_name || "Parceiro(a)";
    const partnerAvatar = partnerProfile?.avatar_url;
    const partnerInitials = partnerName.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();

    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-primary/30 shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary fill-primary" />
          <h3 className="font-display font-bold text-base">Conta Compartilhada</h3>
          <span className="text-xs bg-green-500/20 text-green-700 dark:text-green-400 rounded-full px-2 py-0.5 font-semibold">Ativo</span>
        </div>

        <div className="flex items-center gap-4 bg-muted/50 rounded-lg p-4">
          <div className="flex items-center gap-3 flex-1">
            <Avatar className="w-10 h-10 border-2 border-primary/30">
              {partnerAvatar && <AvatarImage src={partnerAvatar} alt={partnerName} />}
              <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                {partnerInitials}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-semibold">{partnerName}</p>
              <p className="text-xs text-muted-foreground">
                {isOwner ? "Seu parceiro(a)" : "Dono(a) da conta"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="w-3.5 h-3.5" />
            <span>Acesso total</span>
          </div>
        </div>

        <div className="mt-4 p-3 bg-primary/5 rounded-lg">
          <p className="text-xs text-muted-foreground">
            💕 Vocês compartilham todas as receitas, despesas e metas. Ambos podem adicionar, editar e excluir.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-4 gap-1.5 text-destructive hover:text-destructive"
          onClick={handleUnlink}
          disabled={loading}
        >
          <Unlink className="w-3.5 h-3.5" />
          Desvincular conta
        </Button>
      </motion.div>
    );
  }

  // Pending invite (owner created but no partner yet)
  if (sharedAccount && !isActive && isOwner) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
        <div className="flex items-center gap-2 mb-4">
          <Heart className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-base">Conta de Casal</h3>
          <span className="text-xs bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-full px-2 py-0.5 font-semibold">Aguardando</span>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Envie o código abaixo para seu parceiro(a). Ele(a) deve inserir o código na mesma seção.
        </p>

        <div className="flex gap-2">
          <div className="flex-1 bg-muted rounded-lg px-4 py-3 font-mono text-lg font-bold text-center tracking-widest select-all">
            {sharedAccount.invite_code}
          </div>
          <Button variant="outline" size="icon" onClick={copyCode} className="shrink-0">
            {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={async () => {
              if (!confirm("Cancelar convite?")) return;
              await supabase.from("shared_accounts").delete().eq("id", sharedAccount.id);
              toast.success("Convite cancelado");
              onRefresh();
            }}
            disabled={loading}
          >
            Cancelar convite
          </Button>
        </div>
      </motion.div>
    );
  }

  // No shared account yet - show options to create or join
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-xl p-5 border border-border shadow-card">
      <div className="flex items-center gap-2 mb-4">
        <Heart className="w-5 h-5 text-primary" />
        <h3 className="font-display font-bold text-base">Conta de Casal</h3>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Compartilhe todas as finanças com seu parceiro(a). Apenas <strong>2 pessoas</strong> podem compartilhar a mesma conta.
      </p>

      <div className="grid gap-4">
        {/* Create invite */}
        <Card className="border-dashed border-2 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Convidar parceiro(a)</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Gere um código e envie para seu parceiro(a) para vincular as contas.
            </p>
            <Button
              variant="default"
              size="sm"
              className="gap-1.5"
              onClick={handleGenerateInvite}
              disabled={loading}
            >
              <UserPlus className="w-3.5 h-3.5" />
              Gerar código de convite
            </Button>
          </CardContent>
        </Card>

        {/* Accept invite */}
        <Card className="border-dashed border-2 border-muted-foreground/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-4 h-4 text-primary" />
              <h4 className="font-semibold text-sm">Aceitar convite</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              Recebeu um código do seu parceiro(a)? Insira abaixo.
            </p>
            <div className="flex gap-2">
              <Input
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                placeholder="Código do convite"
                className="flex-1 font-mono"
                maxLength={8}
              />
              <Button
                variant="default"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={handleAcceptInvite}
                disabled={loading || !inviteCode.trim()}
              >
                <Check className="w-3.5 h-3.5" />
                Vincular
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
};

export default CoupleShareSection;
