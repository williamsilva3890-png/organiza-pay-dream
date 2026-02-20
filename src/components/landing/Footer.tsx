import logoImg from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="border-t border-border py-12 bg-card">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <img src={logoImg} alt="OrganizaPay" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-display font-bold text-lg">
              Organiza<span className="text-primary">Pay</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#funcionalidades" className="hover:text-foreground transition-colors">
              Funcionalidades
            </a>
            <a href="#planos" className="hover:text-foreground transition-colors">
              Planos
            </a>
            <span>Privacidade</span>
            <span>Termos</span>
          </div>

          <p className="text-xs text-muted-foreground">
            © 2026 OrganizaPay. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
