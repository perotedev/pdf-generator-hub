import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, RefreshCw, CreditCard, ArrowLeft } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { plansApi, checkoutApi, type Plan } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";

interface Feature {
  text: string;
  included: boolean;
  isDisadvantage?: boolean;
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

const Checkout = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, isAuthenticated, getAccessToken } = useAuth();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [allPlans, setAllPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [monthlySavings, setMonthlySavings] = useState("0");

  const planId = searchParams.get("plan");

  useEffect(() => {
    if (!planId) {
      navigate("/planos");
      return;
    }

    const fetchPlan = async () => {
      try {
        setLoading(true);
        const response = await plansApi.getActivePlans();
        const plans = response.plans || response;
        setAllPlans(plans);

        const selectedPlan = plans.find((p: Plan) => p.id === planId);

        if (!selectedPlan) {
          toast({
            title: "Plano não encontrado",
            description: "O plano selecionado não está disponível.",
            variant: "destructive",
          });
          navigate("/planos");
          return;
        }

        // Calcular economia do plano anual
        const monthlyPlan = plans.find((p: Plan) => p.billing_cycle === 'MONTHLY');
        const yearlyPlan = plans.find((p: Plan) => p.billing_cycle === 'YEARLY');

        if (monthlyPlan && yearlyPlan) {
          const monthlyEquivalent = yearlyPlan.price / 12;
          const savings = (
            ((monthlyPlan.price - monthlyEquivalent) / monthlyPlan.price) *
            100
          ).toFixed(0);
          setMonthlySavings(savings);
        }

        setPlan(selectedPlan);
      } catch (error: any) {
        console.error("Error fetching plan:", error);
        toast({
          title: "Erro ao carregar plano",
          description: error.message || "Tente novamente.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, [planId, navigate, toast]);

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      // Salvar o plano no sessionStorage e redirecionar para login
      sessionStorage.setItem("pendingCheckoutPlan", planId || "");
      navigate("/login?redirect=/checkout?plan=" + planId);
      return;
    }

    try {
      setProcessingPayment(true);
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const checkoutData = await checkoutApi.createCheckoutSession(
        token,
        planId!,
        `${window.location.origin}/dashboard/assinaturas?success=true`,
        `${window.location.origin}/checkout?plan=${planId}&canceled=true`
      );

      // Redirecionar para o Stripe Checkout
      window.location.href = checkoutData.url;
    } catch (error: any) {
      console.error("Error creating checkout:", error);
      toast({
        title: "Erro ao processar pagamento",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return null;
  }

  // Processar features com monthlySavings
  const features = processFeatures(plan.features, monthlySavings);
  const monthlyEquivalent =
    plan.billing_cycle === "MONTHLY" ? plan.price : plan.price / 12;

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container max-w-4xl">
        <div className="mb-8">
          <Link
            to="/planos"
            className="inline-flex items-center text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para planos
          </Link>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Resumo do Plano */}
          <Card className="border-primary/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Resumo do Pedido</CardTitle>
                {plan.billing_cycle === "YEARLY" && (
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold">{plan.name}</h3>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor mensal</span>
                  <span>{formatCurrency(monthlyEquivalent)}/mês</span>
                </div>
                {plan.billing_cycle === "YEARLY" && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Total anual
                      </span>
                      <span className="font-semibold">
                        {formatCurrency(plan.price)}
                      </span>
                    </div>
                    <div className="flex justify-between text-green-600">
                      <span>Economia</span>
                      <span className="font-semibold">
                        {monthlySavings}% por mês
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between border-t pt-2">
                  <span className="font-semibold">Cobrado agora</span>
                  <span className="text-xl font-bold text-primary">
                    {formatCurrency(plan.price)}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Incluso no plano:</h4>
                <ul className="space-y-2">
                  {features.map((feature: Feature, index: number) => (
                    <li
                      key={index}
                      className="flex items-center gap-2 text-sm"
                    >
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
              </div>
            </CardContent>
          </Card>

          {/* Formulário de Pagamento */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Pagamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAuthenticated ? (
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Para continuar com a assinatura, você precisa estar logado.
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full" onClick={handleCheckout}>
                      Fazer Login e Continuar
                    </Button>
                    <p className="text-sm text-muted-foreground">
                      Não tem uma conta?{" "}
                      <Link
                        to={`/registro?redirect=/checkout?plan=${planId}`}
                        className="text-primary hover:underline"
                      >
                        Criar conta
                      </Link>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      Logado como
                    </p>
                    <p className="font-medium">{user?.email}</p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium">Formas de Pagamento</h4>
                    <p className="text-sm text-muted-foreground">
                      Você será redirecionado para o ambiente seguro do Stripe
                      para concluir o pagamento.
                    </p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Cartão de crédito</span>
                    </div>
                    {/* <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>PIX</span>
                    </div> */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Boleto (plano anual)</span>
                    </div>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handleCheckout}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar {formatCurrency(plan.price)}
                      </>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Ao clicar em "Pagar", você concorda com os nossos{" "}
                    <a href="#" className="underline">
                      Termos de Serviço
                    </a>{" "}
                    e{" "}
                    <a href="#" className="underline">
                      Política de Privacidade
                    </a>
                    .
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
