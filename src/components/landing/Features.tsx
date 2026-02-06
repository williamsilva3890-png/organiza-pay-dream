import { motion } from "framer-motion";
import {
  BarChart3,
  Target,
  Users,
  Bell,
  PieChart,
  ArrowUpDown,
} from "lucide-react";

const features = [
  {
    icon: BarChart3,
    title: "Dashboard claro",
    description:
      "Veja saldo, receitas e despesas do mês em um só lugar. Sem complicação.",
  },
  {
    icon: ArrowUpDown,
    title: "Receitas e despesas",
    description:
      "Cadastre ganhos e gastos com categorias. Separe finanças pessoais e do negócio.",
  },
  {
    icon: PieChart,
    title: "Gráficos simples",
    description:
      "Gráficos de pizza e barras para entender para onde vai seu dinheiro.",
  },
  {
    icon: Target,
    title: "Metas financeiras",
    description:
      "Defina metas com valor, prazo e acompanhe o progresso visualmente.",
  },
  {
    icon: Users,
    title: "Conta compartilhada",
    description:
      "Para casais: dois usuários no mesmo painel, com metas conjuntas.",
  },
  {
    icon: Bell,
    title: "Alertas inteligentes",
    description:
      "Receba avisos quando seus gastos ultrapassarem os limites definidos.",
  },
];

const Features = () => {
  return (
    <section id="funcionalidades" className="py-20 lg:py-28">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Funcionalidades
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 mb-4">
            Tudo que você precisa para{" "}
            <span className="text-gradient-primary">organizar suas finanças</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Ferramentas simples e poderosas para empreendedores e casais.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="group relative bg-card rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-display font-bold text-lg mb-2">
                {feature.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
