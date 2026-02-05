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
  Circle,
  RefreshCw,
  FileText,
  ChevronLeft,
  Edit2,
  Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { contractApi, type Contract, type License } from '@/lib/supabase';
import { formatLocalDate } from '@/lib/date';

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
      toast.error('Erro ao carregar licenças');
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

      toast.success('Nome do Dispositivo atualizado!');
      setEditingLicense(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar Nome do Dispositivo', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingLicense(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return formatLocalDate(dateString);
  };

  const maskLicenseCode = (code: string) => {
    const parts = code.split('-');
    if (parts.length >= 5) {
      return `${parts[0]}-${parts[1]}-****-****-${parts[4]}`;
    }
    return code;
  };

  const copyLicenseCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!', {
      description: 'O código da licença foi copiado para a área de transferência.',
    });
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
        <div className="flex items-start justify-between gap-4">
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchContractLicenses(selectedContract.id)}
            disabled={loadingLicenses}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingLicenses ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>

        {/* Stats das Licencas */}
        <div className="grid gap-4 grid-cols-3">
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
                  <Circle className="h-4 w-4 md:h-5 md:w-5 text-chart-2" />
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
        </div>

        {/* Licencas - Desktop Table */}
        <Card className="hidden md:block">
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
                  <TableHead>Nome do Dispositivo</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-center">Dispositivo</TableHead>
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
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono">{maskLicenseCode(license.code)}</code>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => copyLicenseCode(license.code)}
                            title="Copiar código"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
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
                            title="Editar Nome do Dispositivo"
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
          <h2 className="text-lg font-semibold">Licenças do Contrato</h2>
          {loadingLicenses ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : contractLicenses.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center">
                <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">
                  Nenhuma licença encontrada
                </p>
              </CardContent>
            </Card>
          ) : (
            contractLicenses.map((license) => (
              <Card key={license.id}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
                        {maskLicenseCode(license.code)}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => copyLicenseCode(license.code)}
                        title="Copiar código"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                    <Badge variant={license.is_used ? 'default' : 'secondary'}>
                      {license.is_used ? 'Ativa' : 'Disponivel'}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm">
                    {license.client && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Nome do Dispositivo:</span>
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
                      Nome do Dispositivo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Dialog de Edicao de Nome do Dispositivo */}
        <Dialog open={!!editingLicense} onOpenChange={(open) => !open && setEditingLicense(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Editar Nome do Dispositivo</DialogTitle>
              <DialogDescription>
                Defina um nome para identificar o dispositivo onde a licença está instalada
              </DialogDescription>
            </DialogHeader>
            {editingLicense && (
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Codigo da Licença</Label>
                  <code className="block text-sm font-mono p-2 bg-muted rounded">
                    {editingLicense.code}
                  </code>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nickname">Nome do Dispositivo</Label>
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
          Visualize seus contratos e gerencie suas licenças
        </p>
      </div>

      {contracts.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Nenhum contrato encontrado</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Voce não possui contratos vinculados ao seu email.
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
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contracts.map((contract) => (
                  <TableRow key={contract.id}>
                    <TableCell>
                      <code className="text-sm font-mono">{contract.contract_number}</code>
                    </TableCell>
                    <TableCell className="font-medium">{contract.company_name}</TableCell>
                    <TableCell className="text-sm">{formatDate(contract.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectContract(contract)}
                      >
                        Ver Licenças
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
                      <span className="text-muted-foreground">Data:</span>
                      <span className="font-medium">{formatDate(contract.created_at)}</span>
                    </div>
                  </div>

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => handleSelectContract(contract)}
                  >
                    Ver Licenças
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
