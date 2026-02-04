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
import { Search, Key, Plus, Edit2, Trash2, Laptop, CheckCircle, Circle, RefreshCw, Shield, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, licenseApi, type License } from '@/lib/supabase';

export default function AdminLicenses() {
  const { isAdmin, getAccessToken, logoutWithRedirect } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [addDialog, setAddDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<License | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<License | null>(null);
  const [savingCreate, setSavingCreate] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [unbindingDevice, setUnbindingDevice] = useState<string | null>(null);
  const [newLicense, setNewLicense] = useState({
    client: '',
    company: '',
    plan_type: '',
    expire_days: '183',
  });

  useEffect(() => {
    fetchLicenses();
  }, []);

  const fetchLicenses = async () => {
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

      const response = await licenseApi.getLicenses(token, true);
      const licensesData = response.licenses || response;

      // Filter only standalone licenses
      const standaloneLicenses = licensesData.filter((l: License) => l.is_standalone);

      setLicenses(standaloneLicenses);
    } catch (error: any) {
      console.error('Error fetching licenses:', error);
      toast.error('Erro ao carregar licenças', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredLicenses = licenses.filter(
    (license) =>
      license.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (license.client && license.client.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 5;
    const segmentLength = 5;

    let code = '';
    for (let i = 0; i < segments; i++) {
      if (i > 0) code += '-';
      for (let j = 0; j < segmentLength; j++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    }

    return code;
  };

  const handleCreateLicense = async () => {
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

      const generatedCode = generateLicenseCode();
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() + parseInt(newLicense.expire_days));

      await licenseApi.createLicense(token, {
        code: generatedCode,
        client: newLicense.client || null,
        company: newLicense.company,
        plan_type: newLicense.plan_type || null,
        expire_date: expireDate.toISOString().split('T')[0],
        is_standalone: true,
        sold: false,
        is_used: false,
      });

      await fetchLicenses();

      toast.success('Licença criada com sucesso!', {
        description: `Código: ${generatedCode}`,
      });

      setAddDialog(false);
      setNewLicense({
        client: '',
        company: '',
        plan_type: '',
        expire_days: '183',
      });
    } catch (error: any) {
      toast.error('Erro ao criar licença', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingCreate(false);
    }
  };

  const handleEditLicense = async () => {
    if (!editingLicense) return;

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

      await licenseApi.updateLicense(token, editingLicense.id, {
        client: editingLicense.client,
        company: editingLicense.company,
        plan_type: editingLicense.plan_type,
        expire_date: editingLicense.expire_date,
        sold: editingLicense.sold,
      });

      await fetchLicenses();

      toast.success('Licença atualizada!', {
        description: 'As alterações foram salvas com sucesso.',
      });

      setEditingLicense(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar licença', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDeleteLicense = async () => {
    if (!deletingLicense) return;

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

      await licenseApi.deleteLicense(token, deletingLicense.id);

      await fetchLicenses();

      toast.success('Licença excluída!', {
        description: 'A licença foi removida do sistema.',
      });

      setDeletingLicense(null);
    } catch (error: any) {
      toast.error('Erro ao excluir licença', {
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

      await licenseApi.unbindDevice(token, license.id);

      await fetchLicenses();

      toast.success('Dispositivo desvinculado!', {
        description: 'A licença está disponível novamente.',
      });
    } catch (error: any) {
      toast.error('Erro ao desvincular dispositivo', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setUnbindingDevice(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
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
          <p className="mt-2 text-muted-foreground">Carregando licenças...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Licenças Avulsas</h1>
          <p className="text-muted-foreground">
            Gerencie licenças standalone para clientes externos
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Key className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{licenses.length}</p>
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
                  {licenses.filter(l => l.is_used).length}
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
                <Circle className="h-5 w-5 text-chart-2" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {licenses.filter(l => !l.is_used).length}
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
                  {licenses.filter(l => l.sold).length}
                </p>
                <p className="text-sm text-muted-foreground">Vendidas</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, cliente ou empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Licenses Table */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Empresa</TableHead>
              <TableHead className="text-center">Plano</TableHead>
              <TableHead className="text-center">OS</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredLicenses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  <Key className="mx-auto h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-muted-foreground">
                    Nenhuma licença encontrada
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              filteredLicenses.map((license) => (
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
                  <TableCell>{license.company}</TableCell>
                  <TableCell className="text-center">{license.plan_type || 'N/A'}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1">
                      {license.is_used && license.device_id && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Laptop className="h-3 w-3" />
                          {license.device_type}
                        </div>
                      )}
                    </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingLicense(license)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Add License Dialog */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Licença Avulsa</DialogTitle>
            <DialogDescription>
              Crie uma nova licença standalone para um cliente externo
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="client">Cliente (opcional)</Label>
              <Input
                id="client"
                placeholder="Nome do cliente"
                value={newLicense.client}
                onChange={(e) => setNewLicense({ ...newLicense, client: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Empresa *</Label>
              <Input
                id="company"
                placeholder="Nome da empresa"
                value={newLicense.company}
                onChange={(e) => setNewLicense({ ...newLicense, company: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan_type">Tipo de Plano (opcional)</Label>
              <Input
                id="plan_type"
                placeholder="Ex: Profissional, Empresarial"
                value={newLicense.plan_type}
                onChange={(e) => setNewLicense({ ...newLicense, plan_type: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expire_days">Validade (dias)</Label>
              <Input
                id="expire_days"
                type="number"
                placeholder="183"
                value={newLicense.expire_days}
                onChange={(e) => setNewLicense({ ...newLicense, expire_days: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Padrão: 183 dias (6 meses)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)} disabled={savingCreate}>
              Cancelar
            </Button>
            <Button onClick={handleCreateLicense} disabled={!newLicense.company || savingCreate}>
              {savingCreate ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Licença'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit License Dialog */}
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
                <Label htmlFor="edit-client">Cliente</Label>
                <Input
                  id="edit-client"
                  value={editingLicense.client || ''}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, client: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-company">Empresa</Label>
                <Input
                  id="edit-company"
                  value={editingLicense.company}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, company: e.target.value })
                  }
                  required
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
            <Button variant="outline" onClick={() => setEditingLicense(null)} disabled={savingEdit}>
              Cancelar
            </Button>
            <Button onClick={handleEditLicense} disabled={savingEdit}>
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

      {/* Delete License Dialog */}
      <AlertDialog open={!!deletingLicense} onOpenChange={(open) => !open && setDeletingLicense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Licença?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A licença será permanentemente removida do sistema.
              <br />
              <br />
              <strong>Código:</strong> <code>{deletingLicense?.code}</code>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLicense}
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
