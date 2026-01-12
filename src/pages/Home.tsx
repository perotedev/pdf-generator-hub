import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Zap,
  Shield,
  Layers,
  ArrowRight,
  Star,
  CheckCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

const Home = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    image: string;
    title: string;
    description: string;
  } | null>(null);
  const features = [
    {
      icon: Zap,
      title: "Automação Inteligente",
      description:
        "Gere centenas de documentos em segundos a partir de planilhas Excel e templates PDF.",
    },
    {
      icon: Shield,
      title: "Segurança Local",
      description:
        "Sistema desktop que processa seus documentos localmente, garantindo privacidade total.",
    },
    {
      icon: Layers,
      title: "Perfis Reutilizáveis",
      description:
        "Configure uma vez e reutilize. Seus perfis de planilha e documento ficam salvos.",
    },
    {
      icon: FileText,
      title: "Visual e Simples",
      description:
        "Interface visual intuitiva. Clique nos campos do PDF e vincule às colunas do Excel.",
    },
  ];

  const testimonials = [
    {
      name: "Mayk Renner",
      role: "CEO da MS Company",
      content:
        "O PDF Generator transformou nossa operação. Geramos muitos formulários preenchidos diariamente sem problemas.",
      rating: 5,
    },
    {
      name: "Milca Nagata",
      role: "Fisioterapeuta",
      content:
        "Excelente, ajudou a automatizar muitos documentos da clínica de maneira fácil e rápida.",
      rating: 5,
    },
    {
      name: "Rodrigo Mascarenhas",
      role: "Desenvolvedor na CKR LTDA",
      content:
        "Ferramenta indispensável para nossa equipe. Automatizamos certificados com eficiência.",
      rating: 5,
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="container relative">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm">
              <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-muted-foreground">Nova versão 2.0 disponível</span>
            </div>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Automatize documentos{" "}
              <span className="text-primary">em segundos</span>
            </h1>
            <p className="mb-8 text-lg text-muted-foreground sm:text-xl">
              Sistema desktop para automação de documentos PDF. Transforme
              planilhas Excel em centenas de PDFs personalizados com apenas um clique.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/planos">
                <Button size="lg" className="gap-2">
                  Ver Planos e Preços
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/documentacao">
                <Button variant="outline" size="lg">
                  Ver Documentação
                </Button>
              </Link>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Ativação imediata</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Instalação simples</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-primary" />
                <span>Suporte dedicado</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sistema em Ação */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Veja o sistema em ação
            </h2>
            <p className="text-muted-foreground">
              Interface intuitiva e poderosa, projetada para máxima produtividade
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              className="border-border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedScreenshot({
                image: "/screenshots/perfil-planilha.png",
                title: "Mapeamento de Planilhas",
                description: "Configure uma vez e reutilize o perfil quantas vezes quiser. Defina quais colunas da sua planilha Excel contêm os dados que serão inseridos nos documentos. O sistema memoriza suas configurações para futuras gerações."
              })}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src="/screenshots/perfil-planilha.png"
                    alt="Configuração de perfil de planilha"
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Mapeamento de Planilhas
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Configure uma vez e reutilize o perfil quantas vezes quiser.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedScreenshot({
                image: "/screenshots/perfil-documento.png",
                title: "Editor Visual de Documentos",
                description: "Clique diretamente no PDF para posicionar campos e personalize estilos. O editor visual permite que você configure exatamente onde cada informação da planilha deve aparecer no documento final, com controle total sobre fontes, tamanhos e formatação."
              })}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src="/screenshots/perfil-documento.png"
                    alt="Editor visual de perfil de documento"
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Editor Visual de Documentos
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Clique diretamente no PDF para posicionar campos e personalize estilos.
                  </p>
                </div>
              </CardContent>
            </Card>
            
            <Card
              className="border-border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedScreenshot({
                image: "/screenshots/geracao-pdfs-lote.png",
                title: "Geração em Lote",
                description: "Gere centenas de documentos personalizados com apenas um clique. Selecione seu perfil de planilha e documento, escolha o arquivo Excel, e o sistema processará automaticamente todas as linhas, criando um PDF personalizado para cada registro."
              })}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src="/screenshots/geracao-pdfs-lote.png"
                    alt="Geração em lote de PDFs"
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Geração em Lote
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Gere centenas de documentos personalizados com apenas um clique.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card
              className="border-border overflow-hidden group hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => setSelectedScreenshot({
                image: "/screenshots/pdfs-gerados.png",
                title: "Gerenciamento Completo",
                description: "Visualize, organize e gerencie todos os documentos gerados. A interface de gerenciamento permite buscar, filtrar, visualizar e organizar todos os PDFs criados, facilitando o acesso e controle dos seus documentos."
              })}
            >
              <CardContent className="p-0">
                <div className="relative overflow-hidden">
                  <img
                    src="/screenshots/pdfs-gerados.png"
                    alt="Lista de PDFs gerados"
                    className="w-full h-48 object-cover transition-transform group-hover:scale-105"
                  />
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    Gerenciamento Completo
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Visualize, organize e gerencie todos os documentos gerados.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Tudo que você precisa para automatizar documentos
            </h2>
            <p className="text-muted-foreground">
              Uma solução desktop completa para eliminar tarefas repetitivas
              e economizar horas de trabalho manual.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={feature.title}
                  className="group border-border bg-background transition-all hover:border-primary/50 hover:shadow-lg"
                >
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-semibold text-foreground">
                      {feature.title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              O que nossos clientes dizem
            </h2>
            <p className="text-muted-foreground">
              Milhares de empresas confiam no PDF Generator para suas
              necessidades de documentação.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((testimonial) => (
              <Card key={testimonial.name} className="border-border bg-card">
                <CardContent className="p-6">
                  <div className="mb-4 flex gap-1">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-primary text-primary"
                      />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">
                      {testimonial.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground">
              Pronto para começar?
            </h2>
            <p className="mb-8 text-primary-foreground/80">
              Escolha seu plano e comece a automatizar a criação de documentos hoje mesmo.
            </p>
            <Link to="/planos">
              <Button
                size="lg"
                variant="secondary"
                className="gap-2"
              >
                Ver Planos
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Screenshot Dialog */}
      <Dialog open={!!selectedScreenshot} onOpenChange={() => setSelectedScreenshot(null)}>
        <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedScreenshot?.title}</DialogTitle>
            <DialogDescription>
              {selectedScreenshot?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <img
              src={selectedScreenshot?.image}
              alt={selectedScreenshot?.title}
              className="w-full h-auto rounded-lg border border-border"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Home;
