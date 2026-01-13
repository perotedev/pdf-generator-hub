import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi, supabase } from '../lib/supabase';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  loading: boolean;
  sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Função para limpar completamente o estado de autenticação
  const clearAuthState = useCallback(() => {
    setUser(null);
    setSessionExpired(true);
    localStorage.removeItem('user');
  }, []);

  // Função para buscar dados do usuário
  const fetchUserData = useCallback(async (userId: string): Promise<User | null> => {
    try {
      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      if (userData) {
        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching user data:', error);
      return null;
    }
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('Error getting session:', error);
          if (isMounted) {
            clearAuthState();
            setLoading(false);
          }
          return;
        }

        if (session?.user && isMounted) {
          const userData = await fetchUserData(session.user.id);
          if (userData && isMounted) {
            setUser(userData);
            setSessionExpired(false);
          } else if (isMounted) {
            // Usuário não encontrado na tabela users
            clearAuthState();
          }
        } else if (isMounted) {
          clearAuthState();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (isMounted) {
          clearAuthState();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        const userData = await fetchUserData(session.user.id);
        if (userData && isMounted) {
          setUser(userData);
          setSessionExpired(false);
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMounted) {
          clearAuthState();
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Session token refreshed successfully');
        // Verificar se o usuário ainda é válido
        const userData = await fetchUserData(session.user.id);
        if (userData && isMounted) {
          setUser(userData);
          setSessionExpired(false);
        }
      }
    });

    // Listen for page visibility changes to refresh session
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMounted) {
        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (error || !session) {
            console.log('Session expired or invalid');
            clearAuthState();
            return;
          }

          // Verificar se o usuário ainda existe no banco
          const userData = await fetchUserData(session.user.id);
          if (!userData && isMounted) {
            console.log('User not found in database, clearing session');
            await supabase.auth.signOut();
            clearAuthState();
          } else if (userData && isMounted) {
            setUser(userData);
            setSessionExpired(false);
          }
        } catch (error) {
          console.error('Error handling visibility change:', error);
          if (isMounted) {
            clearAuthState();
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar sessão periodicamente (a cada 5 minutos)
    const sessionCheckInterval = setInterval(async () => {
      if (!isMounted) return;

      const { data: { session } } = await supabase.auth.getSession();
      if (!session && user) {
        console.log('Session check: session expired');
        clearAuthState();
      }
    }, 5 * 60 * 1000);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, [clearAuthState, fetchUserData]);

  const login = async (email: string, password: string) => {
    try {
      const response = await authApi.login(email, password);

      const mappedUser: User = {
        id: response.user.id,
        name: response.user.name,
        email: response.user.email,
        role: response.user.role as UserRole,
      };

      setUser(mappedUser);
      setSessionExpired(false);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Limpar estado local primeiro
      setUser(null);
      setSessionExpired(false);
      localStorage.removeItem('user');

      // Depois fazer signOut no Supabase
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      // Mesmo com erro, garantir que o estado local está limpo
      setUser(null);
      setSessionExpired(false);
      localStorage.removeItem('user');
    }
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    canManageUsers: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    login,
    logout,
    updateUser,
    loading,
    sessionExpired,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
