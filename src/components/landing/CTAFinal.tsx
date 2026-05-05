import { Button } from "@/components/ui/button";

const CTAFinal = () => {
  return (
    <section className="py-16 md:py-24 bg-[#27AE60]">
      <div className="container text-center max-w-2xl mx-auto space-y-6">
        <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-tight">
          Pronto para alugar sem complicação?
        </h2>
        <p className="text-white/90 text-base md:text-lg">
          Simule agora e descubra quanto você economiza sem precisar de fiador.
        </p>
        <Button
          asChild
          className="bg-white hover:bg-white/90 text-[#27AE60] font-bold text-base px-[22px] h-12 rounded-[9px] shadow-lg shadow-black/10"
        >
          <a href="#contato">Simular minha garantia</a>
        </Button>
      </div>
    </section>
  );
};

export default CTAFinal;