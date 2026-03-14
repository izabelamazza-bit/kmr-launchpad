import logoKMR from "@/assets/Logo_KMR.png";

const Footer = () => {
  return (
    <footer className="bg-primary py-10 md:py-14">
      <div className="container">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <img src={logoKMR} alt="KMR" className="h-8 w-auto brightness-0 invert" />

          <nav className="flex gap-6">
            <a href="#beneficios" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Benefícios
            </a>
            <a href="#como-funciona" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Como Funciona
            </a>
            <a href="#faq" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              FAQ
            </a>
            <a href="#contato" className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors">
              Contato
            </a>
          </nav>

          <p className="text-sm text-primary-foreground/50">
            © {new Date().getFullYear()} KMR. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
