import { useState, useEffect } from 'react';
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
import { Search, UserCog, Shield, Trash2, Laptop, Key, CreditCard, Receipt, Users2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { UserRole, useAuth } from '@/contexts/AuthContext';
import { userApi, dashboardApi, getValidAccessToken, type User as DbUser, type Subscription, type License, type Payment } from '@/lib/supabase';

interface SystemUser extends DbUser {
  subscriptions?: (Subscription & { plans?: any })[];
  licenses?: License[];
  payments?: Payment[];
}

export default function AdminUsers() {
  const { isAdmin } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<SystemUser | null>(null);
  const [selectedUserDetails, setSelectedUserDetails] = useState<SystemUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(false);
  const [savingDelete, setSavingDelete] = useState(false);
  const [users, setUsers] = useState<SystemUser[]>([]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = await getValidAccessToken();

      if (!token) {
        toast.error('Sessão expirada', {
          description: 'Por favor, faça login novamente.',
        });
        return;
      }

      const response = await userApi.getUsers(token);
      const usersData = response.users || response;

      // Fetch additional data for each user via API
      const usersWithDetails = await Promise.all(
        usersData.map(async (user: DbUser) => {
          try {
            const details = await dashboardApi.getUserDetails(token, user.id);
            return {
              ...user,
              subscriptions: details.subscriptions || [],
              licenses: details.licenses || [],
              payments: details.payments || [],
            };
          } catch {
            return {
              ...user,
              subscriptions: [],
              licenses: [],
              payments: [],
            };
          }
        })
      );

      setUsers(usersWithDetails);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários', {
        description: error.message || 'Tente novamente mais tarde.',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    const matchesStatus = selectedStatus === 'all' || user.status === selectedStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleUpdateRole = async () => {
    if (!editingUser) return;

    try {
      setSavingRole(true);
      const token = await getValidAccessToken();

      if (!token) {
        toast.error('Sessão expirada');
        return;
      }

      await userApi.updateUser(token, editingUser.id, {
        role: editingUser.role,
        status: editingUser.status,
      });

      await fetchUsers();

      const roleText = editingUser.role === 'ADMIN' ? 'Administrador' : editingUser.role === 'MANAGER' ? 'Gerente' : 'Usuário';
      toast.success('Permissão atualizada', {
        description: `${editingUser.name} agora é ${roleText}`,
      });
      setEditingUser(null);
    } catch (error: any) {
      toast.error('Erro ao atualizar permissão', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingRole(false);
    }
  };

  const handleUpdateStatus = async (userId: string, newStatus: DbUser['status']) => {
    try {
      const token = await getValidAccessToken();

      if (!token) {
        toast.error('Sessão expirada');
        return;
      }

      await userApi.updateUser(token, userId, {
        status: newStatus,
      });

      await fetchUsers();

      const statusText = newStatus === 'ACTIVE' ? 'ativado' : newStatus === 'SUSPENDED' ? 'suspenso' : 'desativado';
      toast.success('Status atualizado', {
        description: `Usuário ${statusText} com sucesso`,
      });
    } catch (error: any) {
      toast.error('Erro ao atualizar status', {
        description: error.message || 'Tente novamente.',
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUser) return;

    try {
      setSavingDelete(true);
      const token = await getValidAccessToken();

      if (!token) {
        toast.error('Sessão expirada');
        return;
      }

      await userApi.deleteUser(token, deletingUser.id);

      await fetchUsers();

      toast.success('Usuário excluído', {
        description: `${deletingUser.name} foi removido do sistema`,
      });
      setDeletingUser(null);
    } catch (error: any) {
      toast.error('Erro ao excluir usuário', {
        description: error.message || 'Tente novamente.',
      });
    } finally {
      setSavingDelete(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
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
          <p className="mt-2 text-muted-foreground">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie usuários, permissões e assinaturas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Users2 className="h-5 w-5 text-muted-foreground" />
          <span className="text-2xl font-bold">{users.length}</span>
        </div>
      </div>

      <Card className="border-border">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Todas as permissões" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as permissões</SelectItem>
                <SelectItem value="USER">Usuário</SelectItem>
                <SelectItem value="MANAGER">Gerente</SelectItem>
                <SelectItem value="ADMIN">Administrador</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="ACTIVE">Ativo</SelectItem>
                <SelectItem value="INACTIVE">Inativo</SelectItem>
                <SelectItem value="SUSPENDED">Suspenso</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Permissão</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Assinaturas</TableHead>
              <TableHead>Cadastrado em</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-10">
                  <p className="text-muted-foreground">Nenhum usuário encontrado</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{user.name}</span>
                      <span className="text-sm text-muted-foreground">{user.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.role === 'ADMIN'
                          ? 'default'
                          : user.role === 'MANAGER'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {user.role === 'ADMIN' ? 'Admin' : user.role === 'MANAGER' ? 'Gerente' : 'Usuário'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        user.status === 'ACTIVE'
                          ? 'default'
                          : user.status === 'SUSPENDED'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {user.status === 'ACTIVE' ? 'Ativo' : user.status === 'SUSPENDED' ? 'Suspenso' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.subscriptions?.filter(s => s.status === 'ACTIVE').length || 0} ativa(s)
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(user.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedUserDetails(user)}
                      >
                        Ver Detalhes
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingUser(user)}
                      >
                        <UserCog className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletingUser(user)}
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

      {/* Edit User Dialog */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Permissões de Usuário</DialogTitle>
            <DialogDescription>
              Altere as permissões de {editingUser?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">Permissão</Label>
              <Select
                value={editingUser?.role}
                onValueChange={(value) =>
                  setEditingUser(editingUser ? { ...editingUser, role: value as UserRole } : null)
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="USER">Usuário</SelectItem>
                  <SelectItem value="MANAGER">Gerente</SelectItem>
                  <SelectItem value="ADMIN">Administrador</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={editingUser?.status}
                onValueChange={(value) =>
                  setEditingUser(editingUser ? { ...editingUser, status: value as DbUser['status'] } : null)
                }
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">Ativo</SelectItem>
                  <SelectItem value="INACTIVE">Inativo</SelectItem>
                  <SelectItem value="SUSPENDED">Suspenso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingUser(null)} disabled={savingRole}>
              Cancelar
            </Button>
            <Button onClick={handleUpdateRole} disabled={savingRole}>
              {savingRole ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso irá excluir permanentemente a conta de{' '}
              <strong>{deletingUser?.name}</strong> e todos os dados associados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={savingDelete}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser} className="bg-destructive hover:bg-destructive/90" disabled={savingDelete}>
              {savingDelete ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir Usuário'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Details Dialog */}
      <Dialog open={!!selectedUserDetails} onOpenChange={(open) => !open && setSelectedUserDetails(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes do Usuário</DialogTitle>
            <DialogDescription>
              Informações completas de {selectedUserDetails?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* User Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome</Label>
                <p className="text-sm font-medium">{selectedUserDetails?.name}</p>
              </div>
              <div>
                <Label>Email</Label>
                <p className="text-sm font-medium">{selectedUserDetails?.email}</p>
              </div>
              <div>
                <Label>Permissão</Label>
                <Badge variant="outline">{selectedUserDetails?.role}</Badge>
              </div>
              <div>
                <Label>Status</Label>
                <Badge variant="outline">{selectedUserDetails?.status}</Badge>
              </div>
              <div>
                <Label>Cadastrado em</Label>
                <p className="text-sm">{selectedUserDetails && formatDate(selectedUserDetails.created_at)}</p>
              </div>
              <div>
                <Label>Último login</Label>
                <p className="text-sm">{selectedUserDetails?.last_login ? formatDateTime(selectedUserDetails.last_login) : 'Nunca'}</p>
              </div>
            </div>

            <Separator />

            {/* Subscriptions */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Assinaturas ({selectedUserDetails?.subscriptions?.length || 0})
              </h4>
              {selectedUserDetails?.subscriptions && selectedUserDetails.subscriptions.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {selectedUserDetails.subscriptions.map((sub, idx) => (
                    <AccordionItem key={sub.id} value={`sub-${idx}`}>
                      <AccordionTrigger>
                        <div className="flex items-center gap-2">
                          <Badge variant={sub.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {sub.status}
                          </Badge>
                          <span>{sub.plans?.name} - {sub.billing_cycle === 'MONTHLY' ? 'Mensal' : 'Anual'}</span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-muted/30 rounded-lg">
                          <div>
                            <Label>Valor</Label>
                            <p className="text-sm font-medium">{formatCurrency(sub.plans?.price || 0)}</p>
                          </div>
                          <div>
                            <Label>Período Atual</Label>
                            <p className="text-sm">{formatDate(sub.current_period_start)} - {formatDate(sub.current_period_end)}</p>
                          </div>
                          <div>
                            <Label>Renovação Automática</Label>
                            <p className="text-sm">{sub.cancel_at_period_end ? 'Não' : 'Sim'}</p>
                          </div>
                          <div>
                            <Label>Criada em</Label>
                            <p className="text-sm">{formatDate(sub.created_at)}</p>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma assinatura encontrada</p>
              )}
            </div>

            <Separator />

            {/* Licenses */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Key className="h-4 w-4" />
                Licenças ({selectedUserDetails?.licenses?.length || 0})
              </h4>
              {selectedUserDetails?.licenses && selectedUserDetails.licenses.length > 0 ? (
                <div className="space-y-2">
                  {selectedUserDetails.licenses.map((license) => (
                    <div key={license.id} className="p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <code className="text-sm font-mono">{license.code}</code>
                        <Badge variant={license.is_used ? 'default' : 'outline'}>
                          {license.is_used ? 'Ativa' : 'Disponível'}
                        </Badge>
                      </div>
                      {license.device_id && (
                        <div className="text-sm text-muted-foreground">
                          <Laptop className="h-3 w-3 inline mr-1" />
                          {license.device_type} - {license.device_id}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma licença encontrada</p>
              )}
            </div>

            <Separator />

            {/* Payments */}
            <div>
              <h4 className="font-semibold mb-3 flex items-center gap-2">
                <Receipt className="h-4 w-4" />
                Histórico de Pagamentos ({selectedUserDetails?.payments?.length || 0})
              </h4>
              {selectedUserDetails?.payments && selectedUserDetails.payments.length > 0 ? (
                <div className="space-y-2">
                  {selectedUserDetails.payments.slice(0, 5).map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(payment.created_at)} - {payment.payment_method || 'N/A'}
                        </p>
                      </div>
                      <Badge
                        variant={
                          payment.status === 'SUCCEEDED'
                            ? 'default'
                            : payment.status === 'FAILED'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {payment.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum pagamento encontrado</p>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
