import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  Laptop,
  CheckCircle,
  XCircle,
  RefreshCw,
  Shield,
  FileText,
  Eye,
  ChevronLeft,
  Key,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { contractApi, supabase, type Contract, type License } from '@/lib/supabase';

interface EnterpriseQuote {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
}

export default function AdminContracts() {
  const { isAdmin, isManager, getAccessToken, logoutWithRedirect } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [quotes, setQuotes] = useState<EnterpriseQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editingContract, setEditingContract] = useState<Contract | null>(null);
  const [deletingContract, setDeletingContract] = useState<Contract | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractLicenses, setContractLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [unbindingDevice, setUnbindingDevice] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [savingLicense, setSavingLicense] = useState(false);

  const [newContract, setNewContract] = useState({
    company_name: '',
    representative_name: '',
    email: '',
    phone: '',
    value: '',
    quote_id: '',
    license_quantity: '1',
    plan_type: '',
    expire_days: '183',
  });

  const canManage = isAdmin || isManager;

  useEffect(() => {
    fetchContracts();
    fetchQuotes();
  }, []);

  const fetchContracts = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      const response = await contractApi.getContracts(token);
      setContracts(response.contracts || []);
    } catch (error: any) {
      console.error('Error fetching contracts:', error);
      toast.error('Erro ao carregar contratos', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchQuotes = async () => {
    try {
      const { data, error } = await supabase
        .from('enterprise_quotes')
        .select('id, company_name, contact_name, email, phone')
        .in('status', ['APPROVED', 'NEGOTIATING'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuotes(data || []);
    } catch (error: any) {
      console.error('Error fetching quotes:', error);
    }
  };

  const fetchContractLicenses = async (contractId: string) => {
    try {
      setLoadingLicenses(true);
      const token = getAccessToken();
      if (!token) return;

      const response = await contractApi.getContractLicenses(token, contractId);
      setContractLicenses(response.licenses || []);
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      toast.error('Erro ao carregar licenças');
    } finally {
      setLoadingLicenses(false);
    }
  };

  const filteredContracts = contracts.filter(
    (contract) =>
      contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.representative_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contract.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    fetchContractLicenses(contract.id);
  };

  const handleBackToList = () => {
    setSelectedContract(null);
    setContractLicenses([]);
  };

  const handleCreateContract = async () => {
    try {
      setSavingCreate(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      await contractApi.createContract(token, {
        company_name: newContract.company_name,
        representative_name: newContract.representative_name,
        email: newContract.email,
        phone: newContract.phone,
        value: parseFloat(newContract.value),
        quote_id: newContract.quote_id || undefined,
        license_quantity: parseInt(newContract.license_quantity),
        plan_type: newContract.plan_type || undefined,
        expire_days: parseInt(newContract.expire_days),
      });

      await fetchContracts();

      toast.success('Contrato criado com sucesso!', {
        description: `${newContract.license_quantity} licenças foram geradas.`,
      });

      setAddDialog(false);
      setNewContract({
        company_name: '',
        representative_name: '',
        email: '',
        phone: '',
        value: '',
        quote_id: '',
        license_quantity: '1',
        plan_type: '',
        expire_days: '183',
      });
    } catch (error: any) {
      toast.error('Erro ao criar contrato', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingCreate(false);
    }
  };

  const handleEditContract = async () => {
    if (!editingContract) return;

    try {
      setSavingEdit(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      await contractApi.updateContract(token, editingContract.id, {
        company_name: editingContract.company_name,
        representative_name: editingContract.representative_name,
        email: editingContract.email,
        phone: editingContract.phone,
        value: editingContract.value,
      });

      await fetchContracts();

      toast.success('Contrato atualizado!');
      setEditingContract(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar contrato', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteContract = async () => {
    if (!deletingContract) return;

    try {
      setSavingDelete(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      await contractApi.deleteContract(token, deletingContract.id);
      await fetchContracts();

      toast.success('Contrato excluído!', {
        description: 'O contrato e todas as licenças associadas foram removidos.',
      });

      setDeletingContract(null);
    } catch (error: any) {
      toast.error('Erro ao excluir contrato', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingDelete(false);
    }
  };

  const handleUnbindDevice = async (license: License) => {
    try {
      setUnbindingDevice(license.id);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      await contractApi.unbindDevice(token, license.id);

      if (selectedContract) {
        await fetchContractLicenses(selectedContract.id);
      }

      toast.success('Dispositivo desvinculado!');
    } catch (error: any) {
      toast.error('Erro ao desvincular dispositivo', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setUnbindingDevice(null);
    }
  };

  const handleEditLicense = async () => {
    if (!editingLicense) return;

    try {
      setSavingLicense(true);
      const token = getAccessToken();
      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        logoutWithRedirect();
        return;
      }

      await contractApi.adminUpdateLicense(token, editingLicense.id, {
        client: editingLicense.client,
        expire_date: editingLicense.expire_date,
        plan_type: editingLicense.plan_type,
        sold: editingLicense.sold,
      });

      if (selectedContract) {
        await fetchContractLicenses(selectedContract.id);
      }

      toast.success('Licença atualizada!');
      setEditingLicense(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar licença', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingLicense(false);
    }
  };

  const handleQuoteSelect = (quoteId: string) => {
    const quote = quotes.find(q => q.id === quoteId);
    if (quote) {
      setNewContract(prev => ({
        ...prev,
        quote_id: quoteId,
        company_name: quote.company_name,
        representative_name: quote.contact_name,
        email: quote.email,
        phone: quote.phone || '',
      }));
    } else {
      setNewContract(prev => ({ ...prev, quote_id: '' }));
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (!canManage) {
    return (
      <Card className="border-border">
        <CardContent className="py-10 text-center">
          <Shield className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-lg font-semibold">Acesso Negado</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Apenas administradores e gerentes podem acessar esta página.
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
          <p className="mt-2 text-muted-foreground">Carregando contratos...</p>
        </div>
      </div>
    );
  }

  // Visualização de detalhes do contrato
  if (selectedContract) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={handleBackToList}>
            <ChevronLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Contrato {selectedContract.contract_number}
            </h1>
            <p className="text-muted-foreground">{selectedContract.company_name}</p>
          </div>
        </div>

        {/* Detalhes do Contrato */}
        <Card>
          <CardHeader>
            <CardTitle>Detalhes do Contrato</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Empresa</p>
                  <p className="font-medium">{selectedContract.company_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Representante</p>
                  <p className="font-medium">{selectedContract.representative_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedContract.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{selectedContract.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Valor</p>
                  <p className="font-medium">{formatCurrency(selectedContract.value)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Criação</p>
                  <p className="font-medium">{formatDate(selectedContract.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats das Licenças */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{contractLicenses.length}</p>
                  <p className="text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                  <CheckCircle className="h-5 w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {contractLicenses.filter(l => l.is_used).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <XCircle className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {contractLicenses.filter(l => !l.is_used).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Disponíveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <CheckCircle className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {contractLicenses.filter(l => l.sold).length}
                  </p>
                  <p className="text-sm text-muted-foreground">Vendidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabela de Licenças */}
        <Card>
          <CardHeader>
            <CardTitle>Licenças do Contrato</CardTitle>
          </CardHeader>
          {loadingLicenses ? (
            <CardContent>
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-primary" />
              </div>
            </CardContent>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Apelido</TableHead>
                  <TableHead className="text-center">Plano</TableHead>
                  <TableHead className="text-center">OS</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhuma licença encontrada
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contractLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <code className="text-xs font-mono">{license.code}</code>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={license.is_used ? 'default' : 'secondary'}>
                            {license.is_used ? 'Ativa' : 'Disponível'}
                          </Badge>
                          {license.sold && (
                            <Badge variant="outline" className="w-fit">
                              Vendida
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{license.client || 'N/A'}</TableCell>
                      <TableCell className="text-center">{license.plan_type || 'N/A'}</TableCell>
                      <TableCell className="text-center">
                        {license.is_used && license.device_id && (
                          <div className="flex items-center justify-center gap-1 text-muted-foreground">
                            <Laptop className="h-3 w-3" />
                            {license.device_type}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(license.expire_date)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {license.is_used && license.device_id && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbindDevice(license)}
                              disabled={unbindingDevice === license.id}
                            >
                              {unbindingDevice === license.id ? (
                                <RefreshCw className="h-4 w-4 animate-spin" />
                              ) : (
                                <Laptop className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingLicense(license)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Dialog de Edição de Licença */}
        <Dialog open={!!editingLicense} onOpenChange={(open) => !open && setEditingLicense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Licença</DialogTitle>
              <DialogDescription>
                Atualize as informações da licença
              </DialogDescription>
            </DialogHeader>
            {editingLicense && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Código</Label>
                  <code className="block text-sm font-mono p-2 bg-muted rounded">
                    {editingLicense.code}
                  </code>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-client">Apelido</Label>
                  <Input
                    id="edit-client"
                    value={editingLicense.client || ''}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, client: e.target.value })
                    }
                    placeholder="Nome para identificar a licença"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-plan">Tipo de Plano</Label>
                  <Input
                    id="edit-plan"
                    value={editingLicense.plan_type || ''}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, plan_type: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-expire">Data de Validade</Label>
                  <Input
                    id="edit-expire"
                    type="date"
                    value={editingLicense.expire_date?.split('T')[0] || ''}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, expire_date: e.target.value })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="edit-sold"
                    checked={editingLicense.sold}
                    onChange={(e) =>
                      setEditingLicense({ ...editingLicense, sold: e.target.checked })
                    }
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="edit-sold">Marcar como vendida</Label>
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLicense(null)} disabled={savingLicense}>
                Cancelar
              </Button>
              <Button onClick={handleEditLicense} disabled={savingLicense}>
                {savingLicense ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Alterações'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Lista de Contratos
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Contratos</h1>
          <p className="text-muted-foreground">
            Gerencie contratos e licenças em lote
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Contrato
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{contracts.length}</p>
                <p className="text-sm text-muted-foreground">Total de Contratos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                <Building2 className="h-5 w-5 text-chart-1" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(contracts.map(c => c.company_name)).size}
                </p>
                <p className="text-sm text-muted-foreground">Empresas</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                <DollarSign className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {formatCurrency(contracts.reduce((sum, c) => sum + c.value, 0))}
                </p>
                <p className="text-sm text-muted-foreground">Valor Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Contratos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por número, empresa, representante ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Contracts Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Número</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead>Representante</TableHead>
              <TableHead>Valor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredContracts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Nenhum contrato encontrado
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredContracts.map((contract) => (
                <TableRow key={contract.id}>
                  <TableCell>
                    <code className="text-sm font-mono">{contract.contract_number}</code>
                  </TableCell>
                  <TableCell className="font-medium">{contract.company_name}</TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm">{contract.representative_name}</p>
                      <p className="text-xs text-muted-foreground">{contract.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>{formatCurrency(contract.value)}</TableCell>
                  <TableCell className="text-sm">{formatDate(contract.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectContract(contract)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingContract(contract)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingContract(contract)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add Contract Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Novo Contrato</DialogTitle>
            <DialogDescription>
              Crie um novo contrato e gere múltiplas licenças
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {quotes.length > 0 && (
              <div className="space-y-2">
                <Label>Importar de Orçamento (opcional)</Label>
                <Select value={newContract.quote_id} onValueChange={handleQuoteSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um orçamento..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Nenhum</SelectItem>
                    {quotes.map((quote) => (
                      <SelectItem key={quote.id} value={quote.id}>
                        {quote.company_name} - {quote.contact_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Empresa *</Label>
                <Input
                  id="company_name"
                  placeholder="Nome da empresa"
                  value={newContract.company_name}
                  onChange={(e) => setNewContract({ ...newContract, company_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="representative_name">Representante *</Label>
                <Input
                  id="representative_name"
                  placeholder="Nome do representante"
                  value={newContract.representative_name}
                  onChange={(e) => setNewContract({ ...newContract, representative_name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@empresa.com"
                  value={newContract.email}
                  onChange={(e) => setNewContract({ ...newContract, email: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone *</Label>
                <Input
                  id="phone"
                  placeholder="(00) 00000-0000"
                  value={newContract.phone}
                  onChange={(e) => setNewContract({ ...newContract, phone: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="value">Valor do Contrato (R$) *</Label>
              <Input
                id="value"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={newContract.value}
                onChange={(e) => setNewContract({ ...newContract, value: e.target.value })}
                required
              />
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-4">Configuração das Licenças</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="license_quantity">Quantidade *</Label>
                  <Input
                    id="license_quantity"
                    type="number"
                    min="1"
                    placeholder="1"
                    value={newContract.license_quantity}
                    onChange={(e) => setNewContract({ ...newContract, license_quantity: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="plan_type">Tipo de Plano</Label>
                  <Input
                    id="plan_type"
                    placeholder="Ex: Profissional"
                    value={newContract.plan_type}
                    onChange={(e) => setNewContract({ ...newContract, plan_type: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expire_days">Validade (dias)</Label>
                  <Input
                    id="expire_days"
                    type="number"
                    placeholder="183"
                    value={newContract.expire_days}
                    onChange={(e) => setNewContract({ ...newContract, expire_days: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">Padrão: 183 dias</p>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} disabled={savingCreate}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateContract}
              disabled={
                !newContract.company_name ||
                !newContract.representative_name ||
                !newContract.email ||
                !newContract.phone ||
                !newContract.value ||
                !newContract.license_quantity ||
                savingCreate
              }
            >
              {savingCreate ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Contrato'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Contract Dialog */}
      <Dialog open={!!editingContract} onOpenChange={(open) => !open && setEditingContract(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Contrato</DialogTitle>
            <DialogDescription>
              Atualize as informações do contrato
            </DialogDescription>
          </DialogHeader>
          {editingContract && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Número do Contrato</Label>
                <code className="block text-sm font-mono p-2 bg-muted rounded">
                  {editingContract.contract_number}
                </code>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={editingContract.company_name}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, company_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-representative">Representante</Label>
                <Input
                  id="edit-representative"
                  value={editingContract.representative_name}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, representative_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={editingContract.email}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, email: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Telefone</Label>
                <Input
                  id="edit-phone"
                  value={editingContract.phone}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, phone: e.target.value })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-value">Valor (R$)</Label>
                <Input
                  id="edit-value"
                  type="number"
                  step="0.01"
                  value={editingContract.value}
                  onChange={(e) =>
                    setEditingContract({ ...editingContract, value: parseFloat(e.target.value) })
                  }
                  required
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingContract(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleEditContract} disabled={savingEdit}>
              {savingEdit ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contract Dialog */}
      <AlertDialog open={!!deletingContract} onOpenChange={(open) => !open && setDeletingContract(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Contrato?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. O contrato e todas as licenças associadas serão permanentemente removidos.
              <br />
              <br />
              <strong>Contrato:</strong> <code>{deletingContract?.contract_number}</code>
              <br />
              <strong>Empresa:</strong> {deletingContract?.company_name}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteContract}
              className="bg-destructive hover:bg-destructive/90"
              disabled={savingDelete}
            >
              {savingDelete ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
