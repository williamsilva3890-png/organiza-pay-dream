import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useAdmin } from "@/hooks/useAdmin";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ReceitasPage from "@/pages/dashboard/ReceitasPage";
import DespesasPage from "@/pages/dashboard/DespesasPage";
import MetasPage from "@/pages/dashboard/MetasPage";
import RelatoriosPage from "@/pages/dashboard/RelatoriosPage";
import ConfigPage from "@/pages/dashboard/ConfigPage";
import ChatPage from "@/pages/dashboard/ChatPage";
import AdminPage from "@/pages/dashboard/AdminPage";
import WhatsAppPage from "@/pages/dashboard/WhatsAppPage";
import FluxoCaixaPage from "@/pages/dashboard/FluxoCaixaPage";
import ClientesPage from "@/pages/dashboard/ClientesPage";
import VendasPage from "@/pages/dashboard/VendasPage";
import NotificationPopup from "@/components/dashboard/NotificationPopup";
import AdminBroadcastBanner from "@/components/dashboard/AdminBroadcastBanner";

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const finance = useFinanceData();
  const { isAdmin } = useAdmin();

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <DashboardLayout profile={finance.profile} isPremium={finance.isPremium} onProfileUpdate={finance.fetchAll} isAdmin={isAdmin} subscription={finance.subscription}>
      <AdminBroadcastBanner />
      <Routes>
        <Route index element={<DashboardHome finance={finance} />} />
        <Route path="receitas" element={<ReceitasPage finance={finance} />} />
        <Route path="despesas" element={<DespesasPage finance={finance} />} />
        <Route path="metas" element={<MetasPage finance={finance} />} />
        {isEntrepreneur && <Route path="fluxo-caixa" element={<FluxoCaixaPage finance={finance} />} />}
        {isEntrepreneur && <Route path="clientes" element={<ClientesPage isPremium={finance.isPremium} />} />}
        {isEntrepreneur && <Route path="vendas" element={<VendasPage isPremium={finance.isPremium} />} />}
        <Route path="relatorios" element={<RelatoriosPage finance={finance} />} />
        <Route path="config" element={<ConfigPage finance={finance} />} />
        <Route path="chat" element={<ChatPage isPremium={finance.isPremium} />} />
        <Route path="whatsapp" element={<WhatsAppPage isPremium={finance.isPremium} />} />
        {isAdmin && <Route path="admin" element={<AdminPage />} />}
      </Routes>
      <NotificationPopup
        totalReceitas={finance.totalReceitas}
        totalDespesas={finance.totalDespesas}
        saldo={finance.saldo}
        metasCount={finance.metas.length}
        despesasPendentes={finance.despesas.filter(d => !d.paid).length}
        expiresAt={finance.subscription.expires_at}
      />
    </DashboardLayout>
  );
};

export default Dashboard;
