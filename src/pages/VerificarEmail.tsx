import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { emailApi, supabase } from "@/lib/supabase";
import { Mail, RefreshCw } from "lucide-react";

const VerificarEmail = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [code, setCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [userId, setUserId] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    // Pegar userId e email dos params ou da sessão
    const emailParam = searchParams.get("email");
    const userIdParam = searchParams.get("userId");
    const nameParam = searchParams.get("name");

    if (emailParam) setUserEmail(emailParam);
    if (userIdParam) setUserId(userIdParam);
    if (nameParam) setUserName(nameParam);

    // Se não tiver params, redirecionar para login
    if (!emailParam || !userIdParam) {
      toast({
        title: "Sessão inválida",
        description: "Por favor, faça o registro novamente.",
        variant: "destructive",
      });
      navigate("/registro");
    }
  }, [searchParams, navigate, toast]);

  useEffect(() => {
    // Countdown para reenvio
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();

    if (code.length !== 6) {
      toast({
        title: "Código inválido",
        description: "O código deve ter 6 dígitos.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await emailApi.verifyEmailCode(code, userId);

      if (result.success) {
        toast({
          title: "Email verificado!",
          description: "Sua conta foi ativada com sucesso.",
        });

        // Fazer login automaticamente
        const { data, error } = await supabase.auth.getUser();

        if (!error && data.user) {
          navigate("/dashboard");
        } else {
          navigate("/login");
        }
      }
    } catch (error: any) {
      toast({
        title: "Erro na verificação",
        description: error.message || "Código inválido ou expirado.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsResending(true);

    try {
      await emailApi.sendVerificationEmail(userId, userEmail, userName);

      toast({
        title: "Código reenviado!",
        description: "Verifique sua caixa de entrada.",
      });

      setCanResend(false);
      setCountdown(60);
    } catch (error: any) {
      toast({
        title: "Erro ao reenviar código",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsResending(false);
    }
  };

  const formatCode = (value: string) => {
    // Apenas números, máximo 6 dígitos
    const numbers = value.replace(/\D/g, '').slice(0, 6);
    setCode(numbers);
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verificar Email</CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Enviamos um código de 6 dígitos para
          </p>
          <p className="text-sm font-semibold text-foreground">
            {userEmail}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <form onSubmit={handleVerify} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código de Verificação</Label>
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={code}
                onChange={(e) => formatCode(e.target.value)}
                disabled={isLoading}
                className="text-center text-2xl font-bold tracking-widest"
                maxLength={6}
                required
              />
              <p className="text-xs text-muted-foreground text-center">
                Digite o código de 6 dígitos recebido por email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Verificar Código"
              )}
            </Button>
          </form>

          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Não recebeu o código?
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResend}
              disabled={!canResend || isResending}
              className="w-full"
            >
              {isResending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Reenviando...
                </>
              ) : canResend ? (
                "Reenviar Código"
              ) : (
                `Reenviar em ${countdown}s`
              )}
            </Button>
          </div>

          <div className="pt-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Se o email não chegou, verifique sua pasta de spam ou lixo eletrônico
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VerificarEmail;
