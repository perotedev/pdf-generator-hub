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
  DialogTrigger,
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { CreditCard, Calendar, Check, Copy, RefreshCw, Key, Monitor, Trash2, Edit2, RotateCcw } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface Subscription {
  id: string;
  plan: string;
  status: "Ativa" | "Expirada" | "Cancelada";
  startDate: string;
  endDate: string;
  price: string;
  autoRenew: boolean;
  license: {
    code: string;
    nickname: string;
    status: "Ativa" | "Expirada" | "Disponível";
    computerUid: string | null;
    deviceName: string | null;
    activatedAt: string | null;
    paymentStatus: "Pago" | "Pendente" | "—";
  };
}

const Assinaturas = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);
  const [editingNickname, setEditingNickname] = useState<string | null>(null);
  const [nicknameValue, setNicknameValue] = useState("");
  const [reactivateDialogOpen, setReactivateDialogOpen] = useState<string | null>(null);
  const [reactivatePlan, setReactivatePlan] = useState<'monthly' | 'annual'>('monthly');

  const subscriptions: Subscription[] = [
    {
      id: "SUB-001",
      plan: "Pro",
      status: "Ativa",
      startDate: "15/01/2025",
      endDate: "15/02/2026",
      price: "R$119/mês",
      autoRenew: true,
      license: {
        code: "PDFG-PRO-X8K2-M9P4-L3N7",
        nickname: "Computador Principal",
        status: "Ativa",
        computerUid: "PC-DESKTOP-4A7B2C",
        deviceName: "Desktop Windows",
        activatedAt: "15/01/2025",
        paymentStatus: "Pago",
      },
    },
    {
      id: "SUB-002",
      plan: "Starter",
      status: "Ativa",
      startDate: "01/12/2024",
      endDate: "01/12/2025",
      price: "R$49/mês",
      autoRenew: true,
      license: {
        code: "PDFG-STR-Z3J8-K7F2-W5M9",
        nickname: "Licença Disponível",
        status: "Disponível",
        computerUid: null,
        deviceName: null,
        activatedAt: null,
        paymentStatus: "Pago",
      },
    },
    {
      id: "SUB-003",
      plan: "Starter",
      status: "Expirada",
      startDate: "15/01/2024",
      endDate: "15/01/2025",
      price: "R$49/mês",
      autoRenew: false,
      license: {
        code: "PDFG-STR-Y5H3-N2Q8-R9T6",
        nickname: "Notebook Trabalho",
        status: "Expirada",
        computerUid: "PC-OFFICE-7X9K2L",
        deviceName: "Notebook Trabalho",
        activatedAt: "20/01/2024",
        paymentStatus: "—",
      },
    },
  ];

  const activeSubscriptions = subscriptions.filter((sub) => sub.status === "Ativa");

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código da licença foi copiado para a área de transferência.",
    });
  };

  const handleCancelRenewal = (subId: string) => {
    setCancelDialogOpen(null);
    toast({
      title: "Renovação automática cancelada",
      description: "Sua assinatura continuará ativa até a data de vencimento.",
    });
  };

  const handleDeactivateLicense = (subId: string) => {
    toast({
      title: "Licença desativada",
      description: "O dispositivo foi desvinculado e a licença está disponível novamente.",
    });
  };

  const handleEditNickname = (subId: string, currentNickname: string) => {
    setEditingNickname(subId);
    setNicknameValue(currentNickname);
  };

  const handleSaveNickname = (subId: string) => {
    setEditingNickname(null);
    toast({
      title: "Apelido atualizado",
      description: "O apelido da licença foi atualizado com sucesso.",
    });
  };

  const handleReactivateSubscription = (subId: string, plan: string) => {
    setReactivateDialogOpen(null);
    const planType = reactivatePlan === 'monthly' ? 'Mensal' : 'Anual';
    const price = reactivatePlan === 'monthly' ? 'R$49/mês' : 'R$468/ano';

    toast({
      title: "Assinatura reativada com sucesso!",
      description: `Sua assinatura ${plan} (${planType}) foi reativada. ${price}`,
    });

    // Em produção, aqui seria feita uma chamada à API para processar o pagamento
    // e reativar a assinatura
  };

  const maskLicenseCode = (code: string) => {
    const parts = code.split("-");
    return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "Ativa":
        return "default";
      case "Disponível":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Minhas Assinaturas
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas assinaturas e licenças do PDF Generator
        </p>
      </div>

      {/* Active Subscription Summary */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <CreditCard className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assinaturas Ativas</p>
                <p className="text-xl font-bold text-foreground">{activeSubscriptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <Key className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Licenças em Uso</p>
                <p className="text-xl font-bold text-foreground">
                  {subscriptions.filter((s) => s.license.status === "Ativa").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-2/10">
                <RefreshCw className="h-6 w-6 text-chart-2" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Renovação Automática</p>
                <p className="text-xl font-bold text-foreground">
                  {subscriptions.filter((s) => s.autoRenew && s.status === "Ativa").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions List */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Todas as Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {subscriptions.map((sub, index) => (
              <AccordionItem
                key={sub.id}
                value={sub.id}
                className={`border-border ${index === subscriptions.length - 1 ? 'border-b-0' : ''}`}
              >
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex flex-1 items-center justify-between pr-4">
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <CreditCard className="h-5 w-5 text-primary" />
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">Plano {sub.plan}</p>
                        <p className="text-sm text-muted-foreground">
                          Validade: {sub.endDate}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusVariant(sub.status)}>{sub.status}</Badge>
                      <span className="text-sm font-medium text-muted-foreground">
                        {sub.price}
                      </span>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    {/* Subscription Details */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Início</p>
                        <p className="font-medium text-foreground">{sub.startDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Data de Validade</p>
                        <p className="font-medium text-foreground">{sub.endDate}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Renovação</p>
                        <p className="font-medium text-foreground">
                          {sub.autoRenew ? (
                            <span className="flex items-center gap-1 text-primary">
                              <Check className="h-4 w-4" />
                              Automática
                            </span>
                          ) : (
                            "Manual"
                          )}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Pagamento</p>
                        <Badge variant={sub.license.paymentStatus === "Pago" ? "default" : "secondary"}>
                          {sub.license.paymentStatus}
                        </Badge>
                      </div>
                    </div>

                    {/* License Section */}
                    <div className="rounded-lg border border-border bg-muted/30 p-4">
                      <div className="flex items-center gap-2 mb-4">
                        <Key className="h-5 w-5 text-primary" />
                        <h4 className="font-semibold text-foreground">Licença da Assinatura</h4>
                      </div>

                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Apelido da Licença</p>
                          {editingNickname === sub.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                value={nicknameValue}
                                onChange={(e) => setNicknameValue(e.target.value)}
                                className="h-8 text-sm"
                                placeholder="Ex: Computador Principal"
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2"
                                onClick={() => handleSaveNickname(sub.id)}
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">{sub.license.nickname}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0"
                                onClick={() => handleEditNickname(sub.id, sub.license.nickname)}
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Código da Licença</p>
                          <div className="flex items-center gap-2">
                            <code className="rounded bg-background px-2 py-1 text-xs font-mono border border-border">
                              {maskLicenseCode(sub.license.code)}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => copyLicenseCode(sub.license.code)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Status</p>
                          <Badge variant={getStatusVariant(sub.license.status)}>
                            {sub.license.status}
                          </Badge>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Dispositivo</p>
                          {sub.license.deviceName ? (
                            <div className="flex items-center gap-2">
                              <Monitor className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm font-medium">{sub.license.deviceName}</span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Não ativada</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">UID do Computador</p>
                          {sub.license.computerUid ? (
                            <code className="text-xs font-mono text-muted-foreground">
                              {sub.license.computerUid}
                            </code>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Data de Ativação</p>
                          <span className="text-sm font-medium">
                            {sub.license.activatedAt || "—"}
                          </span>
                        </div>
                      </div>

                      {/* License Actions */}
                      {sub.license.status === "Ativa" && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Desvincular Dispositivo
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Desvincular Dispositivo</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Deseja realmente desvincular esta licença do dispositivo "
                                  {sub.license.deviceName}"? A licença ficará disponível para
                                  uso em outro dispositivo.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeactivateLicense(sub.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Desvincular
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      )}
                    </div>

                    {/* Subscription Actions */}
                    <div className="flex flex-wrap gap-2 pt-2">
                      {sub.status === "Ativa" ? (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/dashboard/assinaturas/mudar-plano?subscriptionId=${sub.id}&currentPlan=${sub.plan}`
                              )
                            }
                          >
                            Mudar Plano
                          </Button>
                          {sub.autoRenew && (
                            <Dialog
                              open={cancelDialogOpen === sub.id}
                              onOpenChange={(open) =>
                                setCancelDialogOpen(open ? sub.id : null)
                              }
                            >
                              <DialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive hover:text-destructive"
                                >
                                  Cancelar Renovação
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Cancelar Renovação Automática</DialogTitle>
                                  <DialogDescription>
                                    Sua assinatura continuará ativa até {sub.endDate}. Após
                                    essa data, você perderá acesso às funcionalidades do plano{" "}
                                    {sub.plan}.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => setCancelDialogOpen(null)}
                                  >
                                    Voltar
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => handleCancelRenewal(sub.id)}
                                  >
                                    Confirmar Cancelamento
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                        </>
                      ) : (
                        <Dialog
                          open={reactivateDialogOpen === sub.id}
                          onOpenChange={(open) => {
                            setReactivateDialogOpen(open ? sub.id : null);
                            if (open) setReactivatePlan('monthly');
                          }}
                        >
                          <DialogTrigger asChild>
                            <Button
                              variant="default"
                              size="sm"
                              className="bg-primary hover:bg-primary/90"
                            >
                              <RotateCcw className="h-4 w-4 mr-2" />
                              Reativar Assinatura
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-[500px]">
                            <DialogHeader>
                              <DialogTitle>Reativar Assinatura</DialogTitle>
                              <DialogDescription>
                                Reative sua assinatura do plano {sub.plan} e volte a usar todas as funcionalidades.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                              <div className="space-y-3">
                                <Label className="text-base font-medium">
                                  Escolha o tipo de plano:
                                </Label>
                                <RadioGroup
                                  value={reactivatePlan}
                                  onValueChange={(value: 'monthly' | 'annual') => setReactivatePlan(value)}
                                  className="space-y-3"
                                >
                                  <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="monthly" id="monthly" className="mt-1" />
                                    <Label
                                      htmlFor="monthly"
                                      className="flex-1 cursor-pointer space-y-1 leading-normal"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">Plano Mensal</span>
                                        <span className="text-lg font-bold">R$49/mês</span>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        Renovação automática mensal. Cancele quando quiser.
                                      </p>
                                    </Label>
                                  </div>
                                  <div className="flex items-start space-x-3 space-y-0 rounded-lg border border-border p-4 hover:bg-muted/50 transition-colors">
                                    <RadioGroupItem value="annual" id="annual" className="mt-1" />
                                    <Label
                                      htmlFor="annual"
                                      className="flex-1 cursor-pointer space-y-1 leading-normal"
                                    >
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium">Plano Anual</span>
                                        <div className="text-right">
                                          <span className="text-lg font-bold">R$468/ano</span>
                                          <Badge variant="secondary" className="ml-2 bg-green-100 text-green-700">
                                            Economize 20%
                                          </Badge>
                                        </div>
                                      </div>
                                      <p className="text-sm text-muted-foreground">
                                        R$39/mês • Pagamento anual • Melhor custo-benefício
                                      </p>
                                    </Label>
                                  </div>
                                </RadioGroup>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                                <div className="flex items-center gap-2">
                                  <Key className="h-4 w-4 text-primary" />
                                  <span className="text-sm font-medium">O que você receberá:</span>
                                </div>
                                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                                  <li>• Sua licença será reativada imediatamente</li>
                                  <li>• Acesso completo a todas as funcionalidades do plano {sub.plan}</li>
                                  <li>• Renovação automática para garantir acesso contínuo</li>
                                  <li>• Suporte técnico prioritário</li>
                                </ul>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button
                                variant="outline"
                                onClick={() => setReactivateDialogOpen(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleReactivateSubscription(sub.id, sub.plan)}
                              >
                                Confirmar Reativação
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Como ativar sua licença</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>1. Baixe e instale o PDF Generator no seu computador.</p>
          <p>
            2. Ao abrir o aplicativo pela primeira vez, será solicitado o código
            da licença.
          </p>
          <p>
            3. Copie o código da licença da sua assinatura e cole no campo indicado.
          </p>
          <p>
            4. Clique em "Ativar" e aguarde a confirmação. A licença será
            vinculada ao dispositivo.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assinaturas;
