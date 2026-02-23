import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Crown, Eye, EyeOff, AlertTriangle, Loader2, MessageCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const TRIBOPAY_CHECKOUT_URL = "https://go.tribopay.com.br/i7egqo5x95";
const WHATSAPP_NUMBER = "5592985968379";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumSignupDialog = ({ open, onOpenChange }: Props) => {
  const { user, signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [accountCreated, setAccountCreated] = useState(false);
  const [userId, setUserId] = useState("");
  const [displayName, setDisplayName] = useState("");

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!nome.trim()) {
      toast.error("Preencha seu nome");
      return;
    }
    if (!email.trim()) {
      toast.error("Preencha seu email");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }

    setLoading(true);
    try {
      const { error } = await signUp(email, password, nome);
      if (error) {
        toast.error(
          error.message === "User already registered"
            ? "Este email já está cadastrado. Faça login primeiro."
            : error.message
        );
        return;
      }

      // Fetch user ID from the newly created session
      const { data: sessionData } = await supabase.auth.getSession();
      const uid = sessionData.session?.user?.id;

      if (uid) {
        // Fetch profile to get the display ID
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, display_name")
          .eq("user_id", uid)
          .single();

        setUserId(profile?.id || uid);
        setDisplayName(profile?.display_name || nome);
      }

      setAccountCreated(true);
      toast.success("Conta criada com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleContinueToCheckout = () => {
    window.open(TRIBOPAY_CHECKOUT_URL, "_blank", "noopener,noreferrer");
  };

  const whatsappMessage = encodeURIComponent(
    "Fiz o pagamento, mas não fui para o Premium."
  );
  const whatsappLink = `https://wa.me/${WHATSAPP_NUMBER}?text=${whatsappMessage}`;

  const handleClose = () => {
    setAccountCreated(false);
    setEmail("");
    setPassword("");
    setNome("");
    setUserId("");
    setDisplayName("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-xl">
            <Crown className="w-5 h-5 text-primary" />
            Assinar Premium
          </DialogTitle>
        </DialogHeader>

        {/* Mensagem de instrução */}
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mt-2">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div className="text-sm text-amber-900 dark:text-amber-200 space-y-2">
              <p className="font-semibold">
                Antes de ir para a compra, preciso que leia atentamente a
                mensagem abaixo.
              </p>
              <p>
                Crie um Gmail e uma senha aqui mesmo, finalize o pagamento e use
                o mesmo login para entrar no Organiza.
              </p>
              <p>
                Caso você tenha feito o pagamento, mas não tenha ficado no
                Premium, envie uma mensagem no WhatsApp abaixo com o seguinte
                texto:
              </p>
              <p className="italic font-medium">
                "Fiz o pagamento, mas não fui para o Premium."
              </p>
              <p>
                Envie também o comprovante do Pix, o Gmail utilizado e o ID que
                irá aparecer abaixo do nome.
              </p>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-1 text-green-700 dark:text-green-400 font-semibold hover:underline"
              >
                <MessageCircle className="w-4 h-4" />
                WhatsApp de Suporte
              </a>
            </div>
          </div>
        </div>

        {!accountCreated ? (
          <form onSubmit={handleCreateAccount} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="premium-nome">Nome completo</Label>
              <Input
                id="premium-nome"
                type="text"
                placeholder="Seu nome completo"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium-email">Gmail</Label>
              <Input
                id="premium-email"
                type="email"
                placeholder="seu@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="premium-password">Senha</Label>
              <div className="relative">
                <Input
                  id="premium-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full gap-2"
              size="lg"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Crown className="w-4 h-4" />
              )}
              {loading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>
        ) : (
          <div className="space-y-4 mt-2">
            {/* Exibir nome e ID */}
            <div className="bg-muted rounded-lg p-4 text-center space-y-1">
              <p className="font-semibold text-lg">{displayName}</p>
              <p className="text-xs text-muted-foreground">
                ID: <span className="font-mono font-bold select-all">{userId}</span>
              </p>
            </div>

            <p className="text-sm text-muted-foreground text-center">
              Conta criada! Agora clique abaixo para finalizar o pagamento via
              PIX.
            </p>

            <Button
              onClick={handleContinueToCheckout}
              className="w-full gap-2"
              size="lg"
              variant="hero"
            >
              <Crown className="w-4 h-4" />
              Continuar para compra
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PremiumSignupDialog;
