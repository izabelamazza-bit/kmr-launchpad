import { UserPlus, Search, FileCheck, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Cadastro",
    description: "A imobiliária cadastra o locatário na plataforma.",
  },
  {
    icon: Search,
    step: "02",
    title: "Análise",
    description: "Analisamos o perfil rapidamente.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Emissão",
    description: "Emitimos a garantia locatícia.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Garantia",
    description: "O aluguel fica garantido.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-24">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Como funciona</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary mt-3">
            Simples e rápido em 4 passos
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            Do cadastro à garantia aprovada, tudo de forma ágil e transparente.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-border" />
              )}

              <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center mb-5 group-hover:bg-secondary/15 transition-colors">
                <item.icon className="text-secondary" size={32} />
              </div>

              <span className="text-xs font-bold text-secondary uppercase tracking-widest">Passo {item.step}</span>
              <h3 className="font-semibold text-lg text-foreground mt-2 mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
