import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const data = [
  { month: "Set", receitas: 6500, despesas: 4200 },
  { month: "Out", receitas: 7200, despesas: 4800 },
  { month: "Nov", receitas: 7800, despesas: 5100 },
  { month: "Dez", receitas: 8500, despesas: 5500 },
  { month: "Jan", receitas: 7600, despesas: 4600 },
  { month: "Fev", receitas: 8200, despesas: 4750 },
];

const IncomeExpenseBarChart = () => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <h3 className="font-display font-bold text-base mb-4">
        Receitas vs Despesas
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
              stroke="hsl(200 15% 90%)"
            />
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(200 10% 50%)" }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: "hsl(200 10% 50%)" }}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) =>
                `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
              }
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid hsl(200 15% 90%)",
                fontSize: "13px",
              }}
            />
            <Legend
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "13px", paddingTop: "8px" }}
            />
            <Bar
              dataKey="receitas"
              name="Receitas"
              fill="hsl(160 60% 38%)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
            <Bar
              dataKey="despesas"
              name="Despesas"
              fill="hsl(0 72% 55%)"
              radius={[4, 4, 0, 0]}
              barSize={20}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default IncomeExpenseBarChart;
