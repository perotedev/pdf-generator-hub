import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CreditCard, Calendar, Check, Copy, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const Assinaturas = () => {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const subscriptions = [
    {
      id: "SUB-001",
      plan: "Pro",
      status: "Ativa",
      startDate: "15/01/2025",
      endDate: "15/02/2026",
      price: "R$119/mês",
      autoRenew: true,
      licenseCode: "PDFG-PRO-X8K2-M9P4-L3N7",
      licenseStatus: "Ativa",
      computerUid: "PC-DESKTOP-4A7B2C",
      paymentStatus: "Pago",
    },
    {
      id: "SUB-002",
      plan: "Starter",
      status: "Expirada",
      startDate: "15/01/2024",
      endDate: "15/01/2025",
      price: "R$49/mês",
      autoRenew: false,
      licenseCode: "PDFG-STR-Y5H3-N2Q8-R9T6",
      licenseStatus: "Expirada",
      computerUid: "—",
      paymentStatus: "—",
    },
  ];

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Código copiado!",
      description: "O código da licença foi copiado para a área de transferência.",
    });
  };

  const handleCancelRenewal = () => {
    setCancelDialogOpen(false);
    toast({
      title: "Renovação automática cancelada",
      description: "Sua assinatura continuará ativa até a data de vencimento.",
    });
  };

  const maskLicenseCode = (code: string) => {
    const parts = code.split("-");
    return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Minhas Assinaturas
        </h1>
        <p className="text-muted-foreground">
          Gerencie suas assinaturas e visualize os detalhes das licenças
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
                <p className="text-sm text-muted-foreground">Plano Atual</p>
                <p className="text-xl font-bold text-foreground">Pro</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <Calendar className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Validade</p>
                <p className="text-xl font-bold text-foreground">15/02/2026</p>
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
                <p className="text-sm text-muted-foreground">Renovação</p>
                <p className="text-xl font-bold text-foreground">Automática</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subscriptions Table */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Histórico de Assinaturas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.id} className="border-border">
                    <TableCell className="font-medium">{sub.plan}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.status === "Ativa" ? "default" : "secondary"
                        }
                      >
                        {sub.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.endDate}</TableCell>
                    <TableCell>{sub.price}</TableCell>
                    <TableCell className="text-right">
                      {sub.status === "Ativa" && (
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm">
                            Mudar Plano
                          </Button>
                          <Dialog
                            open={cancelDialogOpen}
                            onOpenChange={setCancelDialogOpen}
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
                                <DialogTitle>
                                  Cancelar Renovação Automática
                                </DialogTitle>
                                <DialogDescription>
                                  Sua assinatura continuará ativa até{" "}
                                  {sub.endDate}. Após essa data, você perderá
                                  acesso às funcionalidades do plano{" "}
                                  {sub.plan}.
                                </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setCancelDialogOpen(false)}
                                >
                                  Voltar
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={handleCancelRenewal}
                                >
                                  Confirmar Cancelamento
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* License Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Detalhes da Licença</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Código da Licença</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>UID Computador</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Renovação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={`license-${sub.id}`} className="border-border">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <code className="rounded bg-muted px-2 py-1 text-xs font-mono">
                          {maskLicenseCode(sub.licenseCode)}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => copyLicenseCode(sub.licenseCode)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.licenseStatus === "Ativa"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {sub.licenseStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>{sub.endDate}</TableCell>
                    <TableCell>
                      <code className="text-xs font-mono text-muted-foreground">
                        {sub.computerUid}
                      </code>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          sub.paymentStatus === "Pago"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {sub.paymentStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {sub.autoRenew ? (
                        <div className="flex items-center gap-1 text-primary">
                          <Check className="h-4 w-4" />
                          <span className="text-sm">Automática</span>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          Manual
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Assinaturas;
