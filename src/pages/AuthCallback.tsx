import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, authUtilsApi } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setUserDirectly } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string>('Processando autenticação...');
  const processedRef = useRef(false);

  useEffect(() => {
    // Evitar processamento duplicado
    if (processedRef.current) return;
    processedRef.current = true;

    const handleCallback = async () => {
      try {
        setStatus('Verificando sessão...');

        // Aguardar a detecção automática da sessão pelo Supabase
        // O Supabase detecta os parâmetros na URL (code, access_token, etc)
        let session = null;
        let attempts = 0;
        const maxAttempts = 10;

        // Tentar obter a sessão com retry
        while (!session && attempts < maxAttempts) {
          const { data, error: sessionError } = await supabase.auth.getSession();

          if (sessionError) {
            console.error('Error getting session (attempt ' + (attempts + 1) + '):', sessionError);
          }

          if (data?.session) {
            session = data.session;
            break;
          }

          attempts++;
          if (attempts < maxAttempts) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }

        if (!session) {
          console.log('No session found after OAuth callback');
          setError('Não foi possível estabelecer a sessão. Por favor, tente novamente.');
          setTimeout(() => navigate('/login', { replace: true }), 3000);
          return;
        }

        setStatus('Configurando sua conta...');
        console.log('OAuth session established for:', session.user.email);

        // Usar API para criar/verificar usuário OAuth
        try {
          const result = await authUtilsApi.createOAuthUser(
            session.user.id,
            session.user.email!,
            session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email!.split('@')[0]
          );

          if (result.exists || result.created) {
            setStatus('Finalizando...');

            // Preparar dados do usuário
            const userData = {
              id: result.user?.id || session.user.id,
              name: result.user?.name || session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email!.split('@')[0],
              email: result.user?.email || session.user.email!,
              role: result.user?.role || 'USER',
            };

            // Preparar dados da sessão
            const sessionData = {
              access_token: session.access_token,
              refresh_token: session.refresh_token,
              expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
            };

            // Salvar no AuthContext e localStorage
            setUserDirectly(userData, sessionData);

            // Verificar se há URL de redirecionamento salva
            const savedRedirectUrl = sessionStorage.getItem('authRedirectUrl');
            if (savedRedirectUrl) {
              sessionStorage.removeItem('authRedirectUrl');
              navigate(savedRedirectUrl, { replace: true });
              return;
            }

            // Verificar checkout pendente
            const pendingCheckout = sessionStorage.getItem('pendingCheckoutPlan');
            if (pendingCheckout) {
              sessionStorage.removeItem('pendingCheckoutPlan');
              navigate(`/checkout?plan=${pendingCheckout}`, { replace: true });
              return;
            }

            // Redirecionar para dashboard
            navigate('/dashboard', { replace: true });
            return;
          }
        } catch (apiError: any) {
          console.error('Error with OAuth user:', apiError);

          // Email já existe com outro método de autenticação
          if (apiError.message?.includes('outro método') || apiError.message?.includes('already registered')) {
            await supabase.auth.signOut();

            setError('Este email já está cadastrado com outro método de login. Por favor, faça login com email e senha.');

            toast({
              title: "Email já cadastrado",
              description: "Este email já está cadastrado com outro método de login. Por favor, faça login com email e senha.",
              variant: "destructive",
            });

            setTimeout(() => {
              navigate('/login', { replace: true });
            }, 3000);
            return;
          }

          // Outro erro, mas sessão existe - tentar continuar
          console.log('API error but session exists, attempting to continue...');

          // Salvar usuário do OAuth diretamente
          const userData = {
            id: session.user.id,
            name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email!.split('@')[0],
            email: session.user.email!,
            role: 'USER' as const,
          };

          const sessionData = {
            access_token: session.access_token,
            refresh_token: session.refresh_token,
            expires_at: session.expires_at || Math.floor(Date.now() / 1000) + 3600,
          };

          setUserDirectly(userData, sessionData);

          navigate('/dashboard', { replace: true });
          return;
        }

        // Fallback - redireciona para o dashboard
        navigate('/dashboard', { replace: true });
      } catch (err) {
        console.error('Error in auth callback:', err);
        setError('Ocorreu um erro durante a autenticação. Redirecionando para o login...');
        setTimeout(() => navigate('/login', { replace: true }), 3000);
      }
    };

    handleCallback();
  }, [navigate, toast, setUserDirectly]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center max-w-md px-4">
          <div className="text-destructive text-5xl mb-4">!</div>
          <p className="text-lg font-semibold text-destructive mb-2">Erro de autenticação</p>
          <p className="text-muted-foreground">{error}</p>
          <p className="text-sm text-muted-foreground mt-4">Redirecionando para login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">{status}</p>
      </div>
    </div>
  );
};

export default AuthCallback;
