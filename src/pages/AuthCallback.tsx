import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';

const AuthCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase automaticamente troca o código OAuth por uma sessão
        // quando detecta os parâmetros na URL (code, access_token, etc)
        // Precisamos aguardar um pouco para a sessão ser estabelecida
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          console.log('OAuth session established for:', session.user.email);
          // A sessão foi estabelecida, o AuthContext vai detectar via onAuthStateChange
          // Redireciona para o dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.log('No session found after OAuth callback');
          navigate('/login', { replace: true });
        }
      } catch (error) {
        console.error('Error in auth callback:', error);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
        <p className="mt-4 text-muted-foreground">Processando autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
