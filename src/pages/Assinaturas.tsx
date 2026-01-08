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
import { CreditCard, Calendar, Check, Copy, RefreshCw, Key, Monitor, Trash2 } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

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
    status: "Ativa" | "Expirada" | "Disponível";
    computerUid: string | null;
    deviceName: string | null;
    activatedAt: string | null;
    paymentStatus: "Pago" | "Pendente" | "—";
  };
}

const Assinaturas = () => {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState<string | null>(null);

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
      <div className="grid gap-4 md:grid-cols-3">
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
            {subscriptions.map((sub) => (
              <AccordionItem key={sub.id} value={sub.id} className="border-border">
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
                    {sub.status === "Ativa" && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        <Button variant="outline" size="sm">
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
                      </div>
                    )}
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
