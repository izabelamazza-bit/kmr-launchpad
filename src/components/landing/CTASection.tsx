import { Button } from "@/components/ui/button";

const CTASection = () => {
  return (
    <section className="py-16 md:py-24">
      <div className="container">
        <div className="relative rounded-3xl bg-primary overflow-hidden px-6 py-14 md:py-20 text-center">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-0">
            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-60 h-60 bg-accent/15 rounded-full blur-3xl" />
          </div>

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight">
              Transforme a forma como sua imobiliária aprova locações.
            </h2>
            <p className="text-primary-foreground/80 text-base md:text-lg max-w-lg mx-auto">
              Junte-se às imobiliárias que já simplificaram o processo de garantia locatícia com a KMR.
            </p>
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base px-10 h-12 shadow-lg shadow-accent/30"
            >
              <a href="#contato">Agendar demonstração</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
