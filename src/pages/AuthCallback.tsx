import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // O Supabase automaticamente troca o código OAuth por uma sessão
        // quando detecta os parâmetros na URL (code, access_token, etc)
        // Precisamos aguardar um pouco para a sessão ser estabelecida
        await new Promise(resolve => setTimeout(resolve, 100));

        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('Error getting session:', sessionError);
          navigate('/login', { replace: true });
          return;
        }

        if (session) {
          console.log('OAuth session established for:', session.user.email);

          // Verificar se o usuário já existe na tabela users pelo ID (mesmo provider)
          const { data: existingUserById } = await supabase
            .from('users')
            .select('id, status, email')
            .eq('id', session.user.id)
            .single();

          if (existingUserById) {
            // Usuário já existe com este ID, fazer login normalmente
            navigate('/dashboard', { replace: true });
            return;
          }

          // Verificar se o email já existe na tabela users (pode ter sido criado via registro convencional)
          const { data: existingUserByEmail } = await supabase
            .from('users')
            .select('id, email')
            .eq('email', session.user.email!.toLowerCase())
            .single();

          if (existingUserByEmail) {
            // Email já existe com outro método de autenticação
            // Fazer logout do OAuth e informar o usuário
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

          // Se não existe, criar com status ACTIVE (OAuth já validou o email)
          const { error: insertError } = await supabase
            .from('users')
            .insert({
              id: session.user.id,
              email: session.user.email!.toLowerCase(),
              name: session.user.user_metadata.full_name || session.user.user_metadata.name || session.user.email!.split('@')[0],
              password_hash: 'oauth',
              role: 'USER',
              status: 'ACTIVE', // OAuth não precisa verificação
            });

          if (insertError) {
            console.error('Error creating user in database:', insertError);
            // Se der erro de constraint (email duplicado), informar usuário
            if (insertError.code === '23505') {
              await supabase.auth.signOut();
              setError('Este email já está cadastrado. Por favor, faça login com email e senha.');
              setTimeout(() => {
                navigate('/login', { replace: true });
              }, 3000);
              return;
            }
          }

          // Redireciona para o dashboard
          navigate('/dashboard', { replace: true });
        } else {
          console.log('No session found after OAuth callback');
          navigate('/login', { replace: true });
        }
      } catch (err) {
        console.error('Error in auth callback:', err);
        navigate('/login', { replace: true });
      }
    };

    handleCallback();
  }, [navigate, toast]);

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
        <p className="mt-4 text-muted-foreground">Processando autenticação...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
