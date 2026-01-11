import { useState } from 'react';
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
import { Search, Key, Plus, Edit2, Trash2, Laptop, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface StandaloneLicense {
  id: string;
  code: string;
  client: string | null;
  company: string;
  plan_type: string | null;
  is_used: boolean;
  sold: boolean;
  device_id: string | null;
  device_type: string | null;
  expire_date: string | null;
  activated_at: string | null;
  created_at: string;
}

export default function AdminLicenses() {
  const [searchTerm, setSearchTerm] = useState('');
  const [licenses, setLicenses] = useState<StandaloneLicense[]>([
    {
      id: '1',
      code: 'ABCD1-2EFG3-4HIJ5-6KLM7-8NOP9',
      client: 'João Silva',
      company: 'Empresa XYZ',
      plan_type: 'Profissional',
      is_used: true,
      sold: true,
      device_id: 'WIN-ABC123',
      device_type: 'windows',
      expire_date: '2026-12-31',
      activated_at: '2026-01-01T10:00:00Z',
      created_at: '2025-12-01T10:00:00Z',
    },
    {
      id: '2',
      code: 'QRST1-2UVW3-4XYZ5-6ABC7-8DEF9',
      client: null,
      company: 'TechCorp LTDA',
      plan_type: 'Empresarial',
      is_used: false,
      sold: false,
      device_id: null,
      device_type: null,
      expire_date: '2027-06-30',
      activated_at: null,
      created_at: '2026-01-10T15:30:00Z',
    },
  ]);

  const [addDialog, setAddDialog] = useState(false);
  const [editingLicense, setEditingLicense] = useState<StandaloneLicense | null>(null);
  const [deletingLicense, setDeletingLicense] = useState<StandaloneLicense | null>(null);
  const [newLicense, setNewLicense] = useState({
    client: '',
    company: '',
    plan_type: '',
    expire_days: '183',
  });

  const filteredLicenses = licenses.filter(
    (license) =>
      license.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      license.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (license.client && license.client.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleCreateLicense = () => {
    // TODO: Integrar com Supabase
    const generatedCode = generateLicenseCode();

    const license: StandaloneLicense = {
      id: Date.now().toString(),
      code: generatedCode,
      client: newLicense.client || null,
      company: newLicense.company,
      plan_type: newLicense.plan_type || null,
      is_used: false,
      sold: false,
      device_id: null,
      device_type: null,
      expire_date: calculateExpireDate(parseInt(newLicense.expire_days)),
      activated_at: null,
      created_at: new Date().toISOString(),
    };

    setLicenses([...licenses, license]);
    toast.success('Licença criada', {
      description: `Código: ${generatedCode}`,
    });
    setAddDialog(false);
    setNewLicense({ client: '', company: '', plan_type: '', expire_days: '183' });
  };

  const handleUpdateLicense = () => {
    if (!editingLicense) return;

    setLicenses(
      licenses.map((l) => (l.id === editingLicense.id ? editingLicense : l))
    );
    toast.success('Licença atualizada');
    setEditingLicense(null);
  };

  const handleDeleteLicense = () => {
    if (!deletingLicense) return;

    setLicenses(licenses.filter((l) => l.id !== deletingLicense.id));
    toast.success('Licença removida');
    setDeletingLicense(null);
  };

  const handleUnbindDevice = (license: StandaloneLicense) => {
    setLicenses(
      licenses.map((l) =>
        l.id === license.id
          ? { ...l, is_used: false, device_id: null, device_type: null, activated_at: null }
          : l
      )
    );
    toast.success('Dispositivo desvinculado');
  };

  const handleToggleSold = (license: StandaloneLicense) => {
    setLicenses(
      licenses.map((l) => (l.id === license.id ? { ...l, sold: !l.sold } : l))
    );
    toast.success(license.sold ? 'Licença marcada como não vendida' : 'Licença marcada como vendida');
  };

  const generateLicenseCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const groups = [];
    for (let i = 0; i < 5; i++) {
      let group = '';
      for (let j = 0; j < 5; j++) {
        group += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      groups.push(group);
    }
    return groups.join('-');
  };

  const calculateExpireDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date.toISOString().split('T')[0];
  };

  const getStatusBadge = (license: StandaloneLicense) => {
    if (!license.sold) {
      return <Badge variant="secondary">Não Vendida</Badge>;
    }
    if (license.is_used) {
      return <Badge className="bg-green-100 text-green-700">Ativa</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-700">Disponível</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciamento de Licenças Standalone</h1>
          <p className="text-muted-foreground">
            Gere e gerencie licenças avulsas para clientes fora do sistema
          </p>
        </div>
        <Button onClick={() => setAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Licença
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total de Licenças
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{licenses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {licenses.filter((l) => l.is_used && l.sold).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {licenses.filter((l) => !l.is_used && l.sold).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Não Vendidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {licenses.filter((l) => !l.sold).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Busca */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Licenças</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código, empresa ou cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Licenças */}
      <Card>
        <CardHeader>
          <CardTitle>Licenças ({filteredLicenses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Cliente/Empresa</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Dispositivo</TableHead>
                  <TableHead className="hidden lg:table-cell">Expiração</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => (
                  <TableRow key={license.id}>
                    <TableCell className="font-mono text-sm">{license.code}</TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{license.company}</div>
                        {license.client && (
                          <div className="text-sm text-muted-foreground">{license.client}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {license.plan_type ? (
                        <Badge variant="outline">{license.plan_type}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(license)}</TableCell>
                    <TableCell>
                      {license.device_id ? (
                        <div className="flex items-center gap-1">
                          <Laptop className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{license.device_type}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {license.expire_date
                        ? new Date(license.expire_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {license.is_used && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbindDevice(license)}
                            title="Desvincular dispositivo"
                          >
                            <Laptop className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleSold(license)}
                          title={license.sold ? 'Marcar como não vendida' : 'Marcar como vendida'}
                        >
                          {license.sold ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingLicense(license)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingLicense(license)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog: Criar Licença */}
      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Licença Standalone</DialogTitle>
            <DialogDescription>
              Gere uma nova licença para uso fora do sistema de assinaturas
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Empresa *</Label>
              <Input
                placeholder="Nome da empresa"
                value={newLicense.company}
                onChange={(e) =>
                  setNewLicense({ ...newLicense, company: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Input
                placeholder="Nome do cliente (opcional)"
                value={newLicense.client}
                onChange={(e) =>
                  setNewLicense({ ...newLicense, client: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Tipo de Plano</Label>
              <Input
                placeholder="Ex: Profissional, Empresarial (opcional)"
                value={newLicense.plan_type}
                onChange={(e) =>
                  setNewLicense({ ...newLicense, plan_type: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Dias até Expiração</Label>
              <Input
                type="number"
                placeholder="183"
                value={newLicense.expire_days}
                onChange={(e) =>
                  setNewLicense({ ...newLicense, expire_days: e.target.value })
                }
              />
              <p className="text-sm text-muted-foreground">
                Padrão: 183 dias (6 meses)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleCreateLicense}
              disabled={!newLicense.company}
            >
              <Key className="h-4 w-4 mr-2" />
              Gerar Licença
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Licença */}
      <Dialog open={!!editingLicense} onOpenChange={() => setEditingLicense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Licença</DialogTitle>
            <DialogDescription>
              Código: {editingLicense?.code}
            </DialogDescription>
          </DialogHeader>
          {editingLicense && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Empresa</Label>
                <Input
                  value={editingLicense.company}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, company: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input
                  value={editingLicense.client || ''}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, client: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Tipo de Plano</Label>
                <Input
                  value={editingLicense.plan_type || ''}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, plan_type: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Data de Expiração</Label>
                <Input
                  type="date"
                  value={editingLicense.expire_date || ''}
                  onChange={(e) =>
                    setEditingLicense({ ...editingLicense, expire_date: e.target.value })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLicense(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLicense}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingLicense} onOpenChange={() => setDeletingLicense(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Licença</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover a licença{' '}
              <strong>{deletingLicense?.code}</strong>? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLicense} className="bg-destructive">
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
