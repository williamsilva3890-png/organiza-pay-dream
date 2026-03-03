import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import {
  MessageSquare, Phone, Shield, Bell, FileBarChart, Zap,
  CheckCircle2, XCircle, Crown, Lock, ToggleLeft, ToggleRight,
  Smartphone, AlertTriangle, Target, DollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface WhatsAppPageProps {
  isPremium: boolean;
}

const WhatsAppPage = ({ isPremium }: WhatsAppPageProps) => {
  const { user } = useAuth();
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Settings toggles
  const [weeklyReport, setWeeklyReport] = useState(true);
  const [monthlyReport, setMonthlyReport] = useState(true);
  const [alertOverBudget, setAlertOverBudget] = useState(true);
  const [alertNegativeBalance, setAlertNegativeBalance] = useState(true);
  const [alertGoalNear, setAlertGoalNear] = useState(true);
  const [quickRegister, setQuickRegister] = useState(true);
  const [dataQuery, setDataQuery] = useState(true);

  if (!isPremium) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-dashed border-2 border-primary/30">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Recurso Premium</h2>
              <p className="text-muted-foreground max-w-md">
                A integração com WhatsApp é exclusiva para assinantes do Plano Premium. 
                Assine agora e controle suas finanças diretamente pelo WhatsApp!
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Crown className="w-5 h-5 text-primary" />
                <span className="font-semibold text-primary">R$ 9,90/mês</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  const handleConnect = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error("Digite um número de WhatsApp válido com DDD.");
      return;
    }
    setIsConnecting(true);
    // Simulate connection (will be replaced with real API later)
    await new Promise(r => setTimeout(r, 2000));
    setIsConnected(true);
    setIsConnecting(false);
    toast.success("Número vinculado com sucesso! A integração será ativada em breve.");
  };

  const handleDisconnect = () => {
    setIsConnected(false);
    setPhoneNumber("");
    toast.info("Integração desconectada.");
  };

  const features = [
    {
      icon: FileBarChart,
      title: "Relatórios Automáticos",
      description: "Receba resumos financeiros semanais e mensais com receitas, despesas, saldo e progresso das metas.",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      icon: Bell,
      title: "Alertas Inteligentes",
      description: "Seja notificado quando despesas passarem de 80% do orçamento, gastos superarem receitas ou metas estiverem próximas.",
      color: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
    {
      icon: Zap,
      title: "Registro Rápido",
      description: 'Envie mensagens como "Gastei 150 mercado" ou "Recebi 2.000 cliente" e registre automaticamente.',
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      icon: MessageSquare,
      title: "Consulta de Dados",
      description: 'Pergunte "Qual meu saldo?", "Quanto gastei esse mês?" e receba respostas instantâneas.',
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Phone className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Integração WhatsApp</h1>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-500 font-semibold uppercase tracking-wider">Em breve</Badge>
            <p className="text-sm text-muted-foreground">Controle suas finanças direto pelo WhatsApp</p>
          </div>
          <Badge variant={isConnected ? "default" : "secondary"} className="ml-auto text-xs">
            {isConnected ? (
              <><CheckCircle2 className="w-3 h-3 mr-1" /> Conectado</>
            ) : (
              <><XCircle className="w-3 h-3 mr-1" /> Não conectado</>
            )}
          </Badge>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {features.map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
              <Card className="h-full">
                <CardContent className="flex gap-3 pt-5">
                  <div className={`w-10 h-10 rounded-lg ${f.bgColor} flex items-center justify-center shrink-0`}>
                    <f.icon className={`w-5 h-5 ${f.color}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{f.description}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Connection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Smartphone className="w-5 h-5" />
              Vincular Número
            </CardTitle>
            <CardDescription>
              Conecte seu número de WhatsApp para começar a usar a integração.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!isConnected ? (
              <div className="flex gap-3">
                <div className="flex-1">
                  <Input
                    placeholder="(11) 99999-9999"
                    value={phoneNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, "");
                      if (v.length <= 11) {
                        const formatted = v.length > 6
                          ? `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`
                          : v.length > 2
                            ? `(${v.slice(0,2)}) ${v.slice(2)}`
                            : v.length > 0 ? `(${v}` : "";
                        setPhoneNumber(formatted);
                      }
                    }}
                    maxLength={16}
                  />
                </div>
                <Button onClick={handleConnect} disabled={isConnecting} className="bg-green-600 hover:bg-green-700 text-white">
                  {isConnecting ? "Conectando..." : "Ativar Integração"}
                </Button>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="font-medium text-sm">Número vinculado</p>
                    <p className="text-xs text-muted-foreground">{phoneNumber}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={handleDisconnect} className="text-destructive border-destructive/30 hover:bg-destructive/10">
                  Desconectar
                </Button>
              </div>
            )}
            <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-lg">
              <Shield className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              <p className="text-xs text-muted-foreground">
                Seu número é protegido com criptografia. Você pode cancelar a integração a qualquer momento.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Settings */}
        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings2Icon />
                  Configurações
                </CardTitle>
                <CardDescription>Personalize quais funcionalidades deseja receber pelo WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <SettingRow
                  icon={<FileBarChart className="w-4 h-4 text-blue-500" />}
                  label="Relatório semanal"
                  description="Resumo financeiro toda segunda-feira"
                  checked={weeklyReport}
                  onChange={setWeeklyReport}
                />
                <Separator />
                <SettingRow
                  icon={<FileBarChart className="w-4 h-4 text-blue-500" />}
                  label="Relatório mensal"
                  description="Resumo completo no 1º dia de cada mês"
                  checked={monthlyReport}
                  onChange={setMonthlyReport}
                />
                <Separator />
                <SettingRow
                  icon={<AlertTriangle className="w-4 h-4 text-amber-500" />}
                  label="Alerta de orçamento (80%)"
                  description="Aviso quando despesas passarem de 80% das receitas"
                  checked={alertOverBudget}
                  onChange={setAlertOverBudget}
                />
                <Separator />
                <SettingRow
                  icon={<DollarSign className="w-4 h-4 text-red-500" />}
                  label="Alerta de saldo negativo"
                  description="Aviso quando gastos superarem receitas"
                  checked={alertNegativeBalance}
                  onChange={setAlertNegativeBalance}
                />
                <Separator />
                <SettingRow
                  icon={<Target className="w-4 h-4 text-green-500" />}
                  label="Alerta de metas"
                  description="Aviso quando uma meta estiver próxima de ser atingida"
                  checked={alertGoalNear}
                  onChange={setAlertGoalNear}
                />
                <Separator />
                <SettingRow
                  icon={<Zap className="w-4 h-4 text-yellow-500" />}
                  label="Registro rápido por mensagem"
                  description='Registrar receitas/despesas enviando mensagens de texto'
                  checked={quickRegister}
                  onChange={setQuickRegister}
                />
                <Separator />
                <SettingRow
                  icon={<MessageSquare className="w-4 h-4 text-purple-500" />}
                  label="Consulta de dados"
                  description="Consultar saldo, gastos e metas pelo WhatsApp"
                  checked={dataQuery}
                  onChange={setDataQuery}
                />
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Example Messages */}
        {isConnected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">💬 Exemplos de Uso</CardTitle>
                <CardDescription>Veja como interagir com o OrganizaPay pelo WhatsApp</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <ChatBubble type="sent" text='Gastei 150 mercado' />
                  <ChatBubble type="received" text='✅ Despesa registrada!\n📌 Categoria: Alimentação\n💰 Valor: R$ 150,00\n📅 Data: Hoje' />
                  <ChatBubble type="sent" text='Qual meu saldo?' />
                  <ChatBubble type="received" text='📊 Seu saldo atual:\n\n💚 Receitas: R$ 5.000,00\n🔴 Despesas: R$ 3.200,00\n💰 Saldo: R$ 1.800,00' />
                  <ChatBubble type="sent" text='Status da minha meta?' />
                  <ChatBubble type="received" text='🎯 Metas ativas:\n\n1. Viagem - R$ 2.000/R$ 5.000 (40%)\n2. Emergência - R$ 8.500/R$ 10.000 (85%) 🔥' />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

// Sub-components
const Settings2Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 7h-9"/><path d="M14 17H5"/><circle cx="17" cy="17" r="3"/><circle cx="7" cy="7" r="3"/>
  </svg>
);

const SettingRow = ({ icon, label, description, checked, onChange }: {
  icon: React.ReactNode; label: string; description: string; checked: boolean; onChange: (v: boolean) => void;
}) => (
  <div className="flex items-center justify-between py-3">
    <div className="flex items-center gap-3">
      {icon}
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} />
  </div>
);

const ChatBubble = ({ type, text }: { type: "sent" | "received"; text: string }) => (
  <div className={`flex ${type === "sent" ? "justify-end" : "justify-start"}`}>
    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
      type === "sent"
        ? "bg-green-600 text-white rounded-br-md"
        : "bg-muted text-foreground rounded-bl-md"
    }`}>
      {text}
    </div>
  </div>
);

export default WhatsAppPage;
