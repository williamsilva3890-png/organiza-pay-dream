import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceData } from "@/hooks/useFinanceData";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ReceitasPage from "@/pages/dashboard/ReceitasPage";
import DespesasPage from "@/pages/dashboard/DespesasPage";
import MetasPage from "@/pages/dashboard/MetasPage";
import RelatoriosPage from "@/pages/dashboard/RelatoriosPage";
import ConfigPage from "@/pages/dashboard/ConfigPage";
import NotificationPopup from "@/components/dashboard/NotificationPopup";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const finance = useFinanceData();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout profile={finance.profile} isPremium={finance.isPremium}>
      <Routes>
        <Route index element={<DashboardHome finance={finance} />} />
        <Route path="receitas" element={<ReceitasPage finance={finance} />} />
        <Route path="despesas" element={<DespesasPage finance={finance} />} />
        <Route path="metas" element={<MetasPage finance={finance} />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="config" element={<ConfigPage finance={finance} />} />
      </Routes>
      <NotificationPopup
        totalReceitas={finance.totalReceitas}
        totalDespesas={finance.totalDespesas}
        saldo={finance.saldo}
        metasCount={finance.metas.length}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
