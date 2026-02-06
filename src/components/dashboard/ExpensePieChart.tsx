import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const data = [
  { name: "Alimentação", value: 1200, color: "hsl(35 95% 55%)" },
  { name: "Transporte", value: 800, color: "hsl(210 70% 55%)" },
  { name: "Moradia", value: 1500, color: "hsl(280 60% 55%)" },
  { name: "Lazer", value: 450, color: "hsl(330 70% 55%)" },
  { name: "Saúde", value: 300, color: "hsl(160 45% 50%)" },
  { name: "Outros", value: 500, color: "hsl(200 10% 65%)" },
];

const ExpensePieChart = () => {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-card">
      <h3 className="font-display font-bold text-base mb-4">Despesas por categoria</h3>
      <div className="flex flex-col sm:flex-row items-center gap-6">
        <div className="w-48 h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
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
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 text-sm">
          {data.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-muted-foreground">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ExpensePieChart;
