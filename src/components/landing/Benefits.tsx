import { CheckCircle2, FileText, Zap, TrendingUp, ShieldCheck } from "lucide-react";

const benefits = [
  {
    icon: CheckCircle2,
    title: "Processo simples",
    description: "Sem burocracia ou regras confusas. Tudo descomplicado para sua imobiliária.",
  },
  {
    icon: FileText,
    title: "Regras claras",
    description: "Sua imobiliária sabe exatamente como funciona. Sem letras miúdas.",
  },
  {
    icon: Zap,
    title: "Aprovação rápida",
    description: "Menos tempo analisando garantias. Mais tempo fechando negócios.",
  },
  {
    icon: TrendingUp,
    title: "Mais locações aprovadas",
    description: "Mais negócios fechados com uma garantia acessível para seus clientes.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança para a imobiliária",
    description: "Garantia de recebimento do aluguel. Sua imobiliária sempre protegida.",
  },
];

const Benefits = () => {
  return (
    <section id="beneficios" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Benefícios</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary mt-3">
            Por que imobiliárias escolhem a KMR
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            Uma garantia locatícia pensada para simplificar o dia a dia da sua imobiliária.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {benefits.map((benefit, index) => (
            <div
              key={index}
              className="group p-6 md:p-8 rounded-2xl bg-background border border-border hover:border-secondary/30 hover:shadow-lg hover:shadow-secondary/5 transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/15 transition-colors">
                <benefit.icon className="text-secondary" size={24} />
              </div>
              <h3 className="font-semibold text-lg text-foreground mb-2">{benefit.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
