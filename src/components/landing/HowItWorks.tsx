import { UserPlus, Search, FileCheck, ShieldCheck } from "lucide-react";

const steps = [
  {
    icon: UserPlus,
    step: "01",
    title: "Você se cadastra",
    description: "Em poucos minutos, direto pelo celular. Simples e sem papelada.",
  },
  {
    icon: Search,
    step: "02",
    title: "Analisamos seu perfil",
    description: "Avaliação rápida, justa e sem burocracia desnecessária.",
  },
  {
    icon: FileCheck,
    step: "03",
    title: "Sua garantia é aprovada",
    description: "Você recebe a confirmação e pode seguir com o aluguel.",
  },
  {
    icon: ShieldCheck,
    step: "04",
    title: "Você fecha o imóvel",
    description: "Mude para o seu novo lar sem fiador e sem caução alta.",
  },
];

const HowItWorks = () => {
  return (
    <section id="como-funciona" className="py-16 md:py-24 bg-[#F5F7FA]">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-[#2F80ED] uppercase tracking-wider">Como funciona</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F2A44] mt-3">
            Como funciona para você
          </h2>
          <p className="text-[#4F4F4F] mt-4 text-base md:text-lg">
            Do cadastro à mudança, em 4 passos simples e rápidos.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <div key={index} className="relative text-center group">
              {/* Connector line (desktop) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-[60%] w-[80%] h-[2px] bg-[#E8EDF2]" />
              )}

              <div className="relative z-10 mx-auto w-20 h-20 rounded-2xl bg-[#EBF3FF] flex items-center justify-center mb-5">
                <item.icon className="text-[#2F80ED]" size={32} />
              </div>

              <span className="text-xs font-bold text-[#2F80ED] uppercase tracking-widest">Passo {item.step}</span>
              <h3 className="font-semibold text-lg text-[#0F2A44] mt-2 mb-2">{item.title}</h3>
              <p className="text-[#4F4F4F] text-sm leading-relaxed">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
