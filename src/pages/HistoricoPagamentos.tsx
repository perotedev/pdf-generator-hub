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
  invoiceUrl?: string;
  subscriptionId: string;
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
      invoiceUrl: "#",
      subscriptionId: "SUB-001",
    },
    {
      id: "PAY-002",
      date: "15/12/2025",
      description: "Assinatura Mensal - Dezembro/2025",
      plan: "Pro",
      amount: "R$ 119,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      invoiceUrl: "#",
      subscriptionId: "SUB-001",
    },
    {
      id: "PAY-003",
      date: "01/12/2025",
      description: "Assinatura Anual - 2025/2026",
      plan: "Starter",
      amount: "R$ 468,00",
      status: "Pago",
      paymentMethod: "PIX",
      invoiceUrl: "#",
      subscriptionId: "SUB-002",
    },
    {
      id: "PAY-004",
      date: "15/11/2025",
      description: "Assinatura Mensal - Novembro/2025",
      plan: "Pro",
      amount: "R$ 119,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      invoiceUrl: "#",
      subscriptionId: "SUB-001",
    },
    {
      id: "PAY-005",
      date: "15/10/2025",
      description: "Upgrade de Plano - Pro",
      plan: "Pro",
      amount: "R$ 70,00",
      status: "Pago",
      paymentMethod: "Cartão de Crédito",
      invoiceUrl: "#",
      subscriptionId: "SUB-001",
    },
    {
      id: "PAY-006",
      date: "15/01/2025",
      description: "Assinatura Anual - 2024/2025",
      plan: "Starter",
      amount: "R$ 468,00",
      status: "Pago",
      paymentMethod: "Boleto Bancário",
      invoiceUrl: "#",
      subscriptionId: "SUB-003",
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
      <div className="grid gap-4 md:grid-cols-3">
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
            <div className="flex flex-wrap gap-2">
              <Select value={filterYear} onValueChange={setFilterYear}>
                <SelectTrigger className="w-[140px]">
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
                <SelectTrigger className="w-[140px]">
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
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-center">Ações</TableHead>
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
                        <div>
                          <p className="text-sm font-medium">{payment.description}</p>
                          <p className="text-xs text-muted-foreground">
                            ID: {payment.id}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{payment.plan}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payment.paymentMethod}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {payment.amount}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(payment.status)}>
                          {payment.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-2"
                          onClick={() => handleViewDetails(payment)}
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
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
            • As notas fiscais são emitidas automaticamente após a confirmação do
            pagamento.
          </p>
          <p>
            • Você pode baixar suas notas fiscais a qualquer momento clicando no botão
            correspondente.
          </p>
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
        <DialogContent className="max-w-2xl">
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

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                {selectedPayment.invoiceUrl && selectedPayment.status === "Pago" && (
                  <Button variant="outline" className="gap-2">
                    <Download className="h-4 w-4" />
                    Baixar Nota Fiscal
                  </Button>
                )}
                {selectedPayment.status === "Pago" && (
                  <Button variant="outline" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Baixar Comprovante
                  </Button>
                )}
              </div>

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
