import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
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
  refreshUser: () => Promise<User | null>;
  setUserDirectly: (user: User) => void;
  loading: boolean;
  sessionExpired: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Ref para controlar requisições em andamento
  const abortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef(true);
  const initializingRef = useRef(false);

  // Função para limpar completamente o estado de autenticação
  const clearAuthState = useCallback(() => {
    if (!isMountedRef.current) return;
    setUser(null);
    setSessionExpired(true);
    localStorage.removeItem('user');
  }, []);

  // Função para atualizar last_login do usuário
  const updateLastLogin = useCallback(async (userId: string) => {
    try {
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last_login:', error);
    }
  }, []);

  // Função para buscar dados do usuário com suporte a AbortController
  const fetchUserData = useCallback(async (
    userId: string,
    updateLogin: boolean = false,
    signal?: AbortSignal
  ): Promise<User | null> => {
    try {
      if (signal?.aborted) {
        return null;
      }

      const { data: userData, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (signal?.aborted) {
        return null;
      }

      if (error) {
        console.error('Error fetching user data:', error);
        return null;
      }

      if (userData) {
        if (updateLogin) {
          updateLastLogin(userId);
        }

        return {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role as UserRole,
        };
      }
      return null;
    } catch (error: any) {
      if (error.name === 'AbortError' || signal?.aborted) {
        return null;
      }
      console.error('Error fetching user data:', error);
      return null;
    }
  }, [updateLastLogin]);

  // Função para atualizar o usuário externamente
  const refreshUser = useCallback(async (): Promise<User | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const userData = await fetchUserData(session.user.id);
        if (userData && isMountedRef.current) {
          setUser(userData);
          setSessionExpired(false);
          setLoading(false);
          return userData;
        }
      }
      return null;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  }, [fetchUserData]);

  // Função para setar o usuário diretamente (usado após login bem-sucedido)
  const setUserDirectly = useCallback((userData: User) => {
    setUser(userData);
    setSessionExpired(false);
    setLoading(false);
  }, []);

  // Check for existing session on mount
  useEffect(() => {
    // Evitar inicialização duplicada
    if (initializingRef.current) return;
    initializingRef.current = true;

    isMountedRef.current = true;
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (!isMountedRef.current || signal.aborted) {
          return;
        }

        if (error) {
          console.error('Error getting session:', error);
          clearAuthState();
          setLoading(false);
          return;
        }

        if (session?.user) {
          const userData = await fetchUserData(session.user.id, false, signal);
          if (userData && isMountedRef.current && !signal.aborted) {
            setUser(userData);
            setSessionExpired(false);
          } else if (isMountedRef.current && !signal.aborted) {
            clearAuthState();
          }
        } else if (isMountedRef.current && !signal.aborted) {
          // Sem sessão - não é erro, apenas não está logado
          setUser(null);
          setSessionExpired(false);
        }
      } catch (error: any) {
        if (error.name === 'AbortError' || signal.aborted) {
          return;
        }
        console.error('Error initializing auth:', error);
        if (isMountedRef.current) {
          clearAuthState();
        }
      } finally {
        if (isMountedRef.current && !signal.aborted) {
          setLoading(false);
        }
      }
    };

    initAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Ignorar INITIAL_SESSION pois já tratamos no initAuth
      if (event === 'INITIAL_SESSION') {
        return;
      }

      if (!isMountedRef.current) {
        return;
      }

      console.log('Auth state changed:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        const signInController = new AbortController();
        try {
          const userData = await fetchUserData(session.user.id, true, signInController.signal);
          if (userData && isMountedRef.current) {
            setUser(userData);
            setSessionExpired(false);
            setLoading(false);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching user on SIGNED_IN:', error);
          }
        }
      } else if (event === 'SIGNED_OUT') {
        if (isMountedRef.current) {
          setUser(null);
          setSessionExpired(false);
          setLoading(false);
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('Session token refreshed successfully');
        try {
          const userData = await fetchUserData(session.user.id);
          if (userData && isMountedRef.current) {
            setUser(userData);
            setSessionExpired(false);
          }
        } catch (error: any) {
          if (error.name !== 'AbortError') {
            console.error('Error fetching user on TOKEN_REFRESHED:', error);
          }
        }
      }
    });

    // Listen for page visibility changes to refresh session
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible' && isMountedRef.current) {
        const visibilityController = new AbortController();

        try {
          const { data: { session }, error } = await supabase.auth.getSession();

          if (!isMountedRef.current || visibilityController.signal.aborted) {
            return;
          }

          if (error || !session) {
            // Só limpar se tinha usuário antes
            if (user) {
              console.log('Session expired or invalid on visibility change');
              clearAuthState();
            }
            return;
          }

          // Verificar se o usuário ainda existe no banco
          const userData = await fetchUserData(session.user.id, false, visibilityController.signal);

          if (!isMountedRef.current || visibilityController.signal.aborted) {
            return;
          }

          if (!userData) {
            console.log('User not found in database, clearing session');
            await supabase.auth.signOut();
            clearAuthState();
          } else {
            setUser(userData);
            setSessionExpired(false);
          }
        } catch (error: any) {
          if (error.name === 'AbortError' || visibilityController.signal.aborted) {
            return;
          }
          console.error('Error handling visibility change:', error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Verificar sessão periodicamente (a cada 5 minutos) - apenas se houver usuário logado
    const sessionCheckInterval = setInterval(async () => {
      if (!isMountedRef.current) return;

      // Só verificar se tem usuário
      const currentUser = user;
      if (!currentUser) return;

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session && isMountedRef.current) {
          console.log('Session check: session expired');
          clearAuthState();
        }
      } catch (error) {
        console.error('Error in session check:', error);
      }
    }, 5 * 60 * 1000);

    return () => {
      isMountedRef.current = false;

      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearInterval(sessionCheckInterval);
    };
  }, []); // Removido user das dependências para evitar loop

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
      setLoading(false);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setSessionExpired(false);
      localStorage.removeItem('user');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Logout error:', error);
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
    refreshUser,
    setUserDirectly,
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
