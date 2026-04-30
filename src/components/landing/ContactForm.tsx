import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";

const formSchema = z.object({
  nome: z.string().trim().min(2, "Informe seu nome").max(100),
  cidade: z.string().trim().min(2, "Informe a cidade do imóvel").max(100),
  telefone: z.string().trim().min(8, "Informe um telefone válido").max(20),
  email: z.string().trim().email("Informe um email válido").max(255),
});

type FormValues = z.infer<typeof formSchema>;

const WHATSAPP_NUMBER = "5500000000000";

const ContactForm = () => {
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: "",
      cidade: "",
      telefone: "",
      email: "",
    },
  });

  const onSubmit = (data: FormValues) => {
    const message = `Olá! Quero alugar sem fiador.\n\nNome: ${data.nome}\nCidade do imóvel: ${data.cidade}\nTelefone: ${data.telefone}\nEmail: ${data.email}`;
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    toast({
      title: "Redirecionando para o WhatsApp!",
      description: "É só enviar a mensagem para fazer sua simulação.",
    });

    form.reset();
  };

  return (
    <section id="contato" className="py-16 md:py-24">
      <div className="container">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-10">
            <span className="text-sm font-semibold text-secondary uppercase tracking-wider">Simulação</span>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-primary mt-3">
              Simule sua garantia
            </h2>
            <p className="text-muted-foreground mt-3">
              Preencha seus dados e fale com a gente no WhatsApp.
            </p>
          </div>

          <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-lg shadow-primary/5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Seu nome completo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cidade"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cidade do imóvel</FormLabel>
                      <FormControl>
                        <Input placeholder="Onde você quer alugar" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="telefone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefone</FormLabel>
                      <FormControl>
                        <Input placeholder="(00) 00000-0000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="seu@email.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold text-base h-12 shadow-md shadow-accent/20"
                >
                  Simular agora
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactForm;
