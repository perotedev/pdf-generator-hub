import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, DollarSign, Package, ArrowRight, RefreshCw, Shield, Save, Users, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { plansManagementApi, systemApi, type Plan } from "@/lib/supabase";

const Admin = () => {
  const { toast } = useToast();
  const { isAdmin, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [editingPrices, setEditingPrices] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [savingPrices, setSavingPrices] = useState(false);

  // Preços dos planos
  const [monthlyPrice, setMonthlyPrice] = useState("");
  const [annualPrice, setAnnualPrice] = useState("");
  const [monthlyPlanId, setMonthlyPlanId] = useState("");
  const [annualPlanId, setAnnualPlanId] = useState("");

  // Valores iniciais dos preços (para restaurar ao cancelar)
  const [initialMonthlyPrice, setInitialMonthlyPrice] = useState("");
  const [initialAnnualPrice, setInitialAnnualPrice] = useState("");

  // Configurações do sistema
  const [userManualUrl, setUserManualUrl] = useState("");
  const [systemDocUrl, setSystemDocUrl] = useState("");
  const [infoVideoUrl, setInfoVideoUrl] = useState("");

  useEffect(() => {
    fetchPlans();
    loadSystemSettings();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);

      const response = await plansManagementApi.getAllPlans();
      const plans = response.plans || [];

      console.log('Plans fetched from API:', plans);

      if (plans.length > 0) {
        const monthlyPlan = plans.find((p: Plan) => p.billing_cycle === 'MONTHLY');
        const annualPlan = plans.find((p: Plan) => p.billing_cycle === 'YEARLY');

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
        console.warn('No plans found');
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
    setSavingPrices(true);
    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      // Update monthly plan
      if (monthlyPlanId && monthlyPrice !== initialMonthlyPrice) {
        await plansManagementApi.updatePlan(token, monthlyPlanId, { price: parseFloat(monthlyPrice) });
      }

      // Update annual plan
      if (annualPlanId && annualPrice !== initialAnnualPrice) {
        await plansManagementApi.updatePlan(token, annualPlanId, { price: parseFloat(annualPrice) });
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
    } finally {
      setSavingPrices(false);
    }
  };

  const handleCancelPriceEdit = () => {
    setMonthlyPrice(initialMonthlyPrice);
    setAnnualPrice(initialAnnualPrice);
    setEditingPrices(false);
  };

  const loadSystemSettings = async () => {
    try {
      const response = await systemApi.getSettings();
      const settings = response.settings || [];

      settings.forEach((setting: { key: string; value: string }) => {
        if (setting.key === "user_manual_url") setUserManualUrl(setting.value);
        if (setting.key === "system_documentation_url") setSystemDocUrl(setting.value);
        if (setting.key === "info_video_url") setInfoVideoUrl(setting.value);
      });
    } catch (error: any) {
      console.error("Error loading system settings:", error);
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);

    try {
      const token = getAccessToken();

      if (!token) {
        toast({
          title: "Sessão expirada",
          description: "Por favor, faça login novamente.",
          variant: "destructive",
        });
        return;
      }

      await Promise.all([
        systemApi.updateSetting(token, "user_manual_url", userManualUrl),
        systemApi.updateSetting(token, "system_documentation_url", systemDocUrl),
        systemApi.updateSetting(token, "info_video_url", infoVideoUrl),
      ]);

      toast({
        title: "Configurações salvas!",
        description: "As alterações foram aplicadas com sucesso.",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao salvar",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSavingSettings(false);
    }
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
      <div className="grid gap-4 md:grid-cols-3">
        <Link to="/dashboard/admin/usuarios">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
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

        <Link to="/dashboard/admin/licencas">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-1/10">
                    <Key className="h-5 w-5 text-chart-1" />
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

        <Link to="/dashboard/admin/versoes">
          <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-chart-3/10">
                    <Package className="h-5 w-5 text-chart-3" />
                  </div>
                  <div>
                    <p className="font-medium">Versões</p>
                    <p className="text-xs text-muted-foreground">Versões do sistema</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </Link>
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
                <Button onClick={handleCancelPriceEdit} variant="outline" disabled={savingPrices}>
                  Cancelar
                </Button>
                <Button onClick={handleSavePrices} disabled={savingPrices}>
                  {savingPrices ? (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    "Salvar Alterações"
                  )}
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

      {/* System Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Links e Recursos do Sistema
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Configure os links de documentação e recursos disponíveis para os usuários
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveSettings} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="userManualUrl">URL do Manual do Usuário</Label>
              <Input
                id="userManualUrl"
                type="url"
                placeholder="https://exemplo.com/manual-usuario.pdf"
                value={userManualUrl}
                onChange={(e) => setUserManualUrl(e.target.value)}
                disabled={savingSettings}
              />
              <p className="text-xs text-muted-foreground">
                Link para o PDF ou página do manual do usuário
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="systemDocUrl">URL da Documentação do Sistema</Label>
              <Input
                id="systemDocUrl"
                type="url"
                placeholder="https://exemplo.com/documentacao"
                value={systemDocUrl}
                onChange={(e) => setSystemDocUrl(e.target.value)}
                disabled={savingSettings}
              />
              <p className="text-xs text-muted-foreground">
                Link para a documentação técnica do sistema
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="infoVideoUrl">URL do Vídeo Informativo</Label>
              <Input
                id="infoVideoUrl"
                type="url"
                placeholder="https://www.youtube.com/watch?v=..."
                value={infoVideoUrl}
                onChange={(e) => setInfoVideoUrl(e.target.value)}
                disabled={savingSettings}
              />
              <p className="text-xs text-muted-foreground">
                Link para vídeo no YouTube, Vimeo ou outra plataforma
              </p>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={savingSettings}>
                {savingSettings ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configurações
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={loadSystemSettings}
                disabled={savingSettings}
              >
                Recarregar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Admin;
