import { Link, useNavigate, useLocation, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { RefreshCw, Eye, EyeOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { authUtilsApi, supabase } from "@/lib/supabase";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAuthenticated, setUserDirectly, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Capturar URL de destino (de location.state ou query params)
  const getRedirectUrl = (): string => {
    // Primeiro, verificar location.state.from (de ProtectedRoute)
    const fromState = location.state?.from?.pathname;
    if (fromState && fromState !== '/login' && fromState !== '/registro') {
      return fromState;
    }

    // Segundo, verificar query param redirect
    const redirectParam = searchParams.get('redirect');
    if (redirectParam) {
      return redirectParam;
    }

    // Verificar se há checkout pendente
    const pendingCheckout = sessionStorage.getItem('pendingCheckoutPlan');
    if (pendingCheckout) {
      sessionStorage.removeItem('pendingCheckoutPlan');
      return `/checkout?plan=${pendingCheckout}`;
    }

    // Default: dashboard
    return '/dashboard';
  };

  // Redirecionar se já estiver autenticado (apenas após o carregamento inicial)
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      const redirectUrl = getRedirectUrl();
      navigate(redirectUrl, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Fazer login via API
      const result = await authUtilsApi.login(email, password);

      console.log('Login result:', result);

      if (result.success && result.user) {
        // Verificar se o usuário tem status PENDING (email não verificado)
        if (result.user.status === 'PENDING') {
          toast({
            title: "Email não verificado",
            description: "Verifique seu email para ativar sua conta.",
            variant: "destructive",
          });

          navigate(`/verificar-email?userId=${result.user.id}&email=${encodeURIComponent(email)}&name=${encodeURIComponent(result.user.name || '')}`);
          return;
        }

        // Preparar dados do usuário
        const userData = {
          id: result.user.id,
          name: result.user.name,
          email: result.user.email,
          role: result.user.role || 'USER',
        };

        // Preparar dados da sessão se disponíveis
        const sessionData = result.session ? {
          access_token: result.session.access_token,
          refresh_token: result.session.refresh_token,
          expires_at: result.session.expires_at,
        } : undefined;

        // Atualizar o usuário e sessão no AuthContext
        setUserDirectly(userData, sessionData);

        toast({
          title: "Login realizado com sucesso!",
          description: "Redirecionando...",
        });

        // Redirecionar para destino pendente ou dashboard
        const redirectUrl = getRedirectUrl();
        navigate(redirectUrl, { replace: true });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoading(true);

    try {
      // Salvar URL de redirecionamento antes do OAuth
      const redirectUrl = getRedirectUrl();
      if (redirectUrl !== '/dashboard') {
        sessionStorage.setItem('authRedirectUrl', redirectUrl);
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      toast({
        title: "Erro ao fazer login com Google",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação inicial
  if (authLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Se já está autenticado, não renderizar o formulário (useEffect vai redirecionar)
  if (isAuthenticated) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
      <Card className="w-full max-w-md border-border">
        <CardHeader className="text-center">
            <div className="mx-auto my-2">
              <img
                src="/imgs/pdf_generator.png"
                alt="PDF Generator Logo"
                className="h-12 w-12"
              />
            </div>
          <CardTitle className="text-2xl">Entrar na sua conta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Acesse sua conta para gerenciar suas assinaturas e licenças
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleLogin}
            disabled={isLoading}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Entrar com Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              ou continue com email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link
                  to="/recuperar-senha"
                  className="text-xs text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Não tem uma conta?{" "}
            <Link to="/registro" className="text-primary hover:underline">
              Criar conta
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
