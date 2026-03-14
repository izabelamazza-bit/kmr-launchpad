import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá! Gostaria de saber mais sobre a garantia locatícia KMR.";

const Hero = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center overflow-hidden">
      {/* Background image */}
      <img
        src={heroBg}
        alt="Profissionais fechando negócio com aperto de mãos"
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(210,63%,16%)]/85 via-[hsl(210,63%,16%)]/65 to-[hsl(210,63%,16%)]/40" />

      <div className="container relative z-10 py-24 md:py-32">
        <div className="max-w-2xl space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/15 text-white text-sm font-medium backdrop-blur-sm">
            <Shield size={16} />
            Garantia locatícia
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold leading-tight text-white">
            Garantia de aluguel simples, clara e sem burocracia.
          </h1>

          <p className="text-base md:text-lg text-white/80 max-w-xl leading-relaxed">
            Permita que seus clientes aluguem sem fiador e sem cauções absurdas, com uma garantia transparente e segura para sua imobiliária.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 h-12 shadow-lg shadow-accent/25">
              <a href="#contato">Agendar demonstração</a>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold text-base px-8 h-12 border-2 border-white/40 text-white hover:bg-white/10 hover:text-white bg-transparent">
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
