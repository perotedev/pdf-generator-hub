import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase, type Plan as DbPlan } from "@/lib/supabase";

interface PlanDisplay {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  annualPrice: number;
  features: { text: string; included: boolean; isDisadvantage?: boolean }[];
  popular: boolean;
  isMonthly: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY';
}

const Planos = () => {
  const [plans, setPlans] = useState<PlanDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const { data: dbPlans, error } = await supabase
        .from('plans')
        .select('*')
        .eq('is_active', true)
        .order('billing_cycle');

      if (error) throw error;

      if (dbPlans && dbPlans.length > 0) {
        const monthlyPlan = dbPlans.find((p: DbPlan) => p.billing_cycle === 'MONTHLY');
        const yearlyPlan = dbPlans.find((p: DbPlan) => p.billing_cycle === 'YEARLY');

        const formattedPlans: PlanDisplay[] = [];

        if (monthlyPlan) {
          formattedPlans.push({
            id: monthlyPlan.id,
            name: "Mensal",
            description: monthlyPlan.description || "Assinatura mensal do PDF Generator",
            monthlyPrice: monthlyPlan.price,
            annualPrice: monthlyPlan.price,
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
            billingCycle: 'MONTHLY',
          });
        }

        if (yearlyPlan) {
          const monthlyEquivalent = yearlyPlan.price / 12;
          const monthlySavings = monthlyPlan ? ((monthlyPlan.price - monthlyEquivalent) / monthlyPlan.price * 100).toFixed(0) : "20";

          formattedPlans.push({
            id: yearlyPlan.id,
            name: "Anual",
            description: yearlyPlan.description || "Assinatura anual com desconto",
            monthlyPrice: Number(monthlyEquivalent.toFixed(2)),
            annualPrice: yearlyPlan.price,
            features: [
              { text: "Geração ilimitada de PDFs", included: true },
              { text: "Perfis ilimitados", included: true },
              { text: "Templates ilimitados", included: true },
              { text: "Assinaturas digitais", included: true },
              { text: "Suporte prioritário", included: true },
              { text: "Novas versões durante a validade", included: true },
              { text: `Economia de ${monthlySavings}%`, included: true },
            ],
            popular: true,
            isMonthly: false,
            billingCycle: 'YEARLY',
          });
        }

        setPlans(formattedPlans);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      // Fallback to default values if API fails
      setPlans([
        {
          id: 'fallback-monthly',
          name: "Mensal",
          description: "Assinatura mensal do PDF Generator",
          monthlyPrice: 49.90,
          annualPrice: 49.90,
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
          billingCycle: 'MONTHLY',
        },
        {
          id: 'fallback-yearly',
          name: "Anual",
          description: "Assinatura anual com desconto",
          monthlyPrice: 41.58,
          annualPrice: 499.00,
          features: [
            { text: "Geração ilimitada de PDFs", included: true },
            { text: "Perfis ilimitados", included: true },
            { text: "Templates ilimitados", included: true },
            { text: "Assinaturas digitais", included: true },
            { text: "Suporte prioritário", included: true },
            { text: "Novas versões durante a validade", included: true },
            { text: "Economia de 17%", included: true },
          ],
          popular: true,
          isMonthly: false,
          billingCycle: 'YEARLY',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

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
