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
  ChevronRight,
  Table2,
  MousePointerClick,
  Play,
  FolderOpen,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState, useEffect } from "react";

const Home = () => {
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    image: string;
    title: string;
    description: string;
  } | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const workflowSteps = [
    {
      step: 1,
      icon: Table2,
      title: "Configure sua Planilha",
      shortTitle: "Planilha",
      description: "Importe sua planilha Excel e defina quais colunas contêm os dados que serão usados nos documentos.",
      details: "O sistema detecta automaticamente as colunas da sua planilha. Basta nomear cada coluna para facilitar o mapeamento.",
      image: "/screenshots/perfil-planilha.png",
      color: "from-primary to-primary/80",
    },
    {
      step: 2,
      icon: MousePointerClick,
      title: "Mapeie o Documento",
      shortTitle: "Documento",
      description: "Clique diretamente no PDF para posicionar os campos. Vincule cada campo a uma coluna da planilha.",
      details: "Interface visual com mapeamento por clique. Personalize fontes, tamanhos e estilos de cada campo individualmente.",
      image: "/screenshots/perfil-documento.png",
      color: "from-purple-500 to-purple-600",
    },
    {
      step: 3,
      icon: Play,
      title: "Gere em Lote",
      shortTitle: "Gerar",
      description: "Com um clique, o sistema processa todas as linhas da planilha e gera um PDF personalizado para cada registro.",
      details: "Processamento rápido e eficiente. Gere centenas de documentos em segundos, não em horas.",
      image: "/screenshots/geracao-pdfs-lote.png",
      color: "from-green-500 to-green-600",
    },
    {
      step: 4,
      icon: FolderOpen,
      title: "Acesse os Resultados",
      shortTitle: "Resultados",
      description: "Todos os PDFs gerados ficam organizados e prontos para uso. Visualize, exporte ou compartilhe.",
      details: "Gerenciamento completo dos documentos gerados. Busca, filtros e organização inteligente.",
      image: "/screenshots/pdfs-gerados.png",
      color: "from-orange-500 to-orange-600",
    },
  ];

  // Auto-play dos steps
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, workflowSteps.length]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false);
  };

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
        "Transformou nossa operação. Muitos formulários gerados diariamente.",
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

      {/* Sistema em Ação - Fluxo Interativo */}
      <section className="py-20 bg-gray/40 overflow-hidden">
        <div className="container">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground">
              Veja o sistema em ação
            </h2>
            <p className="text-muted-foreground">
              4 passos simples para automatizar a geração de documentos
            </p>
          </div>

          {/* Timeline Navigation */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 sm:gap-4 bg-card rounded-full p-2 shadow-lg border border-border">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon;
                const isActive = activeStep === index;
                return (
                  <button
                    key={step.step}
                    onClick={() => handleStepClick(index)}
                    className={`
                      relative flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full transition-all duration-300
                      ${isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                      }
                    `}
                  >
                    <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span className="hidden sm:inline text-sm font-medium">{step.shortTitle}</span>
                    <span className="sm:hidden text-xs font-bold">{step.step}</span>
                    {isActive && isAutoPlaying && (
                      <span className="absolute bottom-0 left-0 h-0.5 bg-primary-foreground/50 animate-[progress_4s_linear_infinite] rounded-full"
                        style={{ width: '100%' }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Main Content Area */}
          <div className="grid lg:grid-cols-2 gap-8 items-center max-w-6xl mx-auto">
            {/* Left Side - Step Info */}
            <div className="order-2 lg:order-1">
              <div className="space-y-6">
                {/* Step Number */}
                <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-full bg-gradient-to-r ${workflowSteps[activeStep].color} text-white`}>
                  <span className="text-lg font-bold">Passo {workflowSteps[activeStep].step}</span>
                  <ChevronRight className="h-4 w-4" />
                  <span className="text-sm opacity-90">{workflowSteps[activeStep].shortTitle}</span>
                </div>

                {/* Title */}
                <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
                  {workflowSteps[activeStep].title}
                </h3>

                {/* Description */}
                <p className="text-lg text-muted-foreground">
                  {workflowSteps[activeStep].description}
                </p>

                {/* Details */}
                <div className="flex items-start gap-3 p-4 bg-card rounded-lg border border-border">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    {workflowSteps[activeStep].details}
                  </p>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center gap-4 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveStep((prev) => (prev - 1 + workflowSteps.length) % workflowSteps.length);
                      setIsAutoPlaying(false);
                    }}
                    disabled={activeStep === 0}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setActiveStep((prev) => (prev + 1) % workflowSteps.length);
                      setIsAutoPlaying(false);
                    }}
                    disabled={activeStep === workflowSteps.length - 1}
                  >
                    Próximo
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                    className="ml-auto"
                  >
                    {isAutoPlaying ? 'Pausar' : 'Reproduzir'}
                  </Button>
                </div>

                {/* Progress Dots */}
                <div className="flex items-center gap-2 pt-2">
                  {workflowSteps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleStepClick(index)}
                      className={`
                        h-2 rounded-full transition-all duration-300
                        ${activeStep === index
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
                        }
                      `}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Right Side - Screenshot */}
            <div className="order-1 lg:order-2">
              <div
                className="relative rounded overflow-hidden border border-border shadow-2xl bg-card cursor-pointer group"
                onClick={() => setSelectedScreenshot({
                  image: workflowSteps[activeStep].image,
                  title: workflowSteps[activeStep].title,
                  description: workflowSteps[activeStep].description + " " + workflowSteps[activeStep].details
                })}
              >
                {/* Gradient Overlay */}
                <div className={`absolute inset-0 bg-gradient-to-br ${workflowSteps[activeStep].color} opacity-5`} />

                {/* Screenshot */}
                <div className="relative overflow-hidden">
                <div className="absolute inset-0 "></div>

                  <img
                    src={workflowSteps[activeStep].image}
                    alt={workflowSteps[activeStep].title}
                    className="h-full object-cover transition-transform duration-500"
                  />

                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-white bg-black/50 px-4 py-2 rounded-full text-sm font-medium">
                      Clique para ampliar
                    </span>
                  </div>
                </div>

                {/* Step Badge */}
                <div className="absolute top-4 left-4 flex items-center gap-2 bg-background/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium">
                  {(() => {
                    const Icon = workflowSteps[activeStep].icon;
                    return <Icon className="h-4 w-4 text-primary" />;
                  })()}
                  <span>Passo {workflowSteps[activeStep].step}</span>
                </div>
              </div>
            </div>
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
              Milhares de empresas confiam no Capidoc para suas
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
      <section className="py-20 bg-primary/80">
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
