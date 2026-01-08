import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const Planos = () => {
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      name: "Starter",
      description: "Para projetos pequenos e testes",
      monthlyPrice: 49,
      annualPrice: 39,
      features: [
        { text: "1.000 PDFs/mês", included: true },
        { text: "5 templates", included: true },
        { text: "Suporte por email", included: true },
        { text: "API básica", included: true },
        { text: "Webhooks", included: false },
        { text: "Assinaturas digitais", included: false },
        { text: "Prioridade na fila", included: false },
      ],
      popular: false,
    },
    {
      name: "Pro",
      description: "Para empresas em crescimento",
      monthlyPrice: 149,
      annualPrice: 119,
      features: [
        { text: "PDFs ilimitados", included: true },
        { text: "Templates ilimitados", included: true },
        { text: "Suporte prioritário", included: true },
        { text: "API completa", included: true },
        { text: "Webhooks", included: true },
        { text: "Assinaturas digitais", included: true },
        { text: "Prioridade na fila", included: false },
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      description: "Para grandes organizações",
      monthlyPrice: 399,
      annualPrice: 329,
      features: [
        { text: "PDFs ilimitados", included: true },
        { text: "Templates ilimitados", included: true },
        { text: "Suporte 24/7 dedicado", included: true },
        { text: "API completa + SDK", included: true },
        { text: "Webhooks", included: true },
        { text: "Assinaturas digitais", included: true },
        { text: "Prioridade na fila", included: true },
      ],
      popular: false,
    },
  ];

  return (
    <div className="py-16">
      <div className="container">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h1 className="mb-4 text-4xl font-bold text-foreground">
            Planos e Preços
          </h1>
          <p className="text-lg text-muted-foreground">
            Escolha o plano ideal para suas necessidades. Todos os planos incluem
            7 dias de teste grátis.
          </p>

          {/* Billing Toggle */}
          <div className="mt-8 flex items-center justify-center gap-4">
            <Label
              htmlFor="billing"
              className={`text-sm ${!isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Mensal
            </Label>
            <Switch
              id="billing"
              checked={isAnnual}
              onCheckedChange={setIsAnnual}
            />
            <Label
              htmlFor="billing"
              className={`text-sm ${isAnnual ? "text-foreground" : "text-muted-foreground"}`}
            >
              Anual
              <Badge variant="secondary" className="ml-2">
                -20%
              </Badge>
            </Label>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={`relative border-border ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : ""
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {plan.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center">
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-foreground">
                      R${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  {isAnnual && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Cobrado anualmente
                    </p>
                  )}
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2">
                      {feature.included ? (
                        <Check className="h-4 w-4 text-primary shrink-0" />
                      ) : (
                        <X className="h-4 w-4 text-muted shrink-0" />
                      )}
                      <span
                        className={`text-sm ${
                          feature.included
                            ? "text-foreground"
                            : "text-muted-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Link to="/registro" className="block">
                  <Button
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Começar Teste Grátis
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-16 max-w-2xl">
          <h2 className="mb-8 text-2xl font-bold text-center text-foreground">
            Perguntas sobre preços
          </h2>
          <div className="space-y-4">
            <Card className="border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">
                  Posso trocar de plano a qualquer momento?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Sim! Você pode fazer upgrade ou downgrade do seu plano a
                  qualquer momento. O valor será calculado proporcionalmente.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">
                  Como funciona o período de teste?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Todos os planos incluem 7 dias de teste grátis com acesso
                  completo a todas as funcionalidades. Você não será cobrado
                  durante o período de teste.
                </p>
              </CardContent>
            </Card>
            <Card className="border-border">
              <CardContent className="p-4">
                <h3 className="font-semibold text-foreground">
                  Quais formas de pagamento são aceitas?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Aceitamos cartões de crédito (Visa, Mastercard, Amex), PIX e
                  boleto bancário para planos anuais.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Planos;
