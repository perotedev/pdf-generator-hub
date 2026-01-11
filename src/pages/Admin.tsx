import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, Package, ArrowRight, RefreshCw, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

const Admin = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editingPrices, setEditingPrices] = useState(false);

  // Preços dos planos
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [monthlyPlanId, setMonthlyPlanId] = useState("");
  const [annualPlanId, setAnnualPlanId] = useState("");

  // Valores iniciais dos preços (para restaurar ao cancelar)
  const [initialMonthlyPrice, setInitialMonthlyPrice] = useState("");
  const [initialAnnualPrice, setInitialAnnualPrice] = useState("");

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const { data: plans, error } = await supabase
        .from('plans')
        .select('*')
        .order('billing_cycle');

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Plans fetched from database:', plans);

      if (plans && plans.length > 0) {
        const monthlyPlan = plans.find(p => p.billing_cycle === 'MONTHLY');
        const annualPlan = plans.find(p => p.billing_cycle === 'YEARLY');

        console.log('Monthly plan:', monthlyPlan);
        console.log('Annual plan:', annualPlan);

        if (monthlyPlan) {
          setMonthlyPrice(monthlyPlan.price.toString());
          setInitialMonthlyPrice(monthlyPlan.price.toString());
          setMonthlyPlanId(monthlyPlan.id);
        }

        if (annualPlan) {
          setAnnualPrice(annualPlan.price.toString());
          setInitialAnnualPrice(annualPlan.price.toString());
          setAnnualPlanId(annualPlan.id);
        }
      } else {
        console.warn('No plans found in database');
        toast({
          title: "Nenhum plano encontrado",
          description: "Verifique se há planos cadastrados no banco de dados.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Erro ao carregar planos",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSavePrices = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session?.access_token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Update monthly plan
      if (monthlyPlanId && monthlyPrice !== initialMonthlyPrice) {
        const { error: monthlyError } = await supabase
          .from('plans')
          .update({ price: parseFloat(monthlyPrice) })
          .eq('id', monthlyPlanId);

        if (monthlyError) throw monthlyError;
      }

      // Update annual plan
      if (annualPlanId && annualPrice !== initialAnnualPrice) {
        const { error: annualError } = await supabase
          .from('plans')
          .update({ price: parseFloat(annualPrice) })
          .eq('id', annualPlanId);

        if (annualError) throw annualError;
      }

      setInitialMonthlyPrice(monthlyPrice);
      setInitialAnnualPrice(annualPrice);
      setEditingPrices(false);

      toast({
        title: "Preços atualizados!",
        description: "Os valores dos planos foram salvos com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar preços",
        description: error.message || "Tente novamente.",
        variant: "destructive",
      });
    }
  };

  const handleCancelPriceEdit = () => {
    setMonthlyPrice(initialMonthlyPrice);
    setAnnualPrice(initialAnnualPrice);
    setEditingPrices(false);
  };

  const formatCurrency = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(num);
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
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Configurações do Sistema
        </h1>
        <p className="text-muted-foreground">
          Gerencie preços, versões e recursos do sistema
        </p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Link to="/dashboard/admin/users">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Usuários</p>
                    <p className="text-xs text-muted-foreground">Gerenciar usuários</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/dashboard/admin/licenses">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                    <Package className="h-5 w-5 text-chart-1" />
                  </div>
                  <div>
                    <p className="font-medium">Licenças</p>
                    <p className="text-xs text-muted-foreground">Licenças avulsas</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-2/10">
                  <DollarSign className="h-5 w-5 text-chart-2" />
                </div>
                <div>
                  <p className="font-medium">Preços</p>
                  <p className="text-xs text-muted-foreground">Configure abaixo</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                  <Package className="h-5 w-5 text-chart-3" />
                </div>
                <div>
                  <p className="font-medium">Sistema</p>
                  <p className="text-xs text-muted-foreground">Versão atual</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pricing Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Preços dos Planos
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Configure os valores dos planos de assinatura
              </p>
            </div>
            {!editingPrices ? (
              <Button onClick={() => setEditingPrices(true)} variant="outline">
                Editar Preços
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button onClick={handleCancelPriceEdit} variant="outline">
                  Cancelar
                </Button>
                <Button onClick={handleSavePrices}>
                  Salvar Alterações
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Monthly Plan */}
            <div className="space-y-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Plano Mensal</h3>
                <Badge>MONTHLY</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="monthly-price">Valor Mensal</Label>
                {editingPrices ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="monthly-price"
                      type="number"
                      step="0.01"
                      value={monthlyPrice}
                      onChange={(e) => setMonthlyPrice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(monthlyPrice)}</p>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Cobrado mensalmente. Valor atual exibido aos clientes.
              </p>
            </div>

            {/* Annual Plan */}
            <div className="space-y-4 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Plano Anual</h3>
                <Badge variant="secondary">YEARLY</Badge>
              </div>
              <div className="space-y-2">
                <Label htmlFor="annual-price">Valor Anual</Label>
                {editingPrices ? (
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      R$
                    </span>
                    <Input
                      id="annual-price"
                      type="number"
                      step="0.01"
                      value={annualPrice}
                      onChange={(e) => setAnnualPrice(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                ) : (
                  <p className="text-2xl font-bold">{formatCurrency(annualPrice)}</p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  Cobrado anualmente. Inclui desconto equivalente a 2 meses grátis.
                </p>
                {annualPrice && monthlyPrice && (
                  <p className="text-xs text-muted-foreground">
                    Economia: {formatCurrency((parseFloat(monthlyPrice) * 12 - parseFloat(annualPrice)).toString())} por ano
                  </p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-muted-foreground">Versão Atual</Label>
                <p className="text-lg font-semibold">PDF Generator Hub v2.5.3</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Última Atualização</Label>
                <p className="text-lg font-semibold">Janeiro 2026</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Ambiente</Label>
                <Badge variant="outline">Produção</Badge>
              </div>
              <div>
                <Label className="text-muted-foreground">Status do Sistema</Label>
                <Badge variant="default">Operacional</Badge>
              </div>
            </div>

            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Recursos do Sistema</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Geração ilimitada de PDFs</li>
                <li>• Templates personalizados</li>
                <li>• Integração com Stripe</li>
                <li>• Gerenciamento de licenças</li>
                <li>• Sistema de assinaturas</li>
                <li>• Suporte a múltiplos dispositivos</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Help & Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentação e Suporte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Documentação do Supabase</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Consulte a documentação completa do backend
              </p>
              <Link to="/supabase/README.md" target="_blank">
                <Button variant="outline" size="sm">
                  Ver Documentação
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="rounded-lg border p-4">
              <h4 className="font-medium mb-2">Scripts SQL</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Acesse os scripts de migração e configuração
              </p>
              <div className="flex gap-2">
                <Badge variant="outline">users.sql</Badge>
                <Badge variant="outline">subscriptions.sql</Badge>
                <Badge variant="outline">stripe_wrapper.sql</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
