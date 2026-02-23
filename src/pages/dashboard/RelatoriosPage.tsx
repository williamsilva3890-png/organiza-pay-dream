import { FileBarChart, Download, Lock, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useFinanceData } from "@/hooks/useFinanceData";

interface Props {
  finance: ReturnType<typeof useFinanceData>;
}

const RelatoriosPage = ({ finance }: Props) => {
  const { isPremium, receitas, despesas, totalReceitas, totalDespesas, saldo } = finance;

  const handleExportPDF = () => {
    if (!isPremium) {
      toast.error("Exportar PDF está disponível apenas no plano Premium! 🔒");
      return;
    }

    // Generate a simple PDF report
    const content = `
RELATÓRIO FINANCEIRO - OrganizaPay
===================================
Data: ${new Date().toLocaleDateString("pt-BR")}

RESUMO
------
Total de Rendas: R$ ${totalReceitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Total de Despesas: R$ ${totalDespesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
Saldo: R$ ${saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

RENDAS
------
${receitas.map(r => `${r.date} | ${r.description} | R$ ${Number(r.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | ${r.category}`).join("\n") || "Nenhuma renda cadastrada."}

DESPESAS
--------
${despesas.map(d => `${d.date} | ${d.description} | R$ ${Number(d.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} | ${d.category} | ${d.type}`).join("\n") || "Nenhuma despesa cadastrada."}
`;

    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-organiza-pay-${new Date().toISOString().slice(0, 10)}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso!");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visualize e exporte seus relatórios financeiros</p>
        </div>
        <Button variant={isPremium ? "outline" : "default"} className="gap-2" onClick={handleExportPDF}>
          {isPremium ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          Exportar PDF
        </Button>
      </div>

      {!isPremium && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-2.5">
          <Crown className="w-3.5 h-3.5" />
          <span>Exportação de relatórios disponível apenas no plano Premium 🔒</span>
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-12 border border-border shadow-card flex flex-col items-center justify-center text-center"
      >
        <FileBarChart className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-display font-bold text-lg mb-1">Nenhum relatório disponível</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Seus relatórios aparecerão aqui conforme você registrar rendas e despesas.
        </p>
      </motion.div>
    </div>
  );
};

export default RelatoriosPage;
