import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Label } from '@/components/ui/label';
import { Search, UserCog, Shield, Trash2, Laptop, Key, CreditCard, Receipt, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole } from '@/contexts/AuthContext';

interface Device {
  id: string;
  computerUid: string;
  deviceName: string;
  activatedAt: string;
}

interface License {
  id: string;
  code: string;
  nickname: string;
  status: 'Ativa' | 'Expirada' | 'Disponível';
  device: Device | null;
}

interface Payment {
  id: string;
  date: string;
  amount: string;
  status: 'Pago' | 'Pendente' | 'Reembolsado' | 'Cancelado';
  method: 'Cartão de Crédito' | 'PIX' | 'Boleto';
  installment?: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: 'Ativa' | 'Expirada' | 'Cancelada';
  startDate: string;
  endDate: string;
  price: string;
  autoRenew: boolean;
  license: License;
  payments: Payment[];
}

interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'Ativo' | 'Inativo' | 'Suspenso';
  subscriptions: Subscription[];
  createdAt: string;
  lastLogin: string;
}

export default function AdminUsers() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<SystemUser | null>(null);
  const [unlinkingDevice, setUnlinkingDevice] = useState<{ user: SystemUser; device: Device; license: License; subscription: Subscription } | null>(null);
  const [updatingLicense, setUpdatingLicense] = useState<{ user: SystemUser; subscription: Subscription } | null>(null);
  const [newEndDate, setNewEndDate] = useState('');

  // Dados mockados de usuários
  const [users, setUsers] = useState<SystemUser[]>([
    {
      id: '1',
      name: 'João Silva',
      email: 'joao.silva@email.com',
      role: 'USER',
      status: 'Ativo',
      createdAt: '2024-01-15',
      lastLogin: '2026-01-10 14:30',
      subscriptions: [
        {
          id: 'sub1',
          plan: 'Profissional - Mensal',
          status: 'Ativa',
          startDate: '2024-01-15',
          endDate: '2026-02-15',
          price: 'R$ 49,00/mês',
          autoRenew: true,
          license: {
            id: 'lic1',
            code: 'PDFG-PRO-X8K2-M9P4-L3N7',
            nickname: 'PC Escritório',
            status: 'Ativa',
            device: {
              id: 'dev1',
              computerUid: 'WIN-ABC123XYZ',
              deviceName: 'Desktop Dell - Windows 11',
              activatedAt: '2024-01-16 10:00',
            },
          },
          payments: [
            { id: 'pay1', date: '2026-01-15', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
            { id: 'pay2', date: '2025-12-15', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
            { id: 'pay3', date: '2025-11-15', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
          ],
        },
      ],
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria.santos@email.com',
      role: 'USER',
      status: 'Ativo',
      createdAt: '2024-03-20',
      lastLogin: '2026-01-10 09:15',
      subscriptions: [
        {
          id: 'sub2',
          plan: 'Profissional - Anual',
          status: 'Ativa',
          startDate: '2024-03-20',
          endDate: '2027-03-20',
          price: 'R$ 468,00/ano',
          autoRenew: true,
          license: {
            id: 'lic2',
            code: 'PDFG-PRO-K9L3-P2M8-N4R6',
            nickname: 'Notebook Trabalho',
            status: 'Ativa',
            device: {
              id: 'dev2',
              computerUid: 'MAC-DEF456ABC',
              deviceName: 'MacBook Pro - macOS 14',
              activatedAt: '2024-03-21 15:30',
            },
          },
          payments: [
            { id: 'pay4', date: '2026-03-20', amount: 'R$ 468,00', status: 'Pago', method: 'PIX', installment: '1/1' },
            { id: 'pay5', date: '2025-03-20', amount: 'R$ 468,00', status: 'Pago', method: 'Cartão de Crédito', installment: '12x R$ 39,00' },
          ],
        },
      ],
    },
    {
      id: '3',
      name: 'Carlos Oliveira',
      email: 'carlos.oliveira@email.com',
      role: 'ADMIN',
      status: 'Ativo',
      createdAt: '2023-11-10',
      lastLogin: '2026-01-10 16:45',
      subscriptions: [],
    },
    {
      id: '4',
      name: 'Ana Paula',
      email: 'ana.paula@email.com',
      role: 'USER',
      status: 'Suspenso',
      createdAt: '2024-05-12',
      lastLogin: '2025-12-28 11:20',
      subscriptions: [
        {
          id: 'sub4',
          plan: 'Profissional - Mensal',
          status: 'Expirada',
          startDate: '2024-05-12',
          endDate: '2025-12-12',
          price: 'R$ 49,00/mês',
          autoRenew: false,
          license: {
            id: 'lic4',
            code: 'PDFG-PRO-T7Y3-W9Q5-H2K8',
            nickname: 'PC Casa',
            status: 'Expirada',
            device: null,
          },
          payments: [
            { id: 'pay6', date: '2025-11-12', amount: 'R$ 49,00', status: 'Pendente', method: 'Boleto' },
            { id: 'pay7', date: '2025-10-12', amount: 'R$ 49,00', status: 'Pago', method: 'PIX' },
          ],
        },
      ],
    },
    {
      id: '5',
      name: 'Roberto Lima',
      email: 'roberto.lima@email.com',
      role: 'USER',
      status: 'Ativo',
      createdAt: '2024-08-05',
      lastLogin: '2026-01-09 08:50',
      subscriptions: [
        {
          id: 'sub5',
          plan: 'Profissional - Mensal',
          status: 'Ativa',
          startDate: '2024-08-05',
          endDate: '2026-02-05',
          price: 'R$ 49,00/mês',
          autoRenew: true,
          license: {
            id: 'lic5',
            code: 'PDFG-PRO-B4C7-D9E2-F5G8',
            nickname: 'Escritório Principal',
            status: 'Ativa',
            device: {
              id: 'dev5',
              computerUid: 'WIN-GHI789JKL',
              deviceName: 'Desktop HP - Windows 10',
              activatedAt: '2024-08-06 14:20',
            },
          },
          payments: [
            { id: 'pay8', date: '2026-01-05', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
            { id: 'pay9', date: '2025-12-05', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
            { id: 'pay10', date: '2025-11-05', amount: 'R$ 49,00', status: 'Pago', method: 'Cartão de Crédito' },
          ],
        },
      ],
    },
  ]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = () => {
    if (!editingUser) return;

    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? editingUser : u))
    );

    toast.success('Permissão atualizada', {
      description: `${editingUser.name} agora é ${editingUser.role === 'ADMIN' ? 'Administrador' : 'Usuário'}`,
    });
    setEditingUser(null);
  };

  const handleUpdateStatus = (userId: string, newStatus: SystemUser['status']) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );

    const statusText = newStatus === 'Ativo' ? 'ativado' : newStatus === 'Suspenso' ? 'suspenso' : 'desativado';
    toast.success('Status atualizado', {
      description: `Usuário ${statusText} com sucesso`,
    });
  };

  const handleDeleteUser = () => {
    if (!deletingUser) return;

    setUsers((prev) => prev.filter((u) => u.id !== deletingUser.id));
    toast.success('Usuário removido', {
      description: `${deletingUser.name} foi removido do sistema`,
    });
    setDeletingUser(null);
  };

  const handleUnlinkDevice = () => {
    if (!unlinkingDevice) return;

    const { user, device, license, subscription } = unlinkingDevice;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          return {
            ...u,
            subscriptions: u.subscriptions.map((sub) => {
              if (sub.id === subscription.id) {
                return {
                  ...sub,
                  license: {
                    ...sub.license,
                    device: null,
                  },
                };
              }
              return sub;
            }),
          };
        }
        return u;
      })
    );

    toast.success('Dispositivo desvinculado', {
      description: `${device.deviceName} foi desvinculado da licença ${license.code}`,
    });
    setUnlinkingDevice(null);

    // Atualiza o usuário selecionado se o diálogo estiver aberto
    if (selectedUserDetails?.id === user.id) {
      const updatedUser = users.find(u => u.id === user.id);
      if (updatedUser) {
        setSelectedUserDetails({...updatedUser, subscriptions: updatedUser.subscriptions.map((sub) => {
          if (sub.id === subscription.id) {
            return { ...sub, license: { ...sub.license, device: null } };
          }
          return sub;
        })});
      }
    }
  };

  const handleUpdateLicenseDate = () => {
    if (!updatingLicense || !newEndDate) return;

    const { user, subscription } = updatingLicense;

    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === user.id) {
          return {
            ...u,
            subscriptions: u.subscriptions.map((sub) => {
              if (sub.id === subscription.id) {
                return {
                  ...sub,
                  endDate: newEndDate,
                  status: new Date(newEndDate) > new Date() ? 'Ativa' : 'Expirada',
                };
              }
              return sub;
            }),
          };
        }
        return u;
      })
    );

    toast.success('Licença atualizada', {
      description: `Data de expiração alterada para ${new Date(newEndDate).toLocaleDateString('pt-BR')}`,
    });
    setUpdatingLicense(null);
    setNewEndDate('');
  };

  const getRoleBadge = (role: UserRole) => {
    return role === 'ADMIN' ? (
      <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-200">
        <Shield className="w-3 h-3 mr-1" />
        Admin
      </Badge>
    ) : (
      <Badge variant="secondary">Usuário</Badge>
    );
  };

  const getStatusBadge = (status: SystemUser['status']) => {
    const variants = {
      Ativo: 'default',
      Inativo: 'secondary',
      Suspenso: 'destructive',
    } as const;

    return <Badge variant={variants[status]}>{status}</Badge>;
  };

  const getSubscriptionStatusBadge = (status: Subscription['status']) => {
    const config = {
      Ativa: { variant: 'default' as const, color: 'text-green-700' },
      Expirada: { variant: 'destructive' as const, color: 'text-red-700' },
      Cancelada: { variant: 'secondary' as const, color: 'text-gray-700' },
    };

    return <Badge variant={config[status].variant}>{status}</Badge>;
  };

  const getPaymentStatusBadge = (status: Payment['status']) => {
    const config = {
      Pago: { variant: 'default' as const, className: 'bg-green-100 text-green-700 hover:bg-green-200' },
      Pendente: { variant: 'secondary' as const, className: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
      Reembolsado: { variant: 'secondary' as const, className: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
      Cancelado: { variant: 'destructive' as const, className: '' },
    };

    return <Badge variant={config[status].variant} className={config[status].className}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Gerenciamento de Usuários</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, permissões, assinaturas, licenças e pagamentos
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold">{users.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Usuários Ativos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {users.filter((u) => u.status === 'Ativo').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Assinaturas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {users.reduce((acc, u) => acc + u.subscriptions.filter(s => s.status === 'Ativa').length, 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">
              Suspensos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl sm:text-2xl font-bold text-red-600">
              {users.filter((u) => u.status === 'Suspenso').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por permissão" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as permissões</SelectItem>
                <SelectItem value="ADMIN">Administradores</SelectItem>
                <SelectItem value="USER">Usuários</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="Ativo">Ativos</SelectItem>
                <SelectItem value="Inativo">Inativos</SelectItem>
                <SelectItem value="Suspenso">Suspensos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Usuários ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {filteredUsers.map((user) => (
              <Card key={user.id} className="border-border">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {getRoleBadge(user.role)}
                      {getStatusBadge(user.status)}
                    </div>
                    {user.subscriptions.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">{user.subscriptions.length}</span> assinatura(s) •{" "}
                        <span className="font-medium">{user.subscriptions.filter(s => s.status === 'Ativa').length}</span> ativa(s)
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserDetails(user)}
                      >
                        <CreditCard className="w-4 h-4 mr-2" />
                        Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <UserCog className="w-4 h-4 mr-2" />
                        Permissões
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleUpdateStatus(
                            user.id,
                            user.status === 'Ativo' ? 'Suspenso' : 'Ativo'
                          )
                        }
                      >
                        {user.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Permissão</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Assinaturas</TableHead>
                  <TableHead className="hidden xl:table-cell">Último Acesso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getStatusBadge(user.status)}</TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <div className="space-y-1">
                        {user.subscriptions.length > 0 ? (
                          <>
                            <div className="text-sm font-medium">
                              {user.subscriptions.length} assinatura(s)
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {user.subscriptions.filter(s => s.status === 'Ativa').length} ativa(s)
                            </div>
                          </>
                        ) : (
                          <span className="text-sm text-muted-foreground">Sem assinaturas</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden xl:table-cell">
                      <div className="text-sm">{user.lastLogin}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedUserDetails(user)}
                        >
                          <CreditCard className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <UserCog className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleUpdateStatus(
                              user.id,
                              user.status === 'Ativo' ? 'Suspenso' : 'Ativo'
                            )
                          }
                          className="hidden lg:inline-flex"
                        >
                          {user.status === 'Ativo' ? 'Suspender' : 'Ativar'}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeletingUser(user)}
                        >
                          <Trash2 className="w-4 h-4" />
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

      {/* Dialog: Detalhes do Usuário (Assinaturas e Pagamentos) */}
      <Dialog open={!!selectedUserDetails} onOpenChange={() => setSelectedUserDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto w-[95vw] sm:w-full">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Assinaturas, licenças e pagamentos de {selectedUserDetails?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedUserDetails?.subscriptions && selectedUserDetails.subscriptions.length > 0 ? (
              <Accordion type="single" collapsible className="w-full">
                {selectedUserDetails.subscriptions.map((subscription, index) => (
                  <AccordionItem key={subscription.id} value={subscription.id}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center justify-between w-full pr-4">
                        <div className="flex items-center gap-3">
                          <CreditCard className="w-5 h-5 text-muted-foreground" />
                          <div className="text-left">
                            <div className="font-medium">{subscription.plan}</div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.price}
                            </div>
                          </div>
                        </div>
                        {getSubscriptionStatusBadge(subscription.status)}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4 pt-4">
                        {/* Informações da Assinatura */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">Informações da Assinatura</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Data de Início</div>
                                <div className="font-medium">
                                  {new Date(subscription.startDate).toLocaleDateString('pt-BR')}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Data de Expiração</div>
                                <div className="font-medium flex items-center gap-2">
                                  {new Date(subscription.endDate).toLocaleDateString('pt-BR')}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setUpdatingLicense({ user: selectedUserDetails, subscription });
                                      setNewEndDate(subscription.endDate);
                                    }}
                                  >
                                    <Calendar className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Renovação Automática</div>
                                <div className="font-medium">
                                  {subscription.autoRenew ? 'Ativada' : 'Desativada'}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Status</div>
                                <div className="font-medium">
                                  {getSubscriptionStatusBadge(subscription.status)}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Informações da Licença */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Key className="w-4 h-4" />
                              Licença
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="text-sm text-muted-foreground">Código da Licença</div>
                                <div className="font-mono font-medium text-sm">
                                  {subscription.license.code}
                                </div>
                              </div>
                              <div>
                                <div className="text-sm text-muted-foreground">Apelido</div>
                                <div className="font-medium">{subscription.license.nickname}</div>
                              </div>
                            </div>

                            {subscription.license.device ? (
                              <>
                                <Separator />
                                <div>
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-sm font-medium">Dispositivo Vinculado</div>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                        setUnlinkingDevice({
                                          user: selectedUserDetails,
                                          device: subscription.license.device!,
                                          license: subscription.license,
                                          subscription: subscription,
                                        })
                                      }
                                    >
                                      <Laptop className="w-3 h-3 mr-1" />
                                      Desvincular
                                    </Button>
                                  </div>
                                  <div className="bg-muted p-3 rounded-lg space-y-2">
                                    <div className="flex items-start gap-2">
                                      <Laptop className="w-4 h-4 text-muted-foreground mt-1" />
                                      <div className="flex-1">
                                        <div className="font-medium text-sm">
                                          {subscription.license.device.deviceName}
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                          UID: {subscription.license.device.computerUid}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1">
                                          Ativado em: {subscription.license.device.activatedAt}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </>
                            ) : (
                              <>
                                <Separator />
                                <div className="text-sm text-muted-foreground text-center py-2">
                                  Nenhum dispositivo vinculado
                                </div>
                              </>
                            )}
                          </CardContent>
                        </Card>

                        {/* Histórico de Pagamentos */}
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                              <Receipt className="w-4 h-4" />
                              Histórico de Pagamentos
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {subscription.payments.length > 0 ? (
                              <div className="space-y-2">
                                {subscription.payments.map((payment) => (
                                  <div
                                    key={payment.id}
                                    className="flex items-center justify-between p-3 border rounded-lg"
                                  >
                                    <div className="flex items-center gap-3">
                                      <DollarSign className="w-4 h-4 text-muted-foreground" />
                                      <div>
                                        <div className="font-medium text-sm">{payment.amount}</div>
                                        <div className="text-xs text-muted-foreground">
                                          {new Date(payment.date).toLocaleDateString('pt-BR')} • {payment.method}
                                          {payment.installment && ` • ${payment.installment}`}
                                        </div>
                                      </div>
                                    </div>
                                    {getPaymentStatusBadge(payment.status)}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="text-sm text-muted-foreground text-center py-4">
                                Nenhum pagamento registrado
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Este usuário não possui assinaturas
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setSelectedUserDetails(null)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Permissões */}
      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Permissões</DialogTitle>
            <DialogDescription>
              Altere as permissões do usuário {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Permissão</Label>
              <Select
                value={editingUser?.role}
                onValueChange={(value: UserRole) =>
                  setEditingUser((prev) => (prev ? { ...prev, role: value } : null))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                {editingUser?.role === 'ADMIN'
                  ? 'Administradores têm acesso completo ao sistema, incluindo gerenciamento de usuários e configurações.'
                  : 'Usuários têm acesso apenas às suas próprias assinaturas e downloads.'}
              </p>
            </div>
            <div className="space-y-2">
              <Label>Status da Conta</Label>
              <Select
                value={editingUser?.status}
                onValueChange={(value: SystemUser['status']) =>
                  setEditingUser((prev) => (prev ? { ...prev, status: value } : null))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Ativo">Ativo</SelectItem>
                  <SelectItem value="Inativo">Inativo</SelectItem>
                  <SelectItem value="Suspenso">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole}>Salvar Alterações</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Atualizar Data de Expiração */}
      <Dialog open={!!updatingLicense} onOpenChange={() => setUpdatingLicense(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Atualizar Licença</DialogTitle>
            <DialogDescription>
              Altere a data de expiração da licença {updatingLicense?.subscription.license.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nova Data de Expiração</Label>
              <Input
                type="date"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUpdatingLicense(null)}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateLicenseDate}>Atualizar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog: Confirmar Desvincular Dispositivo */}
      <AlertDialog
        open={!!unlinkingDevice}
        onOpenChange={() => setUnlinkingDevice(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desvincular Dispositivo</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja desvincular o dispositivo{' '}
              <strong>{unlinkingDevice?.device.deviceName}</strong> da licença{' '}
              <strong>{unlinkingDevice?.license.code}</strong>?
              <br />
              <br />
              O usuário {unlinkingDevice?.user.name} precisará ativar a licença novamente
              em um dispositivo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlinkDevice}>
              Sim, Desvincular
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog: Confirmar Exclusão */}
      <AlertDialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Usuário</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover <strong>{deletingUser?.name}</strong> do
              sistema? Esta ação não pode ser desfeita.
              {deletingUser?.subscriptions && deletingUser.subscriptions.length > 0 && (
                <>
                  <br />
                  <br />
                  <strong>Atenção:</strong> Este usuário possui{' '}
                  {deletingUser.subscriptions.length} assinatura(s).
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive">
              Sim, Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
