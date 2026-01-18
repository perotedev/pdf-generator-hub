import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Building2, Users, Check, RefreshCw, ArrowLeft, Shield, Headphones, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase";

const OrcamentoEnterprise = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    license_quantity: "5",
    billing_preference: "YEARLY",
    message: "",
  });

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("enterprise_quotes").insert({
        company_name: formData.company_name,
        contact_name: formData.contact_name,
        email: formData.email,
        phone: formData.phone || null,
        license_quantity: parseInt(formData.license_quantity),
        billing_preference: formData.billing_preference,
        message: formData.message || null,
        status: "PENDING",
      });

      if (error) throw error;

      // Enviar email de confirmação
      try {
        await supabase.functions.invoke("send-transactional-email", {
          body: {
            type: "ENTERPRISE_QUOTE_RECEIVED",
            to: formData.email,
            data: {
              contactName: formData.contact_name,
              companyName: formData.company_name,
              licenseQuantity: formData.license_quantity,
              billingPreference: formData.billing_preference,
            },
          },
        });
      } catch (emailError) {
        console.error("Error sending confirmation email:", emailError);
        // Não falhar por causa do email
      }

      setSubmitted(true);
      toast({
        title: "Solicitação enviada!",
        description: "Entraremos em contato em breve.",
      });
    } catch (error: any) {
      console.error("Error submitting quote:", error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="py-16">
        <div className="container max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="py-12">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 mx-auto mb-6">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-4">
                Solicitação Enviada com Sucesso!
              </h2>
              <p className="text-muted-foreground mb-6">
                Recebemos sua solicitação de orçamento Enterprise. Nossa equipe
                comercial entrará em contato em até 24 horas úteis.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="outline" onClick={() => navigate("/planos")}>
                  Ver Outros Planos
                </Button>
                <Button onClick={() => navigate("/")}>Voltar ao Início</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16">
      <div className="container">
        <div className="mb-8">
          <Link
            to="/planos"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Planos
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
          {/* Left Column - Info */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-4">
                Plano Enterprise
              </h1>
              <p className="text-lg text-muted-foreground">
                Soluções personalizadas para empresas que precisam de múltiplas
                licenças e suporte dedicado.
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-foreground">
                Benefícios Exclusivos
              </h2>

              <Card className="border-border">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Licenças em Volume
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Descontos progressivos para equipes de qualquer tamanho
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Headphones className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Suporte Prioritário
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Atendimento dedicado garantido
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* <Card className="border-border">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Shield className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Gerenciamento Centralizado
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Painel administrativo para gerenciar todas as licenças
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-border">
                <CardContent className="p-4 flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">
                      Integrações Personalizadas
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      API dedicada e integrações sob medida
                    </p>
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Pricing Info */}
            <Card className="border-primary bg-primary/5">
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-2">
                  Preços por Volume
                </h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex justify-between">
                    <span>5-10 licenças</span>
                    <span className="font-medium text-foreground">5% de desconto</span>
                  </li>
                  <li className="flex justify-between">
                    <span>11-25 licenças</span>
                    <span className="font-medium text-foreground">7% de desconto</span>
                  </li>
                  <li className="flex justify-between">
                    <span>26-50 licenças</span>
                    <span className="font-medium text-foreground">10% de desconto</span>
                  </li>
                  <li className="flex justify-between">
                    <span>51+ licenças</span>
                    <span className="font-medium text-foreground">Sob consulta</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Form */}
          <Card className="h-fit">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Solicitar Orçamento</CardTitle>
              <CardDescription>
                Preencha o formulário e nossa equipe entrará em contato
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company_name">Nome da Empresa *</Label>
                  <Input
                    id="company_name"
                    placeholder="Nome da Empresa"
                    value={formData.company_name}
                    onChange={(e) => handleChange("company_name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact_name">Nome do Contato *</Label>
                  <Input
                    id="contact_name"
                    placeholder="Nome do Contato"
                    value={formData.contact_name}
                    onChange={(e) => handleChange("contact_name", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">E-mail Corporativo *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seuemail@empresa.com.br"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={(e) => handleChange("phone", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="license_quantity">
                    Quantidade de Licenças *
                  </Label>
                  <Select
                    value={formData.license_quantity}
                    onValueChange={(value) =>
                      handleChange("license_quantity", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a quantidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 licenças</SelectItem>
                      <SelectItem value="10">10 licenças</SelectItem>
                      <SelectItem value="15">15 licenças</SelectItem>
                      <SelectItem value="25">25 licenças</SelectItem>
                      <SelectItem value="50">50 licenças</SelectItem>
                      <SelectItem value="100">100+ licenças</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Preferência de Cobrança *</Label>
                  <RadioGroup
                    value={formData.billing_preference}
                    onValueChange={(value) =>
                      handleChange("billing_preference", value)
                    }
                    className="flex flex-col gap-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="MONTHLY" id="monthly" />
                      <Label htmlFor="monthly" className="font-normal">
                        Mensal
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="YEARLY" id="yearly" />
                      <Label htmlFor="yearly" className="font-normal">
                        Anual (recomendado)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="CUSTOM" id="custom" />
                      <Label htmlFor="custom" className="font-normal">
                        Personalizado
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem Adicional</Label>
                  <Textarea
                    id="message"
                    placeholder="Conte-nos mais sobre as necessidades da sua empresa..."
                    value={formData.message}
                    onChange={(e) => handleChange("message", e.target.value)}
                    rows={4}
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    "Solicitar Orçamento"
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Ao enviar, você concorda com nossa{" "}
                  <Link to="/privacidade" className="underline">
                    Política de Privacidade
                  </Link>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrcamentoEnterprise;
