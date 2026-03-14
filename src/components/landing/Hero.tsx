import { Shield, Building2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroBg from "@/assets/hero-bg.jpg";

const WHATSAPP_LINK = "https://wa.me/5500000000000?text=Olá! Gostaria de saber mais sobre a garantia locatícia KMR.";

const Hero = () => {
  return (
    <section className="relative pt-24 pb-16 md:pt-36 md:pb-28 overflow-hidden">
      {/* Background image + overlay */}
      <div className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/75 to-background/70" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      </div>

      <div className="container">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-6 md:space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">
              <Shield size={16} />
              Garantia locatícia
            </div>

            <h1 className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[3.25rem] font-bold leading-tight text-primary">
              Garantia de aluguel simples, clara e sem burocracia.
            </h1>

            <p className="text-base md:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
              Permita que seus clientes aluguem sem fiador e sem cauções absurdas, com uma garantia transparente e segura para sua imobiliária.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-8 h-12 shadow-lg shadow-accent/25">
                <a href="#contato">Agendar demonstração</a>
              </Button>
              <Button asChild size="lg" variant="outline" className="font-semibold text-base px-8 h-12 border-2">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  Falar no WhatsApp
                </a>
              </Button>
            </div>
          </div>

          {/* Illustration */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="relative w-full max-w-md">
              {/* Main card */}
              <div className="bg-card rounded-2xl shadow-2xl shadow-primary/10 p-8 border border-border">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Shield className="text-accent" size={24} />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">Garantia Ativa</div>
                    <div className="text-sm text-muted-foreground">Aluguel garantido</div>
                  </div>
                  <div className="ml-auto px-3 py-1 rounded-full bg-accent/10 text-accent text-xs font-semibold">
                    Aprovado ✓
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2.5 bg-muted rounded-full w-full" />
                  <div className="h-2.5 bg-muted rounded-full w-4/5" />
                  <div className="h-2.5 bg-muted rounded-full w-3/5" />
                </div>
              </div>

              {/* Floating card 1 */}
              <div className="absolute -top-4 -right-4 bg-card rounded-xl shadow-xl border border-border p-4 animate-fade-in-up">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Building2 className="text-secondary" size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Imobiliárias</div>
                    <div className="text-sm font-semibold text-foreground">+200 parceiras</div>
                  </div>
                </div>
              </div>

              {/* Floating card 2 */}
              <div className="absolute -bottom-4 -left-4 bg-card rounded-xl shadow-xl border border-border p-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Smartphone className="text-accent" size={20} />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Aprovação</div>
                    <div className="text-sm font-semibold text-foreground">Em minutos</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
