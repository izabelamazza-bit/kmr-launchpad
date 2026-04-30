import { UserX, Wallet, Zap, TrendingUp, Smartphone, ShieldCheck } from "lucide-react";

const benefits = [
  {
    icon: UserX,
    title: "Sem fiador",
    description: "Você não precisa pedir favor para ninguém. A KMR substitui o fiador no seu contrato.",
  },
  {
    icon: Wallet,
    title: "Sem caução alta",
    description: "Esqueça depósito de 3 aluguéis preso numa conta. Mais dinheiro no seu bolso para a mudança.",
  },
  {
    icon: Zap,
    title: "Aprovação rápida",
    description: "Análise em poucas horas, tudo online. Você não fica esperando dias por uma resposta.",
  },
  {
    icon: TrendingUp,
    title: "Mais chance de aprovar",
    description: "Seu perfil é avaliado de forma justa e transparente, aumentando suas chances de conseguir o imóvel.",
  },
  {
    icon: Smartphone,
    title: "100% digital",
    description: "Faça tudo pelo celular. Sem filas, sem papelada e sem cartório.",
  },
  {
    icon: ShieldCheck,
    title: "Segurança para todos",
    description: "Você aluga tranquilo e o proprietário fica protegido. Todo mundo sai ganhando.",
  },
];

const Benefits = () => {
  return (
    <section id="beneficios" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Benefícios</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary mt-3">
            Por que escolher a KMR para alugar
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            Uma forma mais simples e acessível de conseguir o imóvel que você quer.
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
