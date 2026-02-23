import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, QrCode, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

const checkoutSchema = z.object({
  name: z.string().trim().min(3, "Nome deve ter pelo menos 3 caracteres").max(100),
  phone: z.string().trim().min(10, "Telefone inválido").max(20),
  email: z.string().trim().email("Email inválido").max(255),
  cpf: z.string().trim().min(11, "CPF inválido").max(14),
  dueDate: z.string().min(1, "Selecione uma data de vencimento"),
});

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PremiumCheckoutDialog = ({ open, onOpenChange }: Props) => {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; hash: string } | null>(null);

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    return digits
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  };

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 10) {
      return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
    }
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
  };

  const handleGenerateQR = async () => {
    const result = checkoutSchema.safeParse({ name, phone, email, cpf: cpf.replace(/\D/g, ""), dueDate });
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast.error(firstError.message);
      return;
    }

    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/tribopay-checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({
          name: result.data.name,
          phone: result.data.phone,
          email: result.data.email,
          cpf: result.data.cpf,
          due_date: result.data.dueDate,
          amount: 1990, // R$ 19,90 em centavos
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar QR Code");

      setQrCodeData({ qrCode: data.qr_code, hash: data.hash });
      toast.success("QR Code gerado com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setQrCodeData(null);
    onOpenChange(false);
  };

  const copyHash = () => {
    if (qrCodeData?.hash) {
      navigator.clipboard.writeText(qrCodeData.hash);
      toast.success("Código copiado!");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Crown className="w-5 h-5 text-primary" />
            Assinar Premium
          </DialogTitle>
          <DialogDescription>
            Preencha seus dados para gerar o QR Code PIX de R$ 19,90/mês.
          </DialogDescription>
        </DialogHeader>

        {!qrCodeData ? (
          <div className="space-y-4 mt-2">
            <div>
              <label className="text-sm font-medium mb-1 block">Nome completo</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Seu nome completo" maxLength={100} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Telefone</label>
              <Input value={phone} onChange={(e) => setPhone(formatPhone(e.target.value))} placeholder="(00) 00000-0000" maxLength={15} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" maxLength={255} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">CPF</label>
              <Input value={cpf} onChange={(e) => setCpf(formatCPF(e.target.value))} placeholder="000.000.000-00" maxLength={14} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Data de vencimento</label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <Button onClick={handleGenerateQR} disabled={loading} className="w-full gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <QrCode className="w-4 h-4" />}
              {loading ? "Gerando..." : "Gerar QR Code PIX"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 mt-2">
            <div className="bg-white p-4 rounded-xl">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCodeData.hash)}`}
                alt="QR Code PIX"
                className="w-48 h-48"
              />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Escaneie o QR Code com seu app do banco ou copie o código abaixo:
            </p>
            <div className="w-full">
              <div className="flex gap-2">
                <Input value={qrCodeData.hash} readOnly className="text-xs" />
                <Button variant="outline" size="sm" onClick={copyHash}>Copiar</Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Após o pagamento, seu plano será ativado automaticamente.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PremiumCheckoutDialog;
