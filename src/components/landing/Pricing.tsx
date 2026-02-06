import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

const plans = [
  {
    name: "Gratuito",
    price: "R$ 0",
    period: "para sempre",
    description: "Para começar a se organizar",
    features: [
      "Dashboard financeiro",
      "Cadastro de receitas e despesas",
      "3 metas financeiras",
      "Gráficos básicos",
      "1 perfil (pessoal ou negócio)",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Premium",
    price: "R$ 19,90",
    period: "/mês",
    description: "Para quem quer o controle total",
    features: [
      "Tudo do plano gratuito",
      "Metas ilimitadas",
      "Conta compartilhada (casais)",
      "Relatórios avançados",
      "Exportar PDF e Excel",
      "Alertas personalizados",
      "Suporte prioritário",
    ],
    cta: "Assinar Premium",
    highlighted: true,
  },
];

const Pricing = () => {
  return (
    <section id="planos" className="py-20 lg:py-28 bg-muted/40">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-2xl mx-auto mb-16"
        >
          <span className="text-sm font-semibold text-primary uppercase tracking-wider">
            Planos
          </span>
          <h2 className="font-display text-3xl sm:text-4xl font-bold mt-3 mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-muted-foreground text-lg">
            Comece grátis e evolua quando precisar de mais.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.15 }}
              className={`relative bg-card rounded-2xl p-8 border shadow-card ${
                plan.highlighted
                  ? "border-primary shadow-card-hover ring-1 ring-primary/20"
                  : "border-border"
              }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1 text-xs font-semibold text-primary-foreground">
                  <Sparkles className="w-3.5 h-3.5" />
                  Mais popular
                </div>
              )}

              <div className="mb-6">
                <h3 className="font-display font-bold text-xl mb-1">
                  {plan.name}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {plan.description}
                </p>
              </div>

              <div className="mb-6">
                <span className="font-display text-4xl font-extrabold">
                  {plan.price}
                </span>
                <span className="text-muted-foreground text-sm ml-1">
                  {plan.period}
                </span>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm">
                    <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/dashboard">
                <Button
                  variant={plan.highlighted ? "hero" : "outline"}
                  size="lg"
                  className="w-full"
                >
                  {plan.cta}
                </Button>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
