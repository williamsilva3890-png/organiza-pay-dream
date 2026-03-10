import { useState, useMemo } from "react";
import { ArrowDownCircle, Plus, CreditCard, ShoppingCart, Lock, Pencil, Trash2, CheckCircle, Circle, RotateCcw, ChevronDown, ChevronUp, Repeat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { useFinanceData, FREE_LIMITS } from "@/hooks/useFinanceData";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const categoryColors: Record<string, string> = {
  Moradia: "bg-primary/10 text-primary",
  Alimentação: "bg-warning/10 text-warning",
  Transporte: "bg-accent/10 text-accent",
  Saúde: "bg-success/10 text-success",
  Lazer: "bg-destructive/10 text-destructive",
  Dívida: "bg-destructive/10 text-destructive",
};

const expenseCategories = ["Moradia", "Alimentação", "Transporte", "Saúde", "Lazer", "Educação", "Outros"];

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const DespesasPage = ({ finance }: Props) => {
  const { gastos, dividas, assinaturas, totalGastos, totalDividas, totalAssinaturas, totalDespesas, addDespesa, addMultipleDespesas, updateDespesa, deleteDespesa, toggleDespesaPaid, canAddDespesa, isPremium, resetDespesas } = finance;
  const [openGasto, setOpenGasto] = useState(false);
  const [openDivida, setOpenDivida] = useState(false);
  const [openAssinatura, setOpenAssinatura] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editType, setEditType] = useState<"gasto" | "divida">("gasto");
  const [formGasto, setFormGasto] = useState({ description: "", amount: "", date: "", category: "Moradia" });
  const [formDivida, setFormDivida] = useState({ description: "", amount: "", date: "", details: "", parcelas: "1" });
  const [formAssinatura, setFormAssinatura] = useState({ description: "", amount: "", date: "", category: "Outros" });
  const [submitting, setSubmitting] = useState(false);
  const [expandedDivida, setExpandedDivida] = useState<string | null>(null);

  const handleAddGasto = async () => {
    if (!canAddDespesa) { toast.error(`Limite do plano gratuito atingido (${FREE_LIMITS.despesas} despesas). Faça upgrade para Premium!`); return; }
    if (!formGasto.description || !formGasto.amount || !formGasto.date || submitting) return;
    setSubmitting(true);
    await addDespesa({ description: formGasto.description, amount: parseFloat(formGasto.amount), date: formGasto.date, category: formGasto.category, type: "gasto" });
    setFormGasto({ description: "", amount: "", date: "", category: "Moradia" });
    setSubmitting(false);
    setOpenGasto(false);
  };

  const handleAddDivida = async () => {
    if (!canAddDespesa) { toast.error(`Limite do plano gratuito atingido (${FREE_LIMITS.despesas} despesas). Faça upgrade para Premium!`); return; }
    if (!formDivida.description || !formDivida.amount || !formDivida.date || submitting) return;
    setSubmitting(true);
    
    const numParcelas = Math.max(1, parseInt(formDivida.parcelas) || 1);
    const valorParcela = parseFloat(formDivida.amount);
    
    if (numParcelas > 1) {
      // Create multiple installments
      const baseDate = new Date(formDivida.date);
      const items = Array.from({ length: numParcelas }, (_, i) => {
        const parcelaDate = new Date(baseDate);
        parcelaDate.setMonth(parcelaDate.getMonth() + i);
        return {
          description: `${formDivida.description}`,
          amount: valorParcela,
          date: parcelaDate.toISOString().slice(0, 10),
          category: "Dívida" as const,
          type: "divida" as const,
          details: `Parcela ${i + 1}/${numParcelas}${formDivida.details ? ` - ${formDivida.details}` : ""}`,
          paid: false,
        };
      });
      await addMultipleDespesas(items);
    } else {
      await addDespesa({
        description: formDivida.description, amount: valorParcela,
        date: formDivida.date, category: "Dívida", type: "divida",
        details: formDivida.details || undefined,
      });
    }
    
    setFormDivida({ description: "", amount: "", date: "", details: "", parcelas: "1" });
    setSubmitting(false);
    setOpenDivida(false);
  };

  const handleAddAssinatura = async () => {
    if (!canAddDespesa) { toast.error(`Limite do plano gratuito atingido (${FREE_LIMITS.despesas} despesas). Faça upgrade para Premium!`); return; }
    if (!formAssinatura.description || !formAssinatura.amount || !formAssinatura.date || submitting) return;
    setSubmitting(true);
    const success = await addDespesa({ description: formAssinatura.description, amount: parseFloat(formAssinatura.amount), date: formAssinatura.date, category: formAssinatura.category, type: "assinatura" });
    setFormAssinatura({ description: "", amount: "", date: "", category: "Outros" });
    setSubmitting(false);
    setOpenAssinatura(false);
    if (success) {
      toast.success("Assinatura adicionada!");
    } else {
      toast.error("Erro ao adicionar assinatura. Tente novamente.");
    }
  };

  const handleCancelAssinatura = async (id: string) => {
    await deleteDespesa(id);
    toast.success("Assinatura cancelada!");
  };

  const startEditGasto = (d: any) => {
    setEditId(d.id);
    setEditType("gasto");
    setFormGasto({ description: d.description, amount: String(d.amount), date: d.date, category: d.category });
    setEditOpen(true);
  };

  const startEditDivida = (d: any) => {
    setEditId(d.id);
    setEditType("divida");
    setFormDivida({ description: d.description, amount: String(d.amount), date: d.date, details: d.details || "", parcelas: "1" });
    setEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editId) return;
    if (editType === "gasto") {
      if (!formGasto.description || !formGasto.amount || !formGasto.date) return;
      await updateDespesa(editId, { description: formGasto.description, amount: parseFloat(formGasto.amount), date: formGasto.date, category: formGasto.category });
    } else {
      if (!formDivida.description || !formDivida.amount || !formDivida.date) return;
      await updateDespesa(editId, { description: formDivida.description, amount: parseFloat(formDivida.amount), date: formDivida.date, details: formDivida.details });
    }
    setEditOpen(false);
    setEditId(null);
    toast.success("Despesa atualizada!");
  };

  const handleDelete = async (id: string) => {
    await deleteDespesa(id);
    toast.success("Despesa removida!");
  };

  const handleTogglePaid = async (id: string, currentPaid: boolean) => {
    await toggleDespesaPaid(id, !currentPaid);
    toast.success(!currentPaid ? "Marcado como pago ✅" : "Desmarcado");
  };

  const handleReset = async () => {
    if (!confirm("Tem certeza que deseja zerar TODAS as despesas? Esta ação não pode ser desfeita.")) return;
    await resetDespesas();
    toast.success("Despesas zeradas!");
  };

  // Group dividas by description for installment view
  const groupedDividas = dividas.reduce((acc, d) => {
    const key = d.description;
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {} as Record<string, typeof dividas>);

  const inputClass = "w-full h-10 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30";
  const fmt = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div>
          <h1 className="font-display font-bold text-2xl">Despesas</h1>
          <p className="text-sm text-muted-foreground">Controle suas saídas por categoria</p>
        </div>
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2">
          <Dialog open={openGasto} onOpenChange={setOpenGasto}>
            <DialogTrigger asChild><Button variant="default" className="gap-2 w-full sm:w-auto" disabled={!canAddDespesa && !isPremium}><Plus className="w-4 h-4" />Novo gasto</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Novo gasto</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><label className="text-sm font-medium mb-1 block">Com o que está gastando?</label><input value={formGasto.description} onChange={(e) => setFormGasto(prev => ({ ...prev, description: e.target.value }))} className={inputClass} placeholder="Ex: Conta de luz" /></div>
                <div><label className="text-sm font-medium mb-1 block">Valor (R$)</label><input type="number" value={formGasto.amount} onChange={(e) => setFormGasto(prev => ({ ...prev, amount: e.target.value }))} className={inputClass} placeholder="0,00" /></div>
                <div><label className="text-sm font-medium mb-1 block">Data</label><input type="date" value={formGasto.date} onChange={(e) => setFormGasto(prev => ({ ...prev, date: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1 block">Categoria</label><select value={formGasto.category} onChange={(e) => setFormGasto(prev => ({ ...prev, category: e.target.value }))} className={inputClass}>{expenseCategories.map((c) => <option key={c}>{c}</option>)}</select></div>
                <Button onClick={handleAddGasto} className="w-full" disabled={submitting}>{submitting ? "Salvando..." : "Adicionar gasto"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openDivida} onOpenChange={setOpenDivida}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2 w-full sm:w-auto" disabled={!canAddDespesa && !isPremium}><CreditCard className="w-4 h-4" />Nova dívida</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova dívida</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><label className="text-sm font-medium mb-1 block">Descrição da dívida</label><input value={formDivida.description} onChange={(e) => setFormDivida(prev => ({ ...prev, description: e.target.value }))} className={inputClass} placeholder="Ex: Financiamento do carro" /></div>
                <div><label className="text-sm font-medium mb-1 block">Valor da parcela (R$)</label><input type="number" value={formDivida.amount} onChange={(e) => setFormDivida(prev => ({ ...prev, amount: e.target.value }))} className={inputClass} placeholder="0,00" /></div>
                <div><label className="text-sm font-medium mb-1 block">Número de parcelas</label><input type="number" min="1" max="120" value={formDivida.parcelas} onChange={(e) => setFormDivida(prev => ({ ...prev, parcelas: e.target.value }))} className={inputClass} placeholder="1" /></div>
                <div><label className="text-sm font-medium mb-1 block">Data do primeiro vencimento</label><input type="date" value={formDivida.date} onChange={(e) => setFormDivida(prev => ({ ...prev, date: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1 block">Detalhes (opcional)</label><input value={formDivida.details} onChange={(e) => setFormDivida(prev => ({ ...prev, details: e.target.value }))} className={inputClass} placeholder="Ex: Banco XYZ" /></div>
                {parseInt(formDivida.parcelas) > 1 && formDivida.amount && (
                  <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                    <p>📋 Serão criadas <span className="font-semibold text-foreground">{formDivida.parcelas} parcelas</span> de <span className="font-semibold text-foreground">{fmt(parseFloat(formDivida.amount))}</span></p>
                    <p className="mt-1">Total: <span className="font-semibold text-foreground">{fmt(parseFloat(formDivida.amount) * parseInt(formDivida.parcelas))}</span></p>
                  </div>
                )}
                <Button onClick={handleAddDivida} className="w-full" disabled={submitting}>{submitting ? "Salvando..." : "Adicionar dívida"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={openAssinatura} onOpenChange={setOpenAssinatura}>
            <DialogTrigger asChild><Button variant="outline" className="gap-2 w-full sm:w-auto" disabled={!canAddDespesa && !isPremium}><Repeat className="w-4 h-4" />Nova assinatura</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Nova assinatura recorrente</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <div><label className="text-sm font-medium mb-1 block">Nome do serviço</label><input value={formAssinatura.description} onChange={(e) => setFormAssinatura(prev => ({ ...prev, description: e.target.value }))} className={inputClass} placeholder="Ex: Netflix, Spotify, iCloud" /></div>
                <div><label className="text-sm font-medium mb-1 block">Valor mensal (R$)</label><input type="number" value={formAssinatura.amount} onChange={(e) => setFormAssinatura(prev => ({ ...prev, amount: e.target.value }))} className={inputClass} placeholder="0,00" /></div>
                <div><label className="text-sm font-medium mb-1 block">Data de cobrança</label><input type="date" value={formAssinatura.date} onChange={(e) => setFormAssinatura(prev => ({ ...prev, date: e.target.value }))} className={inputClass} /></div>
                <div><label className="text-sm font-medium mb-1 block">Categoria</label><select value={formAssinatura.category} onChange={(e) => setFormAssinatura(prev => ({ ...prev, category: e.target.value }))} className={inputClass}>{expenseCategories.map((c) => <option key={c}>{c}</option>)}</select></div>
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
                  <p>🔄 Assinaturas são cobranças recorrentes que você decide quando cancelar.</p>
                </div>
                <Button onClick={handleAddAssinatura} className="w-full" disabled={submitting}>{submitting ? "Salvando..." : "Adicionar assinatura"}</Button>
              </div>
            </DialogContent>
          </Dialog>
          {isPremium && (gastos.length > 0 || dividas.length > 0 || assinaturas.length > 0) && (
            <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive col-span-2 sm:col-span-1" onClick={handleReset}>
              <RotateCcw className="w-4 h-4" />Zerar
            </Button>
          )}
        </div>
      </div>

      {!isPremium && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5">
          <Lock className="w-3.5 h-3.5" />
          <span>Plano gratuito: {gastos.length + dividas.length + assinaturas.length}/{FREE_LIMITS.despesas} despesas usadas</span>
        </div>
      )}

      {/* Stats + Chart */}
      {(() => {
        // Build monthly expense data for chart
        const allDespesas = finance.despesas;
        const monthlyMap: Record<string, { gastos: number; dividas: number; assinaturas: number }> = {};
        const now = new Date();
        for (let i = 5; i >= 0; i--) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          monthlyMap[key] = { gastos: 0, dividas: 0, assinaturas: 0 };
        }
        allDespesas.forEach(d => {
          const key = d.date.slice(0, 7);
          if (monthlyMap[key]) {
            if (d.type === "divida") monthlyMap[key].dividas += Number(d.amount);
            else if (d.type === "assinatura") monthlyMap[key].assinaturas += Number(d.amount);
            else monthlyMap[key].gastos += Number(d.amount);
          }
        });
        const chartData = Object.entries(monthlyMap).map(([key, v]) => ({
          month: new Date(key + "-01").toLocaleDateString("pt-BR", { month: "short" }),
          Gastos: v.gastos,
          Dívidas: v.dividas,
          Assinaturas: v.assinaturas,
        }));

        const stats = [
          { label: "Total geral", value: totalDespesas, icon: ArrowDownCircle, iconBg: "bg-destructive/10", iconColor: "text-destructive", valueColor: "text-destructive" },
          { label: "Gastos", value: totalGastos, icon: ShoppingCart, iconBg: "bg-warning/10", iconColor: "text-warning", valueColor: "text-foreground" },
          { label: "Dívidas", value: totalDividas, icon: CreditCard, iconBg: "bg-destructive/10", iconColor: "text-destructive", valueColor: "text-destructive" },
          { label: "Assinaturas", value: totalAssinaturas, icon: Repeat, iconBg: "bg-primary/10", iconColor: "text-primary", valueColor: "text-primary" },
        ];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Left: stat cards in 2x2 grid */}
            <div className="grid grid-cols-2 gap-3">
              {stats.map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                  className="bg-card rounded-xl p-4 border border-border shadow-card flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                      <stat.icon className={`w-4 h-4 ${stat.iconColor}`} />
                    </div>
                    <p className="text-[11px] text-muted-foreground">{stat.label}</p>
                  </div>
                  <p className={`font-display font-bold text-lg ${stat.valueColor}`}>{fmt(stat.value)}</p>
                </motion.div>
              ))}
            </div>

            {/* Right: Area chart */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="lg:col-span-2 bg-card rounded-xl p-5 border border-border shadow-card">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-display font-bold text-sm">Despesas por tipo</h3>
                <span className="text-[10px] text-muted-foreground">Últimos 6 meses</span>
              </div>
              <div className="h-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gGastos" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gDividas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gAssinaturas" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
                    <Tooltip
                      contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }}
                      formatter={(value: number) => [fmt(value), undefined]}
                    />
                    <Area type="monotone" dataKey="Gastos" stroke="hsl(var(--warning))" fill="url(#gGastos)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Dívidas" stroke="hsl(var(--destructive))" fill="url(#gDividas)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Assinaturas" stroke="hsl(var(--primary))" fill="url(#gAssinaturas)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <div className="flex items-center gap-4 mt-2 justify-center">
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-warning" />Gastos</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-destructive" />Dívidas</span>
                <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><span className="w-2.5 h-2.5 rounded-full bg-primary" />Assinaturas</span>
              </div>
            </motion.div>
          </div>
        );
      })()}

      {/* Gastos list */}
      <div>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-warning" /> Gastos</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          <div className="hidden sm:grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-4 px-5 py-3 bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <span>Status</span><span>Descrição</span><span>Categoria</span><span>Data</span><span className="text-right">Valor</span><span></span>
          </div>
          {gastos.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhum gasto cadastrado</div>}
          {gastos.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className={`flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-1 sm:gap-4 px-4 sm:px-5 py-3 border-t border-border sm:items-center hover:bg-muted/30 transition-colors ${d.paid ? "opacity-60" : ""}`}>
              <button onClick={() => handleTogglePaid(d.id, !!d.paid)} className="self-start sm:self-center p-0.5" title={d.paid ? "Desmarcar como pago" : "Marcar como pago"}>
                {d.paid ? <CheckCircle className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
              </button>
              <span className={`text-sm font-medium ${d.paid ? "line-through text-muted-foreground" : ""}`}>{d.description}</span>
              <div className="flex items-center gap-2 sm:contents">
                <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${categoryColors[d.category] || "bg-muted text-muted-foreground"}`}>{d.category}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                <span className="text-sm font-semibold text-destructive ml-auto sm:ml-0 sm:text-right">-{fmt(Number(d.amount))}</span>
              </div>
              {isPremium && (
                <div className="flex gap-1 self-end sm:self-auto">
                  <button onClick={() => startEditGasto(d)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                  <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Dívidas list - grouped by description */}
      <div>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><CreditCard className="w-5 h-5 text-destructive" /> Dívidas</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {dividas.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma dívida cadastrada</div>}
          {Object.entries(groupedDividas).map(([desc, items]) => {
            const isExpanded = expandedDivida === desc;
            const paidCount = items.filter(d => d.paid).length;
            const totalItems = items.length;
            const hasMultiple = totalItems > 1;
            const totalValue = items.reduce((s, d) => s + Number(d.amount), 0);

            if (!hasMultiple) {
              // Single item - render normally
              const d = items[0];
              return (
                <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className={`flex flex-col sm:grid sm:grid-cols-[auto_1fr_auto_auto_auto_auto] gap-1 sm:gap-4 px-4 sm:px-5 py-3 border-t border-border sm:items-center hover:bg-muted/30 transition-colors ${d.paid ? "opacity-60" : ""}`}>
                  <button onClick={() => handleTogglePaid(d.id, !!d.paid)} className="self-start sm:self-center p-0.5">
                    {d.paid ? <CheckCircle className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm font-medium ${d.paid ? "line-through text-muted-foreground" : ""}`}>{d.description}</span>
                    {(d as any).creditor_name && (
                      <span className="text-[10px] text-primary font-medium ml-1.5">• Dívida com {(d as any).creditor_name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:contents">
                    <span className="text-xs bg-destructive/10 text-destructive rounded-full px-2.5 py-1 font-medium">{d.details || "—"}</span>
                    <span className="text-xs sm:text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                    <span className="text-sm font-semibold text-destructive ml-auto sm:ml-0 sm:text-right">-{fmt(Number(d.amount))}</span>
                  </div>
                  {isPremium && (
                    <div className="flex gap-1 self-end sm:self-auto">
                      <button onClick={() => startEditDivida(d)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-md hover:bg-destructive/10 transition-colors"><Trash2 className="w-3.5 h-3.5 text-destructive" /></button>
                    </div>
                  )}
                </motion.div>
              );
            }

            // Multiple items (installments) - render as expandable group
            return (
              <div key={desc} className="border-t border-border">
                <button
                  onClick={() => setExpandedDivida(isExpanded ? null : desc)}
                  className="w-full flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-muted/30 transition-colors text-left"
                >
                  <CreditCard className="w-5 h-5 text-destructive shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{desc}</p>
                    {(items[0] as any).creditor_name && (
                      <p className="text-[10px] text-primary font-medium">Dívida com {(items[0] as any).creditor_name}</p>
                    )}
                    <p className="text-xs text-muted-foreground">{paidCount}/{totalItems} parcelas pagas</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-destructive">-{fmt(totalValue)}</p>
                      <p className="text-[10px] text-muted-foreground">{totalItems}x {fmt(Number(items[0].amount))}</p>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </button>
                {isExpanded && (
                  <div className="bg-muted/20 border-t border-border">
                    {items.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((d, i) => (
                      <div key={d.id} className={`flex items-center gap-3 px-6 sm:px-8 py-2.5 border-b border-border/50 last:border-0 ${d.paid ? "opacity-60" : ""}`}>
                        <button onClick={() => handleTogglePaid(d.id, !!d.paid)} className="p-0.5">
                          {d.paid ? <CheckCircle className="w-4 h-4 text-success" /> : <Circle className="w-4 h-4 text-muted-foreground" />}
                        </button>
                        <span className={`text-xs font-medium flex-1 ${d.paid ? "line-through text-muted-foreground" : ""}`}>
                          {d.details || `Parcela ${i + 1}`}
                        </span>
                        <span className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                        <span className="text-xs font-semibold text-destructive">-{fmt(Number(d.amount))}</span>
                        {isPremium && (
                          <button onClick={() => handleDelete(d.id)} className="p-1 rounded-md hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Assinaturas list */}
      <div>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2"><Repeat className="w-5 h-5 text-primary" /> Assinaturas</h2>
        <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
          {assinaturas.length === 0 && <div className="px-5 py-8 text-center text-sm text-muted-foreground">Nenhuma assinatura cadastrada</div>}
          {assinaturas.map((d, i) => (
            <motion.div key={d.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
              className="flex flex-col sm:grid sm:grid-cols-[1fr_auto_auto_auto_auto] gap-1 sm:gap-4 px-4 sm:px-5 py-3 border-t border-border sm:items-center hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Repeat className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{d.description}</span>
              </div>
              <div className="flex items-center gap-2 sm:contents">
                <span className={`text-xs rounded-full px-2.5 py-1 font-medium ${categoryColors[d.category] || "bg-muted text-muted-foreground"}`}>{d.category}</span>
                <span className="text-xs sm:text-sm text-muted-foreground">{new Date(d.date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</span>
                <span className="text-sm font-semibold text-primary ml-auto sm:ml-0 sm:text-right">-{fmt(Number(d.amount))}/mês</span>
              </div>
              <div className="flex gap-1 self-end sm:self-auto">
                {isPremium && (
                  <button onClick={() => startEditGasto(d)} className="p-1.5 rounded-md hover:bg-muted transition-colors"><Pencil className="w-3.5 h-3.5 text-muted-foreground" /></button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/10" onClick={() => handleCancelAssinatura(d.id)}>
                  Cancelar
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>


      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar {editType === "gasto" ? "gasto" : "dívida"}</DialogTitle></DialogHeader>
          {editType === "gasto" ? (
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-1 block">Descrição</label><input value={formGasto.description} onChange={(e) => setFormGasto(prev => ({ ...prev, description: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Valor (R$)</label><input type="number" value={formGasto.amount} onChange={(e) => setFormGasto(prev => ({ ...prev, amount: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Data</label><input type="date" value={formGasto.date} onChange={(e) => setFormGasto(prev => ({ ...prev, date: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Categoria</label><select value={formGasto.category} onChange={(e) => setFormGasto(prev => ({ ...prev, category: e.target.value }))} className={inputClass}>{expenseCategories.map((c) => <option key={c}>{c}</option>)}</select></div>
              <Button onClick={handleEdit} className="w-full">Salvar alterações</Button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-1 block">Descrição</label><input value={formDivida.description} onChange={(e) => setFormDivida(prev => ({ ...prev, description: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Valor (R$)</label><input type="number" value={formDivida.amount} onChange={(e) => setFormDivida(prev => ({ ...prev, amount: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Data</label><input type="date" value={formDivida.date} onChange={(e) => setFormDivida(prev => ({ ...prev, date: e.target.value }))} className={inputClass} /></div>
              <div><label className="text-sm font-medium mb-1 block">Detalhes</label><input value={formDivida.details} onChange={(e) => setFormDivida(prev => ({ ...prev, details: e.target.value }))} className={inputClass} /></div>
              <Button onClick={handleEdit} className="w-full">Salvar alterações</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DespesasPage;
