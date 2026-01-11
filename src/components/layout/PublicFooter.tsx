import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

const PublicFooter = () => {
  return (
    <footer className="border-t border-border bg-card">
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <img 
                src="/imgs/pdf_generator.png" 
                alt="PDF Generator" 
                className="h-9 w-9"
              />
                <span className="text-xl font-bold">
                <span style={{ color: "#FD8216" }}>PDF</span>
                <span style={{ color: "#1470BB" }}> GENERATOR</span>
                </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              A solução completa para geração de PDFs profissionais de forma rápida e segura.
            </p>
          </div>

          {/* Produto */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Produto</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/planos" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Planos e Preços
                </Link>
              </li>
              <li>
                <Link to="/documentacao" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Documentação
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Suporte</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/documentacao" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <a href="mailto:suporte@pdfgenerator.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Contato
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-foreground">Legal</h4>
            <ul className="space-y-2">
              <li>
                <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link to="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Política de Privacidade
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border">
          <p className="text-center text-sm text-muted-foreground">
            © {new Date().getFullYear()} PDF Generator. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PublicFooter;
