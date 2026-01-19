import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Key,
  Calendar,
  FileText,
  TrendingUp,
  RefreshCw,
  Barcode,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { dashboardApi, type Subscription, type License, type Payment } from "@/lib/supabase";
import { useStripeSync } from "@/hooks/useStripeSync";

const Dashboard = () => {
  const { user, getAccessToken } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [licenses, setLicenses] = useState<License[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  // Hook para sincronizar dados com Stripe automaticamente
  useStripeSync();

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const token = getAccessToken();

        if (!token) {
          console.error('No valid token');
          return;
        }

        // Fetch active subscription
        const subResponse = await dashboardApi.getActiveSubscription(token);
        if (subResponse.subscription) {
          setSubscription(subResponse.subscription as any);
        }

        // Fetch licenses
        const licensesResponse = await dashboardApi.getLicenses(token);
        if (licensesResponse.licenses) {
          setLicenses(licensesResponse.licenses);
        }

        // Fetch recent payments
        const paymentsResponse = await dashboardApi.getPayments(token, 4);
        if (paymentsResponse.payments) {
          setPayments(paymentsResponse.payments);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const activeLicenses = licenses.filter(l => l.is_used).length;
  const totalLicenses = licenses.length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(amount);
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInHours < 1) return 'Agora';
    if (diffInHours < 24) return `Há ${diffInHours} hora${diffInHours > 1 ? 's' : ''}`;
    return `Há ${diffInDays} dia${diffInDays > 1 ? 's' : ''}`;
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return { label: 'Não especificado', icon: FileText };

    const methodLower = method.toLowerCase();
    if (methodLower === 'card' || methodLower === 'credit_card' || methodLower === 'debit_card') {
      return { label: 'Cartão', icon: CreditCard };
    }
    if (methodLower === 'boleto') {
      return { label: 'Boleto', icon: Barcode };
    }
    return { label: method, icon: FileText };
  };

  const stats = [
    {
      title: "Status da Assinatura",
      value: subscription ? (subscription as any).plans?.name : "Sem Assinatura",
      description: subscription
        ? `Ativa até ${formatDate(subscription.current_period_end)}`
        : "Nenhuma assinatura ativa",
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Licenças Ativas",
      value: activeLicenses.toString(),
      description: `de ${totalLicenses} disponíveis`,
      icon: Key,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Renovação Automática",
      value: subscription?.cancel_at_period_end ? "Não" : "Sim",
      description: subscription?.cancel_at_period_end ? "Cancelamento agendado" : "Ativa no momento",
      icon: RefreshCw,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "Próximo Pagamento",
      value: subscription ? formatCurrency((subscription as any).plans?.price || 0) : "N/A",
      description: subscription
        ? formatDate(subscription.current_period_end)
        : "Nenhuma cobrança agendada",
      icon: Calendar,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const recentActivity = payments.map(payment => {
    const statusMap: Record<string, string> = {
      SUCCEEDED: "Pagamento confirmado",
      PENDING: "Pagamento pendente",
      FAILED: "Pagamento falhou",
      REFUNDED: "Pagamento reembolsado",
      CANCELED: "Pagamento cancelado",
    };

    const paymentMethodInfo = formatPaymentMethod(payment.payment_method);

    return {
      action: statusMap[payment.status] || payment.status,
      description: `${paymentMethodInfo.label} - ${formatCurrency(payment.amount)}`,
      time: getTimeAgo(payment.created_at),
      icon: paymentMethodInfo.icon,
    };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo de volta, {user?.name || 'Usuário'}!
          </h1>
          <p className="text-muted-foreground">
            Aqui está um resumo da sua conta
          </p>
        </div>
        <Link to="/dashboard/downloads">
          <Button className="gap-2">
            <TrendingUp className="h-4 w-4" />
            Baixar PDF Generator
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    Ativo
                  </Badge>
                </div>
                <div className="mt-4">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stat.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <Link to="/dashboard/assinaturas">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CreditCard className="h-4 w-4" />
                Gerenciar Assinatura
              </Button>
            </Link>
            <Link to="/dashboard/downloads">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Acessar Downloads
              </Button>
            </Link>
            <Link to="/documentacao">
              <Button variant="outline" className="w-full justify-start gap-2">
                <FileText className="h-4 w-4" />
                Ver Documentação
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => {
                const ActivityIcon = activity.icon;
                return (
                  <div
                    key={index}
                    className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <ActivityIcon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {activity.action}
                      </p>
                      <p className="text-sm text-muted-foreground truncate">
                        {activity.description}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {activity.time}
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
