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
                <a target="_blank" href="https://perotedev.com" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
                <Link target="_blank" to="https://lppqqjivhmlqnkhdfnib.supabase.co/storage/v1/object/sign/pdf_generator/Termos_de_Uso_do_Sistema_PDF_Generator.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNjVjNmZjYi1jZDcxLTRiMGYtYmM4Yy02MTE4YThmNzMxYzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwZGZfZ2VuZXJhdG9yL1Rlcm1vc19kZV9Vc29fZG9fU2lzdGVtYV9QREZfR2VuZXJhdG9yLnBkZiIsImlhdCI6MTc2ODE2NzEwMiwiZXhwIjoxNzk5NzAzMTAyfQ.kBnZO51IoU2zYWVgKfw3ppNK09n3Ui3HQzyL9kBMk9Q" className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Termos de Uso
                </Link>
              </li>
              <li>
                <Link target="_blank" to="https://lppqqjivhmlqnkhdfnib.supabase.co/storage/v1/object/sign/pdf_generator/Politica_de_Privacidade_PDF_Generator.pdf?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9mNjVjNmZjYi1jZDcxLTRiMGYtYmM4Yy02MTE4YThmNzMxYzYiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJwZGZfZ2VuZXJhdG9yL1BvbGl0aWNhX2RlX1ByaXZhY2lkYWRlX1BERl9HZW5lcmF0b3IucGRmIiwiaWF0IjoxNzY4MTY3MTQ4LCJleHAiOjE3OTk3MDMxNDh9.H3HduGatTU8XZqvbr5QV9hMYnM2xdmZoIC-UnHOwYHA" className="text-sm text-muted-foreground hover:text-primary transition-colors">
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
