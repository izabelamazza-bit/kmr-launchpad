import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Preciso de fiador?",
    answer: "Não! Com a KMR, seus clientes podem alugar sem fiador. A garantia locatícia substitui essa necessidade, simplificando o processo para a imobiliária e para o locatário.",
  },
  {
    question: "Quanto custa a garantia?",
    answer: "O custo varia conforme o valor do aluguel e o perfil do locatário. Entre em contato conosco para uma demonstração personalizada e saiba os valores exatos para a sua imobiliária.",
  },
  {
    question: "Quanto tempo demora a análise?",
    answer: "Nossa análise é rápida. Na maioria dos casos, a aprovação acontece em poucas horas, permitindo que sua imobiliária feche o contrato no mesmo dia.",
  },
  {
    question: "Quais documentos são necessários?",
    answer: "O processo é simplificado. Geralmente precisamos apenas de documentos básicos de identificação e comprovação de renda do locatário. Sem burocracia desnecessária.",
  },
  {
    question: "A imobiliária recebe o aluguel garantido?",
    answer: "Sim! Em caso de inadimplência, a KMR garante o recebimento do aluguel pela imobiliária, conforme as condições da garantia contratada.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-card">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-secondary uppercase tracking-wider">FAQ</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-primary mt-3">
            Perguntas frequentes
          </h2>
          <p className="text-muted-foreground mt-4 text-base md:text-lg">
            Tire suas dúvidas sobre a garantia locatícia KMR.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-background rounded-xl border border-border px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-foreground font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
