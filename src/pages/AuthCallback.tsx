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

          // Verificar se o usuário já existe na tabela users
          const { data: existingUser } = await supabase
            .from('users')
            .select('id, status')
            .eq('id', session.user.id)
            .single();

          // Se não existe, criar com status ACTIVE (OAuth já validou o email)
          if (!existingUser) {
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: session.user.id,
                email: session.user.email!,
                name: session.user.user_metadata.name || session.user.email!.split('@')[0],
                password_hash: 'oauth',
                role: 'USER',
                status: 'ACTIVE', // OAuth não precisa verificação
              });

            if (insertError) {
              console.error('Error creating user in database:', insertError);
            }
          }

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
