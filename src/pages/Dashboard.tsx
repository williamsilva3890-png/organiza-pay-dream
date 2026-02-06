import { Routes, Route } from "react-router-dom";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import DashboardHome from "@/pages/dashboard/DashboardHome";
import ReceitasPage from "@/pages/dashboard/ReceitasPage";
import DespesasPage from "@/pages/dashboard/DespesasPage";
import MetasPage from "@/pages/dashboard/MetasPage";
import RelatoriosPage from "@/pages/dashboard/RelatoriosPage";
import ConfigPage from "@/pages/dashboard/ConfigPage";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route index element={<DashboardHome />} />
        <Route path="receitas" element={<ReceitasPage />} />
        <Route path="despesas" element={<DespesasPage />} />
        <Route path="metas" element={<MetasPage />} />
        <Route path="relatorios" element={<RelatoriosPage />} />
        <Route path="config" element={<ConfigPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
