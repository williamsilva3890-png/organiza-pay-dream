import { FileBarChart, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const RelatoriosPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display font-bold text-2xl">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Visualize e exporte seus relatórios financeiros</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Exportar PDF
        </Button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-xl p-12 border border-border shadow-card flex flex-col items-center justify-center text-center"
      >
        <FileBarChart className="w-12 h-12 text-muted-foreground/40 mb-4" />
        <h3 className="font-display font-bold text-lg mb-1">Nenhum relatório disponível</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Seus relatórios aparecerão aqui conforme você registrar receitas e despesas.
        </p>
      </motion.div>
    </div>
  );
};

export default RelatoriosPage;
