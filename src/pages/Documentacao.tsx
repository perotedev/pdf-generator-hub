import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Book,
  Code,
  Zap,
  Settings,
  HelpCircle,
  ChevronRight,
} from "lucide-react";

const Documentacao = () => {
  const [activeSection, setActiveSection] = useState("introducao");

  const sections = [
    { id: "introducao", label: "Introdução", icon: Book },
    { id: "inicio-rapido", label: "Início Rápido", icon: Zap },
    { id: "api", label: "Referência da API", icon: Code },
    { id: "configuracao", label: "Configuração", icon: Settings },
    { id: "faq", label: "FAQ", icon: HelpCircle },
  ];

  const content: Record<string, { title: string; content: React.ReactNode }> = {
    introducao: {
      title: "Introdução ao PDF Generator",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            O PDF Generator é uma plataforma completa para geração de documentos
            PDF de forma programática. Com nossa API RESTful, você pode criar
            PDFs profissionais a partir de HTML, Markdown ou templates
            predefinidos.
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            Principais recursos
          </h3>
          <ul className="space-y-2 text-muted-foreground">
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>API RESTful com autenticação via token</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>Suporte a HTML, CSS e JavaScript para renderização</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>Templates personalizáveis</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>Geração em alta velocidade</span>
            </li>
            <li className="flex items-start gap-2">
              <ChevronRight className="h-5 w-5 text-primary shrink-0" />
              <span>Webhooks para notificações</span>
            </li>
          </ul>
        </div>
      ),
    },
    "inicio-rapido": {
      title: "Início Rápido",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Siga estes passos para começar a gerar PDFs em poucos minutos.
          </p>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground mb-2">
                1. Crie uma conta
              </h4>
              <p className="text-sm text-muted-foreground">
                Registre-se gratuitamente para obter sua chave de API.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground mb-2">
                2. Obtenha sua chave de API
              </h4>
              <p className="text-sm text-muted-foreground">
                Acesse o painel de controle e copie sua chave de API.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-4">
              <h4 className="font-semibold text-foreground mb-2">
                3. Faça sua primeira requisição
              </h4>
              <pre className="mt-2 rounded bg-secondary p-3 text-xs text-secondary-foreground overflow-x-auto">
{`curl -X POST https://api.pdfgenerator.com/v1/generate \\
  -H "Authorization: Bearer SUA_CHAVE_API" \\
  -H "Content-Type: application/json" \\
  -d '{"html": "<h1>Olá, Mundo!</h1>"}'`}
              </pre>
            </div>
          </div>
        </div>
      ),
    },
    api: {
      title: "Referência da API",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Documentação completa dos endpoints disponíveis.
          </p>
          <div className="space-y-4">
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    POST
                  </span>
                  <code className="text-sm font-mono">/v1/generate</code>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Gera um PDF a partir de HTML ou template.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    GET
                  </span>
                  <code className="text-sm font-mono">/v1/templates</code>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Lista todos os templates disponíveis.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary px-2 py-1 text-xs font-bold text-primary-foreground">
                    GET
                  </span>
                  <code className="text-sm font-mono">/v1/jobs/:id</code>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Obtém o status de uma tarefa de geração.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    configuracao: {
      title: "Configuração",
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Configure o PDF Generator para atender suas necessidades específicas.
          </p>
          <h3 className="text-lg font-semibold text-foreground">
            Opções de Configuração
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 font-medium text-foreground">Parâmetro</th>
                  <th className="text-left py-2 font-medium text-foreground">Tipo</th>
                  <th className="text-left py-2 font-medium text-foreground">Descrição</th>
                </tr>
              </thead>
              <tbody className="text-muted-foreground">
                <tr className="border-b border-border">
                  <td className="py-2 font-mono">format</td>
                  <td className="py-2">string</td>
                  <td className="py-2">Formato do papel (A4, Letter, etc)</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-mono">margin</td>
                  <td className="py-2">object</td>
                  <td className="py-2">Margens do documento</td>
                </tr>
                <tr className="border-b border-border">
                  <td className="py-2 font-mono">landscape</td>
                  <td className="py-2">boolean</td>
                  <td className="py-2">Orientação paisagem</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ),
    },
    faq: {
      title: "Perguntas Frequentes",
      content: (
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-semibold text-foreground mb-2">
              Quantos PDFs posso gerar por mês?
            </h4>
            <p className="text-sm text-muted-foreground">
              O limite depende do seu plano. O plano Starter permite até 1.000
              PDFs/mês, enquanto o plano Pro oferece geração ilimitada.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-semibold text-foreground mb-2">
              Posso usar fontes personalizadas?
            </h4>
            <p className="text-sm text-muted-foreground">
              Sim! Você pode usar Google Fonts ou fazer upload das suas próprias
              fontes através do painel de controle.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-semibold text-foreground mb-2">
              Os PDFs são armazenados?
            </h4>
            <p className="text-sm text-muted-foreground">
              Por padrão, os PDFs são armazenados por 24 horas. Você pode
              configurar a retenção ou usar webhooks para receber os arquivos
              diretamente.
            </p>
          </div>
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="font-semibold text-foreground mb-2">
              Existe suporte a assinaturas digitais?
            </h4>
            <p className="text-sm text-muted-foreground">
              Sim, oferecemos integração com certificados digitais para
              assinatura de documentos (disponível no plano Pro).
            </p>
          </div>
        </div>
      ),
    },
  };

  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground">Documentação</h1>
        <p className="text-muted-foreground">
          Aprenda a usar o PDF Generator com nossos guias e referências.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <Card className="sticky top-20 border-border">
            <CardContent className="p-4">
              <nav className="space-y-1">
                {sections.map((section) => {
                  const Icon = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {section.label}
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Navigation */}
        <div className="lg:hidden mb-4">
          <ScrollArea className="w-full">
            <div className="flex gap-2 pb-2">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      activeSection === section.id
                        ? "bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-accent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {section.label}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Content */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>{content[activeSection].title}</CardTitle>
          </CardHeader>
          <CardContent>{content[activeSection].content}</CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Documentacao;
