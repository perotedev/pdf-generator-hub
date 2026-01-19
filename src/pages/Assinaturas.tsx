import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { CreditCard, Calendar, Check, Copy, RefreshCw, Key, Monitor, Trash2, Edit2, RotateCcw } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useAuth } from "@/contexts/AuthContext";
import { dashboardApi, checkoutApi, plansApi, type Subscription, type License } from "@/lib/supabase";

interface SubscriptionWithDetails extends Subscription {
  plans?: {
    name: string;
    price: number;
    billing_cycle: string;
  };
  license?: License;
}

const Assinaturas = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { user, getAccessToken } = useAuth();
  const [subscriptions, setSubscriptions] = useState<SubscriptionWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState<string | null>(null);
  const [reactivatePlan, setReactivatePlan] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [savingCancel, setSavingCancel] = useState(false);
  const [savingDeactivate, setSavingDeactivate] = useState<string | null>(null);
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingReactivate, setSavingReactivate] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, [user]);

  // Handle success parameter from Stripe Checkout redirect
  useEffect(() => {
    const success = searchParams.get('success');
    if (success === 'true') {
      toast({
        title: "Pagamento processado!",
        description: "Sua assinatura foi criada. Se você pagou via boleto, a licença será liberada após a confirmação do pagamento (até 3 dias úteis).",
      });
      // Remove success param from URL
      searchParams.delete('success');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, toast]);

  const fetchSubscriptions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Fetch user subscriptions with plan details
      const subsResponse = await dashboardApi.getAllSubscriptions(token);
      const subsData = subsResponse.subscriptions || [];

      // Fetch licenses for each subscription
      const subscriptionsWithLicenses = await Promise.all(
        subsData.map(async (sub: Subscription) => {
          try {
            const licenseResponse = await dashboardApi.getLicenseBySubscription(token, sub.id);
            return {
              ...sub,
              license: licenseResponse.license,
            };
          } catch {
            return {
              ...sub,
              license: null,
            };
          }
        })
      );

      setSubscriptions(subscriptionsWithLicenses);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      toast({
        title: "Erro ao carregar assinaturas",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "ACTIVE");

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código da licença foi copiado para a área de transferência.",
    });
  };

  const handleCancelRenewal = async (subId: string) => {
    setSavingCancel(true);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      await dashboardApi.cancelSubscriptionRenewal(token, subId);

      await fetchSubscriptions();

      setCancelDialogOpen(null);
      toast({
        title: "Renovação automática cancelada",
        description: "Sua assinatura continuará ativa até a data de vencimento.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao cancelar renovação",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingCancel(false);
    }
  };

  const handleDeactivateLicense = async (licenseId: string) => {
    setSavingDeactivate(licenseId);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      await dashboardApi.deactivateLicense(token, licenseId);

      await fetchSubscriptions();

      toast({
        title: "Licença desativada",
        description: "O dispositivo foi desvinculado e a licença está disponível novamente.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao desativar licença",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingDeactivate(null);
    }
  };

  const handleSaveNickname = async (licenseId: string) => {
    setSavingNickname(true);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      await dashboardApi.updateLicenseNickname(token, licenseId, nicknameValue);

      await fetchSubscriptions();

      setEditingNickname(null);
      toast({
        title: "Apelido atualizado",
        description: "O apelido da licença foi atualizado com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar apelido",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingNickname(false);
    }
  };

  const handleReactivateSubscription = async (subId: string) => {
    setSavingReactivate(true);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Get plans from API
      const plansResponse = await plansApi.getActivePlans();
      const plansData = plansResponse.plans || plansResponse;
      const selectedPlan = plansData.find((p: any) => p.billing_cycle === reactivatePlan);

      if (!selectedPlan) throw new Error('Plano não encontrado');

      // Create checkout session
      const checkoutData = await checkoutApi.createCheckoutSession(
        token,
        selectedPlan.id,
        `${window.location.origin}/dashboard/assinaturas`,
        `${window.location.origin}/dashboard/assinaturas`
      );

      // Redirect to Stripe Checkout
      window.location.href = checkoutData.url;
    } catch (error: any) {
      console.error('Error reactivating subscription:', error);
      toast({
        title: "Erro ao reativar assinatura",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSavingReactivate(false);
      setReactivateDialogOpen(null);
    }
  };

  const maskLicenseCode = (code: string) => {
    const parts = code.split("-");
    if (parts.length >= 5) {
      return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
    }
    return code;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "default";
      case "CANCELED":
        return "destructive";
      case "EXPIRED":
        return "outline";
      case "PENDING_PAYMENT":
        return "secondary";
      default:
        return "secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "Ativa";
      case "CANCELED":
        return "Cancelada";
      case "EXPIRED":
        return "Expirada";
      case "PENDING_PAYMENT":
        return "Aguardando Pagamento";
      case "PAST_DUE":
        return "Pagamento Atrasado";
      default:
        return "Desconhecido";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando assinaturas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Minhas Assinaturas
          </h1>
          <p className="text-muted-foreground">
            Gerencie suas assinaturas e licenças do PDF Generator
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchSubscriptions}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* Active Subscriptions Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeSubscriptions.length}</p>
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <Key className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => s.license?.is_used).length}
                </p>
                <p className="text-sm text-muted-foreground">Licenças em Uso</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <Calendar className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {subscriptions.filter(s => !s.cancel_at_period_end && s.status === 'ACTIVE').length}
                </p>
                <p className="text-sm text-muted-foreground">Renovação Automática</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <CreditCard className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhuma assinatura encontrada</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Você ainda não possui nenhuma assinatura ativa.
            </p>
            <Button className="mt-4" onClick={() => navigate('/planos')}>
              Ver Planos Disponíveis
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-4">
          {subscriptions.map((subscription) => (
            <AccordionItem
              key={subscription.id}
              value={subscription.id}
              className="rounded-lg border bg-card"
            >
              <Card className="border-0">
                <AccordionTrigger className="px-6 hover:no-underline">
                  <div className="flex w-full items-center justify-between pr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">
                          {subscription.plans?.name || 'Plano Desconhecido'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {subscription.billing_cycle === 'MONTHLY' ? 'Mensal' : 'Anual'} -{' '}
                          {subscription.plans && formatCurrency(subscription.plans.price)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusVariant(subscription.status)}>
                        {getStatusLabel(subscription.status)}
                      </Badge>
                    </div>
                  </div>
                </AccordionTrigger>

                <AccordionContent>
                  <CardContent className="space-y-6 pt-0">
                    {/* Subscription Details */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <Label className="text-muted-foreground">Data de Início</Label>
                        <p className="text-sm font-medium">
                          {formatDate(subscription.current_period_start)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">
                          {subscription.cancel_at_period_end ? 'Expira em' : 'Próximo Pagamento'}
                        </Label>
                        <p className="text-sm font-medium">
                          {formatDate(subscription.current_period_end)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Renovação Automática</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant={subscription.cancel_at_period_end ? "destructive" : "default"}>
                            {subscription.cancel_at_period_end ? "Desativada" : "Ativa"}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <Label className="text-muted-foreground">Status do Pagamento</Label>
                        <div className="flex items-center gap-2">
                          <Badge variant="default">
                            {subscription.status === 'ACTIVE' ? 'Em dia' : 'Pendente'}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* Pending Payment Notice (Boleto) */}
                    {subscription.status === 'PENDING_PAYMENT' && (
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                        <div className="flex items-start gap-3">
                          <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                              Aguardando confirmação do pagamento
                            </p>
                            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                              Seu pagamento está sendo processado. A licença será liberada automaticamente após a confirmação do pagamento.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* License Information */}
                    {subscription.status === 'ACTIVE' && !subscription.license && (
                      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
                        <div className="flex items-start gap-3">
                          <RefreshCw className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                              Sua licença está sendo gerada
                            </p>
                            <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                              Em instantes, ela estará disponível. Clique em "Atualizar" para verificar.
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {subscription.license && (
                      <>
                        <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
                          <div className="flex items-center justify-between">
                            <Label className="flex items-center gap-2">
                              <Key className="h-4 w-4" />
                              Código da Licença
                            </Label>
                            {editingNickname === subscription.license.id ? (
                              <div className="flex items-center gap-2">
                                <Input
                                  value={nicknameValue}
                                  onChange={(e) => setNicknameValue(e.target.value)}
                                  className="h-8 w-48"
                                  placeholder="Apelido da licença"
                                />
                                <Button
                                  size="sm"
                                  onClick={() => handleSaveNickname(subscription.license!.id)}
                                  disabled={savingNickname}
                                >
                                  {savingNickname ? (
                                    <RefreshCw className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <Check className="h-4 w-4" />
                                  )}
                                </Button>
                              </div>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setEditingNickname(subscription.license!.id);
                                  setNicknameValue(subscription.license!.client || '');
                                }}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>

                          <div className="flex items-center justify-between">
                            <code className="text-sm font-mono">
                              {maskLicenseCode(subscription.license.code)}
                            </code>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => copyLicenseCode(subscription.license!.code)}
                            >
                              <Copy className="h-4 w-4 mr-2" />
                              Copiar
                            </Button>
                          </div>

                          {subscription.license.client && (
                            <div>
                              <Label className="text-muted-foreground">Apelido</Label>
                              <p className="text-sm">{subscription.license.client}</p>
                            </div>
                          )}

                          {subscription.license.is_used && subscription.license.device_id ? (
                            <div className="space-y-2 border-t pt-3">
                              <Label className="flex items-center gap-2">
                                <Monitor className="h-4 w-4" />
                                Dispositivo Vinculado
                              </Label>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-sm font-medium">
                                    {subscription.license.device_type || 'Dispositivo'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    ID: {subscription.license.device_id}
                                  </p>
                                  {subscription.license.activated_at && (
                                    <p className="text-xs text-muted-foreground">
                                      Ativada em: {formatDate(subscription.license.activated_at)}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeactivateLicense(subscription.license!.id)}
                                  disabled={savingDeactivate === subscription.license!.id}
                                >
                                  {savingDeactivate === subscription.license!.id ? (
                                    <>
                                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                      Desvinculando...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="h-4 w-4 mr-2" />
                                      Desvincular
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="border-t pt-3">
                              <Badge variant="secondary">Licença Disponível para Ativação</Badge>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-3">
                      {subscription.status === "ACTIVE" && !subscription.cancel_at_period_end && (
                        <AlertDialog
                          open={cancelDialogOpen === subscription.id}
                          onOpenChange={(open) =>
                            setCancelDialogOpen(open ? subscription.id : null)
                          }
                        >
                          <Button
                            variant="outline"
                            onClick={() => setCancelDialogOpen(subscription.id)}
                          >
                            Cancelar Renovação
                          </Button>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Cancelar Renovação Automática?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Sua assinatura permanecerá ativa até {formatDate(subscription.current_period_end)}.
                                Após essa data, você perderá o acesso aos recursos.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel disabled={savingCancel}>Voltar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleCancelRenewal(subscription.id)}
                                disabled={savingCancel}
                              >
                                {savingCancel ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Cancelando...
                                  </>
                                ) : (
                                  "Confirmar Cancelamento"
                                )}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}

                      {subscription.status === "EXPIRED" || subscription.status === "CANCELED" ? (
                        <Dialog
                          open={reactivateDialogOpen === subscription.id}
                          onOpenChange={(open) =>
                            setReactivateDialogOpen(open ? subscription.id : null)
                          }
                        >
                          <Button
                            variant="default"
                            onClick={() => setReactivateDialogOpen(subscription.id)}
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Reativar Assinatura
                          </Button>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reativar Assinatura</DialogTitle>
                              <DialogDescription>
                                Escolha o plano de cobrança para reativar sua assinatura.
                              </DialogDescription>
                            </DialogHeader>
                            <RadioGroup
                              value={reactivatePlan}
                              onValueChange={(value) => setReactivatePlan(value as 'MONTHLY' | 'YEARLY')}
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="MONTHLY" id="monthly" />
                                <Label htmlFor="monthly">Mensal - R$ 49,90/mês</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="YEARLY" id="annual" />
                                <Label htmlFor="annual">Anual - R$ 499,00/ano (2 meses grátis)</Label>
                              </div>
                            </RadioGroup>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReactivateDialogOpen(null)}
                                disabled={savingReactivate}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleReactivateSubscription(subscription.id)}
                                disabled={savingReactivate}
                              >
                                {savingReactivate ? (
                                  <>
                                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                    Processando...
                                  </>
                                ) : (
                                  "Continuar para Pagamento"
                                )}
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      ) : null}

                      <Button
                        variant="outline"
                        onClick={() => navigate("/dashboard/pagamentos")}
                      >
                        Ver Histórico de Pagamentos
                      </Button>
                    </div>
                  </CardContent>
                </AccordionContent>
              </Card>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
};

export default Assinaturas;
