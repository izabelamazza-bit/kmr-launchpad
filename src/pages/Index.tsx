import Header from "@/components/landing/Header";
import Hero from "@/components/landing/Hero";
import Benefits from "@/components/landing/Benefits";
import HowItWorks from "@/components/landing/HowItWorks";
import FAQ from "@/components/landing/FAQ";
import ContactForm from "@/components/landing/ContactForm";
import CTASection from "@/components/landing/CTASection";
import Footer from "@/components/landing/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <Hero />
        <Benefits />
        <HowItWorks />
        <FAQ />
        <CTASection />
        <ContactForm />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
