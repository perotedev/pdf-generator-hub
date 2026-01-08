import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreditCard,
  Key,
  Calendar,
  FileText,
  TrendingUp,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Dashboard = () => {
  const stats = [
    {
      title: "Status da Assinatura",
      value: "Pro",
      description: "Ativa até 15/02/2026",
      icon: CreditCard,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Licenças Ativas",
      value: "2",
      description: "de 3 disponíveis",
      icon: Key,
      color: "text-chart-1",
      bgColor: "bg-chart-1/10",
    },
    {
      title: "Próximo Pagamento",
      value: "R$119",
      description: "15 de Fevereiro",
      icon: Calendar,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      title: "PDFs Gerados",
      value: "2.847",
      description: "Este mês",
      icon: FileText,
      color: "text-chart-3",
      bgColor: "bg-chart-3/10",
    },
  ];

  const recentActivity = [
    {
      action: "PDF gerado",
      description: "Relatório Financeiro Q4",
      time: "Há 5 minutos",
    },
    {
      action: "Licença ativada",
      description: "Computador Desktop",
      time: "Há 2 horas",
    },
    {
      action: "PDF gerado",
      description: "Contrato de Serviços",
      time: "Há 4 horas",
    },
    {
      action: "Pagamento confirmado",
      description: "Plano Pro - R$119,00",
      time: "Há 2 dias",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Bem-vindo de volta, João!
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
          <CardContent className="space-y-3">
            <Link to="/dashboard/assinaturas">
              <Button variant="outline" className="w-full justify-start gap-2">
                <CreditCard className="h-4 w-4" />
                Gerenciar Assinatura
              </Button>
            </Link>
            <Link to="/dashboard/licencas">
              <Button variant="outline" className="w-full justify-start gap-2">
                <Key className="h-4 w-4" />
                Ver Minhas Licenças
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
              {recentActivity.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 pb-3 border-b border-border last:border-0 last:pb-0"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-4 w-4 text-primary" />
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
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
