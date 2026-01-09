import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, ArrowLeft, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MudarPlano = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  // ID da assinatura atual passado via query params
  const currentSubscriptionId = searchParams.get("subscriptionId");
  const currentPlan = searchParams.get("currentPlan") || "Mensal";

  const plans = [
    {
      id: "monthly",
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
      id: "annual",
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

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmChange = () => {
    const plan = plans.find((p) => p.id === selectedPlan);
    setConfirmDialogOpen(false);

    toast({
      title: "Plano alterado com sucesso!",
      description: `Sua assinatura foi alterada para o plano ${plan?.name}. As mudanças entrarão em vigor imediatamente.`,
    });

    // Redireciona de volta para assinaturas após 2 segundos
    setTimeout(() => {
      navigate("/dashboard/assinaturas");
    }, 2000);
  };

  const getSelectedPlanInfo = () => {
    return plans.find((p) => p.id === selectedPlan);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("/dashboard/assinaturas")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-foreground">Mudar Plano</h1>
        <p className="text-muted-foreground">
          Escolha o novo plano para sua assinatura {currentSubscriptionId}
        </p>
      </div>

      {/* Current Plan Info */}
      <Card className="border-border bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Plano Atual</p>
              <p className="font-semibold text-foreground">{currentPlan}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Selection */}
      <div className="grid gap-6 lg:grid-cols-2 max-w-4xl">
        {plans.map((plan) => {
          const isCurrentPlan = plan.name === currentPlan;

          return (
            <Card
              key={plan.id}
              className={`relative border-border ${
                plan.popular ? "border-primary ring-2 ring-primary/20" : ""
              } ${isCurrentPlan ? "opacity-50" : ""}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Mais Popular
                  </Badge>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <Badge variant="secondary">Plano Atual</Badge>
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
                      : `Cobrado anualmente (R${plan.monthlyPrice * 12})`}
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
                      <span
                        className={`text-sm ${
                          feature.isDisadvantage
                            ? "text-muted-foreground"
                            : "text-foreground"
                        }`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? "Plano Atual" : "Selecionar Plano"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Important Notes */}
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Informações Importantes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • A mudança de plano será aplicada imediatamente à sua assinatura.
          </p>
          <p>
            • Se você mudar para um plano mais barato, receberá um crédito
            proporcional ao tempo restante do plano atual.
          </p>
          <p>
            • Se você mudar para um plano mais caro, será cobrada a diferença
            proporcional ao período restante.
          </p>
          <p>
            • Sua licença continuará funcionando normalmente durante toda a mudança.
          </p>
          <p>
            • A data de renovação permanecerá a mesma da assinatura original.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Mudança de Plano</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a mudar sua assinatura do plano{" "}
                <strong>{currentPlan}</strong> para o plano{" "}
                <strong>{getSelectedPlanInfo()?.name}</strong>.
              </p>
              <p className="mt-4">
                Valor do novo plano:{" "}
                <strong>R${getSelectedPlanInfo()?.monthlyPrice}/mês</strong>
              </p>
              <p>
                A mudança será aplicada imediatamente e o ajuste de valores será
                feito de forma proporcional.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmChange}>
              Confirmar Mudança
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MudarPlano;
