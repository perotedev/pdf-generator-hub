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

const Home = () => {
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
      name: "Maria Santos",
      role: "CTO, TechCorp",
      content:
        "O PDF Generator transformou nossa operação. Geramos milhares de relatórios diariamente sem problemas.",
      rating: 5,
    },
    {
      name: "Carlos Oliveira",
      role: "Desenvolvedor Sênior",
      content:
        "API simples, documentação excelente e suporte responsivo. Exatamente o que precisávamos.",
      rating: 5,
    },
    {
      name: "Ana Costa",
      role: "Product Manager",
      content:
        "A facilidade de integração e a qualidade dos PDFs gerados superou nossas expectativas.",
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
    </div>
  );
};

export default Home;
