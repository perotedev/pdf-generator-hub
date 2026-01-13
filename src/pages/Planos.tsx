import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { plansApi, supabase, type Plan as DbPlan } from "@/lib/supabase";

interface Feature {
  text: string;
  included: boolean;
  isDisadvantage?: boolean;
}

interface PlanDisplay {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: Feature[];
  popular: boolean;
  isMonthly: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

// Função para processar features e substituir placeholders
const processFeatures = (
  features: { features: Feature[] } | Feature[] | null | undefined,
  monthlySavings: string
): Feature[] => {
  if (!features) return [];

  // Aceita tanto { features: [...] } quanto [...]
  const featureList = Array.isArray(features) ? features : features.features;

  if (!Array.isArray(featureList)) return [];

  return featureList.map((feature) => ({
    ...feature,
    text: feature.text.replace('{monthlySavings}', monthlySavings),
  }));
};

const Planos = () => {
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchPlans = async () => {
      if (!isMounted) return;

      try {
        setLoading(true);

        const response = await plansApi.getActivePlans();
        const dbPlans: DbPlan[] = response.plans || response;

        if (!dbPlans || dbPlans.length === 0) {
          console.warn('No plans found');
          setPlans([]);
          return;
        }

        // Encontrar planos mensal e anual
        const monthlyPlan = dbPlans.find(p => p.billing_cycle === 'MONTHLY');
        const yearlyPlan = dbPlans.find(p => p.billing_cycle === 'YEARLY');

        // Calcular economia do plano anual
        let monthlySavings = '0';
        if (monthlyPlan && yearlyPlan) {
          const monthlyEquivalent = yearlyPlan.price / 12;
          monthlySavings = (
            ((monthlyPlan.price - monthlyEquivalent) / monthlyPlan.price) *
            100
          ).toFixed(0);
        }

        // Formatar planos para exibição
        const formattedPlans: PlanDisplay[] = dbPlans.map(plan => {
          const isMonthly = plan.billing_cycle === 'MONTHLY';
          const monthlyEquivalent = isMonthly
            ? plan.price
            : plan.price / 12;

          return {
            id: plan.id,
            name: plan.name,
            description:
              plan.description ||
              (isMonthly
                ? 'Assinatura mensal do PDF Generator'
                : 'Assinatura anual com desconto'),
            monthlyPrice: Number(monthlyEquivalent.toFixed(2)),
            annualPrice: plan.price,
            features: processFeatures(plan.features, monthlySavings),
            popular: !isMonthly,
            isMonthly,
            billingCycle: plan.billing_cycle,
          };
        });

        if (isMounted) {
          setPlans(formattedPlans);
        }
      } catch (error) {
        console.error('Error fetching plans:', error);
        if (isMounted) {
          setPlans([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, []);


  if (loading) {
    return (
      <div className="py-16">
        <div className="container">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="mt-2 text-muted-foreground">Carregando planos...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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

        {plans.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <p className="text-muted-foreground">
              Nenhum plano disponível no momento. Por favor, tente novamente mais tarde.
            </p>
          </div>
        ) : (
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
                      {new Intl.NumberFormat('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      }).format(plan.monthlyPrice)}
                    </span>
                    <span className="text-muted-foreground">/mês</span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {plan.isMonthly
                      ? "Cobrado mensalmente"
                      : `Cobrado anualmente (${new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(plan.annualPrice)})`
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
        )}

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
                  Não. A troca de plano só pode ser realizada após o término do período da assinatura vigente. 
                  Após o fim da assinatura atual, você poderá contratar um novo plano de sua preferência.
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
