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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Download, Calendar, CreditCard, FileText, DollarSign, Eye } from "lucide-react";
import { useState } from "react";

interface Payment {
  id: string;
  date: string;
  description: string;
  plan: string;
  amount: string;
  status: "Pago" | "Pendente" | "Cancelado" | "Reembolsado";
  paymentMethod: string;
  subscriptionId: string;
  paymentDetails?: {
    type: "credit" | "debit" | "pix" | "boleto";
    installments?: number;
    pixKey?: string;
    pixQrCode?: string;
    boletoCode?: string;
    boletoUrl?: string;
    dueDate?: string;
  };
}

const HistoricoPagamentos = () => {
  const [filterYear, setFilterYear] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const payments: Payment[] = [
    {
      id: "PAY-001",
      date: "15/01/2026",
      description: "Assinatura Mensal - Janeiro/2026",
      plan: "Pro",
      amount: "R$ 119,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      subscriptionId: "SUB-001",
      paymentDetails: {
        type: "credit",
        installments: 1,
      },
    },
    {
      id: "PAY-002",
      date: "15/12/2025",
      description: "Assinatura Mensal - Dezembro/2025",
      plan: "Pro",
      amount: "R$ 119,00",
      status: "Pago",
      paymentMethod: "Cartão de Débito",
      subscriptionId: "SUB-001",
      paymentDetails: {
        type: "debit",
      },
    },
    {
      id: "PAY-003",
      date: "01/12/2025",
      description: "Assinatura Anual - 2025/2026",
      plan: "Starter",
      amount: "R$ 468,00",
      status: "Pago",
      paymentMethod: "PIX",
      subscriptionId: "SUB-002",
      paymentDetails: {
        type: "pix",
        pixKey: "pix@pdfgenerator.com.br",
      },
    },
    {
      id: "PAY-004",
      date: "15/11/2025",
      description: "Assinatura Mensal - Novembro/2025",
      plan: "Pro",
      amount: "R$ 119,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      subscriptionId: "SUB-001",
      paymentDetails: {
        type: "credit",
        installments: 3,
      },
    },
    {
      id: "PAY-005",
      date: "15/10/2025",
      description: "Upgrade de Plano - Pro",
      plan: "Pro",
      amount: "R$ 70,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      subscriptionId: "SUB-001",
      paymentDetails: {
        type: "credit",
        installments: 1,
      },
    },
    {
      id: "PAY-006",
      date: "15/01/2025",
      description: "Assinatura Anual - 2024/2025",
      plan: "Starter",
      amount: "R$ 468,00",
      status: "Pago",
      paymentMethod: "Boleto Bancário",
      subscriptionId: "SUB-003",
      paymentDetails: {
        type: "boleto",
        boletoCode: "34191.79001 01043.510047 91020.150008 8 96610000046800",
        boletoUrl: "https://eppge.fgv.br/sites/default/files/teste.pdf",
        dueDate: "20/01/2025",
      },
    },
    {
      id: "PAY-007",
      date: "05/01/2026",
      description: "Reembolso - Cancelamento",
      plan: "Starter",
      amount: "R$ -39,00",
      status: "Reembolsado",
      paymentMethod: "Estorno",
      subscriptionId: "SUB-003",
    },
  ];

  const getStatusVariant = (status: Payment["status"]) => {
    switch (status) {
      case "Pago":
        return "default";
      case "Pendente":
        return "secondary";
      case "Cancelado":
        return "destructive";
      case "Reembolsado":
        return "outline";
      default:
        return "secondary";
    }
  };

  const filteredPayments = payments.filter((payment) => {
    const yearMatch = filterYear === "all" || payment.date.endsWith(filterYear);
    const statusMatch = filterStatus === "all" || payment.status === filterStatus;
    return yearMatch && statusMatch;
  });

  const totalPaid = payments
    .filter((p) => p.status === "Pago")
    .reduce((acc, p) => {
      const value = parseFloat(p.amount.replace("R$ ", "").replace(",", "."));
      return acc + value;
    }, 0);

  const totalRefunded = payments
    .filter((p) => p.status === "Reembolsado")
    .reduce((acc, p) => {
      const value = Math.abs(parseFloat(p.amount.replace("R$ ", "").replace(",", ".")));
      return acc + value;
    }, 0);

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Histórico de Pagamentos
        </h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todas as suas transações
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pago</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {totalPaid.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-chart-1/10">
                <FileText className="h-6 w-6 text-chart-1" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Transações</p>
                <p className="text-xl font-bold text-foreground">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-destructive/10">
                <CreditCard className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Reembolsado</p>
                <p className="text-xl font-bold text-foreground">
                  R$ {totalRefunded.toFixed(2).replace(".", ",")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card className="border-border">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <CardTitle>Todas as Transações</CardTitle>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Ano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Anos</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="Pago">Pago</SelectItem>
                  <SelectItem value="Pendente">Pendente</SelectItem>
                  <SelectItem value="Cancelado">Cancelado</SelectItem>
                  <SelectItem value="Reembolsado">Reembolsado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredPayments.length > 0 ? (
              filteredPayments.map((payment) => (
                <Card key={payment.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{payment.description}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{payment.date}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold">{payment.amount}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary" className="text-xs">{payment.plan}</Badge>
                        <Badge variant={getStatusVariant(payment.status)} className="text-xs">
                          {payment.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Método:</span> {payment.paymentMethod}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleViewDetails(payment)}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma transação encontrada com os filtros selecionados.
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead className="hidden lg:table-cell">Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayments.length > 0 ? (
                  filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{payment.date}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{payment.description}</p>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{payment.plan}</Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell className="font-semibold whitespace-nowrap">
                        {payment.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma transação encontrada com os filtros selecionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Information Card */}
      <Card className="border-border bg-muted/30">
        <CardHeader>
          <CardTitle className="text-lg">Informações sobre Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            • Em caso de reembolso, o valor será devolvido no mesmo método de pagamento
            utilizado.
          </p>
          <p>
            • Para dúvidas sobre pagamentos, entre em contato com nosso suporte através
            do email suporte@pdfgenerator.com.
          </p>
        </CardContent>
      </Card>

      {/* Payment Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Pagamento</DialogTitle>
            <DialogDescription>
              Informações completas sobre a transação {selectedPayment?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-6">
              {/* Main Info */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ID da Transação</p>
                  <p className="font-semibold">{selectedPayment.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Data do Pagamento</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <p className="font-semibold">{selectedPayment.date}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Status</p>
                  <Badge variant={getStatusVariant(selectedPayment.status)}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Valor</p>
                  <p className="text-xl font-bold text-primary">{selectedPayment.amount}</p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border"></div>

              {/* Payment Details */}
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Plano</p>
                  <Badge variant="secondary" className="text-base">
                    {selectedPayment.plan}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Método de Pagamento</p>
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <p className="font-medium">{selectedPayment.paymentMethod}</p>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Assinatura Relacionada</p>
                  <p className="font-medium">{selectedPayment.subscriptionId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição</p>
                  <p className="font-medium text-sm">{selectedPayment.description}</p>
                </div>
              </div>

              {/* Separator */}
              <div className="border-t border-border"></div>

              {/* Payment Method Details */}
              {selectedPayment.paymentDetails && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Detalhes do Pagamento</h4>

                  {selectedPayment.paymentDetails.type === "credit" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <p className="font-medium">Cartão de Crédito</p>
                      </div>
                      <div className="grid gap-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Parcelas:</span>
                          <span className="font-medium">
                            {selectedPayment.paymentDetails.installments}x de{" "}
                            {selectedPayment.paymentDetails.installments && selectedPayment.paymentDetails.installments > 1
                              ? `R$ ${(parseFloat(selectedPayment.amount.replace("R$ ", "").replace(",", ".")) / selectedPayment.paymentDetails.installments).toFixed(2).replace(".", ",")}`
                              : selectedPayment.amount
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Forma de pagamento:</span>
                          <span className="font-medium">
                            {selectedPayment.paymentDetails.installments === 1 ? "À vista" : "Parcelado"}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPayment.paymentDetails.type === "debit" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-5 w-5 text-primary" />
                        <p className="font-medium">Cartão de Débito</p>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Pagamento processado instantaneamente via débito bancário.
                      </div>
                    </div>
                  )}

                  {selectedPayment.paymentDetails.type === "pix" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="font-medium">PIX</p>
                      </div>
                      <div className="space-y-2">
                        {selectedPayment.paymentDetails.pixKey && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Chave PIX:</span>
                            <code className="font-mono text-xs bg-background px-2 py-1 rounded">
                              {selectedPayment.paymentDetails.pixKey}
                            </code>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          Pagamento aprovado instantaneamente via PIX.
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedPayment.paymentDetails.type === "boleto" && (
                    <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        <p className="font-medium">Boleto Bancário</p>
                      </div>
                      <div className="space-y-3">
                        {selectedPayment.paymentDetails.dueDate && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Vencimento:</span>
                            <span className="font-medium">{selectedPayment.paymentDetails.dueDate}</span>
                          </div>
                        )}
                        {selectedPayment.paymentDetails.boletoCode && (
                          <div>
                            <p className="text-sm text-muted-foreground mb-1">Código de barras:</p>
                            <code className="font-mono text-xs bg-background px-2 py-1 rounded block break-all">
                              {selectedPayment.paymentDetails.boletoCode}
                            </code>
                          </div>
                        )}
                        {selectedPayment.paymentDetails.boletoUrl && (
                          <div className="pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full gap-2"
                              onClick={() => window.open(selectedPayment.paymentDetails?.boletoUrl, '_blank')}
                            >
                              <Download className="h-4 w-4" />
                              Baixar Boleto (PDF)
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Additional Info */}
              {selectedPayment.status === "Reembolsado" && (
                <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <p className="text-sm text-destructive">
                    <strong>Reembolso processado:</strong> O valor foi devolvido ao método de
                    pagamento original. O estorno pode levar até 7 dias úteis para aparecer
                    na sua fatura.
                  </p>
                </div>
              )}

              {selectedPayment.status === "Pendente" && (
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4">
                  <p className="text-sm text-yellow-700 dark:text-yellow-500">
                    <strong>Pagamento pendente:</strong> Aguardando confirmação do pagamento.
                    Isso pode levar alguns minutos ou até 3 dias úteis, dependendo do método
                    escolhido.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HistoricoPagamentos;
