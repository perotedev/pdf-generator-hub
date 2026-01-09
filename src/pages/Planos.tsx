import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X } from "lucide-react";

const Planos = () => {

  const plans = [
    {
      name: "Mensal",
      description: "Assinatura mensal do PDF Generator",
      monthlyPrice: 49,
      annualPrice: 49,
      features: [
        { text: "Geração ilimitada de PDFs", included: true },
        { text: "Perfis ilimitados", included: true },
        { text: "Templates ilimitados", included: true },
        { text: "Assinaturas digitais", included: true },
        { text: "Suporte por email", included: true },
        { text: "Novas versões durante a validade", included: true },
        { text: "Sem desconto", included: true, isDisadvantage: true },
      ],
      popular: false,
      isMonthly: true,
    },
    {
      name: "Anual",
      description: "Assinatura anual com desconto",
      monthlyPrice: 39,
      annualPrice: 39,
      features: [
        { text: "Geração ilimitada de PDFs", included: true },
        { text: "Perfis ilimitados", included: true },
        { text: "Templates ilimitados", included: true },
        { text: "Assinaturas digitais", included: true },
        { text: "Suporte prioritário", included: true },
        { text: "Novas versões durante a validade", included: true },
        { text: "Economia de 20%", included: true },
      ],
      popular: true,
      isMonthly: false,
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
            geração ilimitada de PDFs e perfis.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2 max-w-4xl mx-auto">
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
                      R${plan.monthlyPrice}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.isMonthly
                      ? "Cobrado mensalmente"
                      : `Cobrado anualmente (R${plan.monthlyPrice * 12})`
                    }
                  </p>
                </div>

                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature.text} className="flex items-center gap-2">
                      {feature.isDisadvantage ? (
                        <X className="h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <Check className="h-4 w-4 shrink-0 text-primary" />
                      )}
                      <span className={`text-sm ${feature.isDisadvantage ? 'text-muted-foreground' : 'text-foreground'}`}>
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
                    Assinar Agora
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
                  Como recebo minha licença?
                </h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Após a confirmação do pagamento, você receberá imediatamente
                  sua chave de licença e o link para download do instalador
                  do PDF Generator.
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
