import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { FileText, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { authApi, supabase } from "@/lib/supabase";
import { LINKS } from "@/lib/constants";

const Registro = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: "", color: "" });

  useEffect(() => {
    const calculateStrength = (pwd: string) => {
      if (!pwd) return { score: 0, label: "", color: "" };

      let score = 0;
      if (pwd.length >= 8) score += 1;
      if (/[A-Z]/.test(pwd)) score += 1;
      if (/[a-z]/.test(pwd)) score += 1;
      if (/[0-9]/.test(pwd)) score += 1;
      if (/[^A-Za-z0-9]/.test(pwd)) score += 1; // Qualquer caractere especial

      if (score <= 2) return { score, label: "Fraca", color: "bg-destructive" };
      if (score <= 4) return { score, label: "Média", color: "bg-yellow-500" };
      return { score, label: "Forte", color: "bg-green-500" };
    };

    setPasswordStrength(calculateStrength(password));
  }, [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    // Validar requisitos mínimos de senha
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecialChar = /[^A-Za-z0-9]/.test(password);

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
      toast({
        title: "Senha Insegura",
        description: "A senha deve ter no mínimo 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Criar usuário no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // Criar registro na tabela public.users
        const { error: dbError } = await supabase
          .from('users')
          .insert({
            id: authData.user.id,
            email: email,
            name: name,
            password_hash: 'hashed', // placeholder, a senha real está no auth.users
            role: 'USER',
            status: 'ACTIVE',
          });

        if (dbError) {
          console.error('Error creating user in database:', dbError);
        }

        // Fazer login automaticamente após registro bem-sucedido
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) {
          console.error('Error signing in after registration:', signInError);
          // Se falhar o login automático, redirecionar para página de login
          toast({
            title: "Conta criada com sucesso!",
            description: "Por favor, faça login.",
          });
          navigate("/login");
          return;
        }

        // Login bem-sucedido, redirecionar para dashboard
        toast({
          title: "Conta criada com sucesso!",
          description: "Bem-vindo ao PDF Generator!",
        });
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast({
        title: "Erro ao criar conta",
        description: error.message || "Tente novamente mais tarde.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        throw error;
      }

      // Não mostrar toast aqui, pois o usuário será redirecionado para o Google
      // O toast será mostrado apenas se houver erro
    } catch (error) {
      toast({
        title: "Erro ao registrar com Google",
        description: "Tente novamente mais tarde.",
        variant: "destructive",
      });
      setIsLoading(false);
    }
  };

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
          <CardTitle className="text-2xl">Criar sua conta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={handleGoogleRegister}
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
            Registrar com Google
          </Button>

          <div className="relative">
            <Separator />
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-2 text-xs text-muted-foreground">
              ou continue com email
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Seu nome aqui"
                autoComplete="off"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                autoComplete="off"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres (letras, números e símbolos)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex h-1.5 w-full gap-1 overflow-hidden rounded-full bg-secondary">
                    <div 
                      className={`h-full transition-all duration-300 ${passwordStrength.color}`} 
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    />
                  </div>
                  <p className={`text-xs font-medium ${passwordStrength.label === "Fraca" ? "text-destructive" : passwordStrength.label === "Média" ? "text-yellow-600" : "text-green-600"}`}>
                    Força da senha: {passwordStrength.label}
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-10"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword && (
                <div className="flex items-center gap-1.5 mt-1">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs text-green-600 font-medium">As senhas são iguais</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-3.5 w-3.5 text-destructive" />
                      <span className="text-xs text-destructive font-medium">As senhas não são iguais</span>
                    </>
                  )}
                </div>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Criando conta..." : "Criar conta"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Já tem uma conta?{" "}
            <Link to="/login" className="text-primary hover:underline">
              Fazer login
            </Link>
          </p>

          <p className="text-center text-xs text-muted-foreground">
            Ao criar uma conta, você concorda com nossos{" "}
            <a target="_blank" rel="noopener noreferrer" href={LINKS.termsOfService} className="underline hover:text-primary">
              Termos de Uso
            </a>{" "}
            e{" "}
            <a target="_blank" rel="noopener noreferrer" href={LINKS.privacyPolicy} className="underline hover:text-primary">
              Política de Privacidade
            </a>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Registro;