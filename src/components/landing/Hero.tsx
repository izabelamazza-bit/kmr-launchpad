import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá! Quero alugar sem fiador. Pode me ajudar?";

const stats = [
  { value: "+12.000", label: "Inquilinos aprovados" },
  { value: "98%", label: "Taxa de aprovação" },
  { value: "< 2h", label: "Tempo médio de análise" },
];

const Hero = () => {
  return (
    <section className="relative bg-[#0F2A44] pt-28 md:pt-32">
      <div className="container py-16 md:py-24">
        <div className="max-w-3xl space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(47,128,237,0.15)] border border-[rgba(47,128,237,0.30)] text-[#7EB8F7] text-sm font-medium">
            <span aria-hidden>✦</span>
            Aluguel sem fiador
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-[1.1] text-white">
            Alugue sem fiador, sem caução e sem{" "}
            <span className="text-[#2F80ED]">burocracia.</span>
          </h1>

          <p className="text-base md:text-lg text-[#A8C0D6] max-w-xl leading-relaxed">
            Aprovação rápida e 100% digital. Sua garantia de aluguel aprovada em poucas horas, sem dor de cabeça.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              asChild
              className="bg-white hover:bg-white/90 text-[#0F2A44] font-bold text-base px-[22px] h-12 rounded-[9px] shadow-lg shadow-black/10"
            >
              <a href="#contato">Quero alugar sem fiador</a>
            </Button>
            <Button
              asChild
              variant="outline"
              className="font-semibold text-base px-[22px] h-12 rounded-[9px] border-2 border-white/50 text-white hover:bg-white/10 hover:text-white bg-transparent"
            >
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>

          <div className="border-t border-white/10 pt-8 mt-10 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="font-display text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-none">
                  {s.value}
                </div>
                <div className="text-xs sm:text-sm text-[#A8C0D6] mt-2">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
