import { Check, X } from "lucide-react";

const semKmr = [
  "Precisa apresentar fiador ou pagar caução adiantado",
  "Burocracia e demora para aprovação da locação",
  "Perda de tempo com idas ao cartório e papelada",
];

const comKmr = [
  "Aluguel sem fiador, sem burocracia ou caução",
  "Análise de crédito em até 2 horas, 100% online",
  "Documentos assinados digitalmente na plataforma",
];

const Comparativo = () => {
  return (
    <section className="py-16 md:py-24 bg-[#0F2A44]">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-xs font-semibold text-[#7EB8F7] uppercase tracking-[0.2em]">
            Comparativo
          </span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white mt-3">
            A diferença que a KMR faz
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto">
          {/* Sem KMR */}
          <div className="bg-white/5 border border-white/10 rounded-[14px] p-6 md:p-8">
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-6">
              <span className="text-[#FF7A7A]">Sem</span> a KMR
            </h3>
            <ul className="space-y-4">
              {semKmr.map((item) => (
                <li key={item} className="flex gap-3 items-start text-[#A8C0D6]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#FF7A7A]/15 flex items-center justify-center mt-0.5">
                    <X size={14} className="text-[#FF7A7A]" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Com KMR */}
          <div className="bg-[#2F80ED] rounded-[14px] p-6 md:p-8 shadow-2xl shadow-[#2F80ED]/30">
            <h3 className="font-display text-xl md:text-2xl font-bold text-white mb-6">
              <span className="font-extrabold">Com</span> a KMR
            </h3>
            <ul className="space-y-4">
              {comKmr.map((item) => (
                <li key={item} className="flex gap-3 items-start text-white">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center mt-0.5">
                    <Check size={14} className="text-white" strokeWidth={3} />
                  </span>
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Comparativo;