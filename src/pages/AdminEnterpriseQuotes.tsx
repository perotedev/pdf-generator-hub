import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  MoreVertical,
  RefreshCw,
  Shield,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
  Calendar,
  Users,
  Search,
  Filter,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface EnterpriseQuote {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  license_quantity: number;
  billing_preference: "MONTHLY" | "YEARLY" | "CUSTOM";
  message: string | null;
  status: "PENDING" | "CONTACTED" | "NEGOTIATING" | "APPROVED" | "REJECTED" | "CONVERTED";
  admin_notes: string | null;
  quoted_price: number | null;
  assigned_to: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  PENDING: { label: "Pendente", variant: "secondary" },
  CONTACTED: { label: "Contactado", variant: "default" },
  NEGOTIATING: { label: "Em Negociação", variant: "default" },
  APPROVED: { label: "Aprovado", variant: "default" },
  REJECTED: { label: "Rejeitado", variant: "destructive" },
  CONVERTED: { label: "Convertido", variant: "default" },
};

const billingLabels: Record<string, string> = {
  MONTHLY: "Mensal",
  YEARLY: "Anual",
  CUSTOM: "Personalizado",
};

const AdminEnterpriseQuotes = () => {
  const { toast } = useToast();
  const { isAdmin, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [quotes, setQuotes] = useState<EnterpriseQuote[]>([]);
  const [filteredQuotes, setFilteredQuotes] = useState<EnterpriseQuote[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedQuote, setSelectedQuote] = useState<EnterpriseQuote | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editStatus, setEditStatus] = useState("");
  const [editQuotedPrice, setEditQuotedPrice] = useState("");
  const [editAdminNotes, setEditAdminNotes] = useState("");

  useEffect(() => {
    fetchQuotes();
  }, []);

  useEffect(() => {
    filterQuotes();
  }, [quotes, searchTerm, statusFilter]);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("enterprise_quotes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      console.error("Error fetching quotes:", error);
      toast({
        title: "Erro ao carregar orçamentos",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterQuotes = () => {
    let filtered = [...quotes];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (q) =>
          q.company_name.toLowerCase().includes(search) ||
          q.contact_name.toLowerCase().includes(search) ||
          q.email.toLowerCase().includes(search)
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((q) => q.status === statusFilter);
    }

    setFilteredQuotes(filtered);
  };

  const handleView = (quote: EnterpriseQuote) => {
    setSelectedQuote(quote);
    setViewDialogOpen(true);
  };

  const handleEdit = (quote: EnterpriseQuote) => {
    setSelectedQuote(quote);
    setEditStatus(quote.status);
    setEditQuotedPrice(quote.quoted_price?.toString() || "");
    setEditAdminNotes(quote.admin_notes || "");
    setEditDialogOpen(true);
  };

  const handleDelete = (quote: EnterpriseQuote) => {
    setSelectedQuote(quote);
    setDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedQuote) return;

    setSaving(true);
    try {
      const updateData: Partial<EnterpriseQuote> = {
        status: editStatus as EnterpriseQuote["status"],
        admin_notes: editAdminNotes || null,
        quoted_price: editQuotedPrice ? parseFloat(editQuotedPrice) : null,
      };

      // Se mudou para CONTACTED, atualizar contacted_at
      if (editStatus === "CONTACTED" && selectedQuote.status !== "CONTACTED") {
        updateData.contacted_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from("enterprise_quotes")
        .update(updateData)
        .eq("id", selectedQuote.id);

      if (error) throw error;

      toast({
        title: "Orçamento atualizado!",
        description: "As alterações foram salvas com sucesso.",
      });

      setEditDialogOpen(false);
      fetchQuotes();
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedQuote) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("enterprise_quotes")
        .delete()
        .eq("id", selectedQuote.id);

      if (error) throw error;

      toast({
        title: "Orçamento excluído!",
        description: "O orçamento foi removido com sucesso.",
      });

      setDeleteDialogOpen(false);
      fetchQuotes();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return "-";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  if (!isAdmin) {
    return (
      <Card className="border-border">
        <CardContent className="py-10 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas administradores podem acessar esta página.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">
            Carregando orçamentos...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Orçamentos Enterprise
          </h1>
          <p className="text-muted-foreground">
            Gerencie solicitações de orçamento para planos corporativos
          </p>
        </div>
        <Button onClick={fetchQuotes} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100">
                <Building2 className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quotes.filter((q) => q.status === "PENDING").length}
                </p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quotes.filter((q) => q.status === "NEGOTIATING").length}
                </p>
                <p className="text-xs text-muted-foreground">Em Negociação</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Building2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {quotes.filter((q) => q.status === "CONVERTED").length}
                </p>
                <p className="text-xs text-muted-foreground">Convertidos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{quotes.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por empresa, contato ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Status</SelectItem>
                <SelectItem value="PENDING">Pendente</SelectItem>
                <SelectItem value="CONTACTED">Contactado</SelectItem>
                <SelectItem value="NEGOTIATING">Em Negociação</SelectItem>
                <SelectItem value="APPROVED">Aprovado</SelectItem>
                <SelectItem value="REJECTED">Rejeitado</SelectItem>
                <SelectItem value="CONVERTED">Convertido</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {filteredQuotes.length === 0 ? (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold">
                Nenhum orçamento encontrado
              </h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {quotes.length === 0
                  ? "Ainda não há solicitações de orçamento Enterprise."
                  : "Nenhum resultado para os filtros aplicados."}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Licenças</TableHead>
                  <TableHead>Cobrança</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredQuotes.map((quote) => (
                  <TableRow key={quote.id}>
                    <TableCell className="font-medium">
                      {quote.company_name}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{quote.contact_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {quote.email}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{quote.license_quantity}</TableCell>
                    <TableCell>{billingLabels[quote.billing_preference]}</TableCell>
                    <TableCell>
                      <Badge variant={statusLabels[quote.status]?.variant || "secondary"}>
                        {statusLabels[quote.status]?.label || quote.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(quote.created_at)}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(quote)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(quote)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(quote)}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Orçamento</DialogTitle>
            <DialogDescription>
              Informações completas da solicitação
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-muted-foreground">Empresa</Label>
                  <p className="font-medium">{selectedQuote.company_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Contato</Label>
                  <p className="font-medium">{selectedQuote.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" /> E-mail
                  </Label>
                  <p className="font-medium">{selectedQuote.email}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-4 w-4" /> Telefone
                  </Label>
                  <p className="font-medium">
                    {selectedQuote.phone || "Não informado"}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Quantidade de Licenças
                  </Label>
                  <p className="font-medium">{selectedQuote.license_quantity}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">
                    Preferência de Cobrança
                  </Label>
                  <p className="font-medium">
                    {billingLabels[selectedQuote.billing_preference]}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <p>
                    <Badge variant={statusLabels[selectedQuote.status]?.variant || "secondary"}>
                      {statusLabels[selectedQuote.status]?.label || selectedQuote.status}
                    </Badge>
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" /> Data da Solicitação
                  </Label>
                  <p className="font-medium">
                    {formatDate(selectedQuote.created_at)}
                  </p>
                </div>
              </div>

              {selectedQuote.message && (
                <div>
                  <Label className="text-muted-foreground">Mensagem</Label>
                  <p className="mt-1 p-3 bg-slate-200 rounded-lg text-sm">
                    {selectedQuote.message}
                  </p>
                </div>
              )}

              {selectedQuote.quoted_price !== null && (
                <div>
                  <Label className="text-muted-foreground">Valor Cotado</Label>
                  <p className="text-lg font-bold">
                    {formatCurrency(selectedQuote.quoted_price)}
                  </p>
                </div>
              )}

              {selectedQuote.admin_notes && (
                <div>
                  <Label className="text-muted-foreground">
                    Notas Administrativas
                  </Label>
                  <p className="mt-1 p-3 bg-slate-200 rounded-lg text-sm">
                    {selectedQuote.admin_notes}
                  </p>
                </div>
              )}

              {selectedQuote.contacted_at && (
                <div>
                  <Label className="text-muted-foreground">
                    Data do Contato
                  </Label>
                  <p className="font-medium">
                    {formatDate(selectedQuote.contacted_at)}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setViewDialogOpen(false);
                if (selectedQuote) handleEdit(selectedQuote);
              }}
            >
              Editar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Orçamento</DialogTitle>
            <DialogDescription>
              Atualize o status e informações do orçamento
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pendente</SelectItem>
                  <SelectItem value="CONTACTED">Contactado</SelectItem>
                  <SelectItem value="NEGOTIATING">Em Negociação</SelectItem>
                  <SelectItem value="APPROVED">Aprovado</SelectItem>
                  <SelectItem value="REJECTED">Rejeitado</SelectItem>
                  <SelectItem value="CONVERTED">Convertido</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Valor Cotado (R$)</Label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.00"
                value={editQuotedPrice}
                onChange={(e) => setEditQuotedPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notas Administrativas</Label>
              <Textarea
                placeholder="Adicione notas internas sobre este orçamento..."
                value={editAdminNotes}
                onChange={(e) => setEditAdminNotes(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Excluir Orçamento</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja excluir este orçamento? Esta ação não pode
              ser desfeita.
            </DialogDescription>
          </DialogHeader>
          {selectedQuote && (
            <div className="py-4">
              <p className="text-sm">
                <strong>Empresa:</strong> {selectedQuote.company_name}
              </p>
              <p className="text-sm">
                <strong>Contato:</strong> {selectedQuote.contact_name}
              </p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={saving}
            >
              {saving ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminEnterpriseQuotes;
