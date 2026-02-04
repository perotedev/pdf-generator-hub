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
  Key,
  Laptop,
  CheckCircle,
  XCircle,
  RefreshCw,
  FileText,
  ChevronLeft,
  Building2,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Edit2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { contractApi, type Contract, type License } from '@/lib/supabase';

export default function MeusContratos() {
  const { getAccessToken, logoutWithRedirect } = useAuth();
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractLicenses, setContractLicenses] = useState<License[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(false);
  const [unbindingDevice, setUnbindingDevice] = useState<string | null>(null);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [savingLicense, setSavingLicense] = useState(false);
  const [nicknameValue, setNicknameValue] = useState('');

  useEffect(() => {
    fetchContracts();
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

  const fetchContractLicenses = async (contractId: string) => {
    try {
      setLoadingLicenses(true);
      const token = getAccessToken();
      if (!token) return;

      const response = await contractApi.getContractLicenses(token, contractId);
      setContractLicenses(response.licenses || []);
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      toast.error('Erro ao carregar licencas');
    } finally {
      setLoadingLicenses(false);
    }
  };

  const handleSelectContract = (contract: Contract) => {
    setSelectedContract(contract);
    fetchContractLicenses(contract.id);
  };

  const handleBackToList = () => {
    setSelectedContract(null);
    setContractLicenses([]);
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

  const handleOpenEditNickname = (license: License) => {
    setEditingLicense(license);
    setNicknameValue(license.client || '');
  };

  const handleSaveNickname = async () => {
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

      await contractApi.updateLicense(token, editingLicense.id, {
        client: nicknameValue,
      });

      if (selectedContract) {
        await fetchContractLicenses(selectedContract.id);
      }

      toast.success('Apelido atualizado!');
      setEditingLicense(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar apelido', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingLicense(false);
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

  // Visualizacao de detalhes do contrato (Licencas)
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
                  <p className="text-sm text-muted-foreground">Data de Criacao</p>
                  <p className="font-medium">{formatDate(selectedContract.created_at)}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats das Licencas */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Key className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">{contractLicenses.length}</p>
                  <p className="text-xs md:text-sm text-muted-foreground">Total</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-chart-1/10">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-chart-1" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">
                    {contractLicenses.filter(l => l.is_used).length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Ativas</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <XCircle className="h-4 w-4 md:h-5 md:w-5 text-chart-2" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">
                    {contractLicenses.filter(l => !l.is_used).length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Disponiveis</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="col-span-2 md:col-span-1">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-8 w-8 md:h-10 md:w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-chart-3" />
                </div>
                <div>
                  <p className="text-xl md:text-2xl font-bold">
                    {contractLicenses.filter(l => l.sold).length}
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground">Vendidas</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Licencas - Desktop Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Licencas do Contrato</CardTitle>
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
                  <TableHead>Codigo</TableHead>
                  <TableHead>Apelido</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Dispositivo</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractLicenses.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-muted-foreground">
                        Nenhuma licenca encontrada
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  contractLicenses.map((license) => (
                    <TableRow key={license.id}>
                      <TableCell>
                        <code className="text-xs font-mono">{license.code}</code>
                      </TableCell>
                      <TableCell>{license.client || '-'}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={license.is_used ? 'default' : 'secondary'}>
                          {license.is_used ? 'Ativa' : 'Disponivel'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {license.is_used && license.device_id ? (
                          <div className="flex items-center justify-center gap-1 text-muted-foreground">
                            <Laptop className="h-3 w-3" />
                            {license.device_type}
                          </div>
                        ) : (
                          '-'
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
                              title="Desvincular dispositivo"
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
                            onClick={() => handleOpenEditNickname(license)}
                            title="Editar apelido"
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

        {/* Licencas - Mobile Cards */}
        <div className="md:hidden space-y-4">
          <h2 className="text-lg font-semibold">Licencas do Contrato</h2>
          {loadingLicenses ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contractLicenses.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Nenhuma licenca encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            contractLicenses.map((license) => (
              <Card key={license.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {license.code}
                    </code>
                    <Badge variant={license.is_used ? 'default' : 'secondary'}>
                      {license.is_used ? 'Ativa' : 'Disponivel'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {license.client && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Apelido:</span>
                        <span className="font-medium">{license.client}</span>
                      </div>
                    )}
                    {license.is_used && license.device_id && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Dispositivo:</span>
                        <span className="font-medium flex items-center gap-1">
                          <Laptop className="h-3 w-3" />
                          {license.device_type}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Validade:</span>
                      <span className="font-medium">{formatDate(license.expire_date)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    {license.is_used && license.device_id && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleUnbindDevice(license)}
                        disabled={unbindingDevice === license.id}
                      >
                        {unbindingDevice === license.id ? (
                          <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Laptop className="h-4 w-4 mr-2" />
                        )}
                        Desvincular
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpenEditNickname(license)}
                    >
                      <Edit2 className="h-4 w-4 mr-2" />
                      Apelido
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Edicao de Apelido */}
        <Dialog open={!!editingLicense} onOpenChange={(open) => !open && setEditingLicense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Apelido</DialogTitle>
              <DialogDescription>
                Defina um nome para identificar esta licenca
              </DialogDescription>
            </DialogHeader>
            {editingLicense && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Codigo da Licenca</Label>
                  <code className="block text-sm font-mono p-2 bg-muted rounded">
                    {editingLicense.code}
                  </code>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Apelido</Label>
                  <Input
                    id="nickname"
                    value={nicknameValue}
                    onChange={(e) => setNicknameValue(e.target.value)}
                    placeholder="Ex: Computador do Escritorio"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingLicense(null)} disabled={savingLicense}>
                Cancelar
              </Button>
              <Button onClick={handleSaveNickname} disabled={savingLicense}>
                {savingLicense ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Lista de Contratos - Desktop Table
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Meus Contratos</h1>
        <p className="text-muted-foreground">
          Visualize seus contratos e gerencie suas licencas
        </p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum contrato encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Voce nao possui contratos vinculados ao seu email.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Card className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Numero</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Acoes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <code className="text-sm font-mono">{contract.contract_number}</code>
                    </TableCell>
                    <TableCell className="font-medium">{contract.company_name}</TableCell>
                    <TableCell>{formatCurrency(contract.value)}</TableCell>
                    <TableCell className="text-sm">{formatDate(contract.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectContract(contract)}
                      >
                        Ver Licencas
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-4">
            {contracts.map((contract) => (
              <Card key={contract.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                      {contract.contract_number}
                    </code>
                  </div>

                  <h3 className="font-semibold mb-2">{contract.company_name}</h3>

                  <div className="space-y-1 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor:</span>
                      <span className="font-medium">{formatCurrency(contract.value)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">{formatDate(contract.created_at)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSelectContract(contract)}
                  >
                    Ver Licencas
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
