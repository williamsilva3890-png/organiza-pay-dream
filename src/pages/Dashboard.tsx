import DashboardLayout from "@/components/dashboard/DashboardLayout";
import FinancialCards from "@/components/dashboard/FinancialCards";
import ExpensePieChart from "@/components/dashboard/ExpensePieChart";
import IncomeExpenseBarChart from "@/components/dashboard/IncomeExpenseBarChart";
import TransactionsList from "@/components/dashboard/TransactionsList";
import GoalsProgress from "@/components/dashboard/GoalsProgress";

const Dashboard = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <FinancialCards />

        <div className="grid lg:grid-cols-2 gap-6">
          <IncomeExpenseBarChart />
          <ExpensePieChart />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <TransactionsList />
          <GoalsProgress />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
