import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Preciso de fiador?",
    answer: "Não. A KMR substitui o fiador no seu contrato de aluguel. Você não precisa pedir favor para parente nem para amigo.",
  },
  {
    question: "Quanto custa?",
    answer: "O valor é proporcional ao aluguel do imóvel e bem mais acessível do que uma caução de 3 meses presa numa conta. Faça uma simulação rápida pelo WhatsApp e veja quanto você paga no seu caso.",
  },
  {
    question: "Quanto tempo demora a aprovação?",
    answer: "Na maioria dos casos, sua garantia é aprovada em poucas horas. Tudo é feito online, sem fila e sem cartório.",
  },
  {
    question: "Quais documentos eu preciso?",
    answer: "Apenas o básico: documento de identidade e comprovação de renda. Sem exigências absurdas e sem montanha de papel.",
  },
  {
    question: "É seguro?",
    answer: "Sim. Nosso contrato é claro, sem letras miúdas, e a solução protege tanto você quanto o proprietário do imóvel. Tudo registrado e transparente.",
  },
  {
    question: "E se eu atrasar o aluguel?",
    answer: "Entre em contato com a gente o quanto antes. A KMR ajuda a regularizar a situação sem que isso vire um problema maior, evitando dor de cabeça para você.",
  },
];

const FAQ = () => {
  return (
    <section id="faq" className="py-16 md:py-24 bg-white">
      <div className="container">
        <div className="text-center mb-12 md:mb-16 max-w-2xl mx-auto">
          <span className="text-sm font-semibold text-[#2F80ED] uppercase tracking-wider">FAQ</span>
          <h2 className="font-display text-2xl md:text-3xl lg:text-4xl font-bold text-[#0F2A44] mt-3">
            Perguntas frequentes
          </h2>
          <p className="text-[#4F4F4F] mt-4 text-base md:text-lg">
            Tire suas dúvidas sobre alugar com a KMR.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-[#F5F7FA] rounded-[14px] border border-[#E8EDF2] px-6 data-[state=open]:shadow-md transition-shadow"
              >
                <AccordionTrigger className="text-left text-[#0F2A44] font-medium hover:no-underline py-5">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-[#4F4F4F] leading-relaxed pb-5">
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
