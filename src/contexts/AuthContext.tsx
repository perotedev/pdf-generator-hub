import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

export type UserRole = 'ADMIN' | 'MANAGER' | 'USER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isManager: boolean;
  canManageUsers: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  logoutWithRedirect: () => void;
  updateUser: (user: User) => void;
  setUserDirectly: (user: User, session?: { access_token: string; refresh_token: string; expires_at: number }) => void;
  getAccessToken: () => string | null;
  loading: boolean;
}

const AUTH_STORAGE_KEY = 'capidoc-auth-session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Funções auxiliares para gerenciar o localStorage
function getStoredSession(): AuthSession | null {
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!stored) return null;

    const session: AuthSession = JSON.parse(stored);

    // Verificar se o token ainda é válido (não expirado)
    const now = Math.floor(Date.now() / 1000);
    if (session.expires_at && session.expires_at < now) {
      // Token expirado, remover do storage
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function setStoredSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function clearStoredSession(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Função para limpar sessão e redirecionar
  const clearSessionAndRedirect = useCallback(() => {
    setUser(null);
    clearStoredSession();
    localStorage.removeItem('user');
    localStorage.removeItem('capidoc-auth');
    sessionStorage.removeItem('pendingCheckoutPlan');
    sessionStorage.removeItem('authRedirectUrl');
    // Redirecionar para login
    window.location.href = '/login';
  }, []);

  // Inicializar a partir do localStorage
  useEffect(() => {
    const initAuth = () => {
      const session = getStoredSession();
      if (session?.user) {
        setUser(session.user);
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  // Verificar periodicamente se a sessão expirou (a cada 30 segundos)
  useEffect(() => {
    const checkSessionExpiry = () => {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY);
      if (!stored) return;

      try {
        const session: AuthSession = JSON.parse(stored);
        const now = Math.floor(Date.now() / 1000);

        // Se o token expirou, fazer logout e redirecionar
        if (session.expires_at && session.expires_at < now) {
          clearSessionAndRedirect();
        }
      } catch {
        // Sessão inválida, limpar
        clearSessionAndRedirect();
      }
    };

    // Verificar a cada 30 segundos
    const interval = setInterval(checkSessionExpiry, 30000);

    // Também verificar quando a janela ganha foco (caso o usuário tenha deixado a aba aberta)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkSessionExpiry();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [clearSessionAndRedirect]);

  // Função para obter o access token atual
  const getAccessToken = useCallback((): string | null => {
    const session = getStoredSession();
    return session?.access_token || null;
  }, []);

  // Função para setar o usuário diretamente (usado após login bem-sucedido)
  const setUserDirectly = useCallback((
    userData: User,
    session?: { access_token: string; refresh_token: string; expires_at: number }
  ) => {
    setUser(userData);

    if (session) {
      const authSession: AuthSession = {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        expires_at: session.expires_at,
        user: userData,
      };
      setStoredSession(authSession);
    }

    setLoading(false);
  }, []);

  const login = async (_email: string, _password: string) => {
    // Esta função não é mais usada diretamente, o login é feito via API
    // e depois setUserDirectly é chamado
    throw new Error('Use authUtilsApi.login() e depois setUserDirectly()');
  };

  const logout = useCallback(async () => {
    setUser(null);
    clearStoredSession();
    // Limpar todo o localStorage relacionado à autenticação
    localStorage.removeItem('user');
    localStorage.removeItem('capidoc-auth');
    // Limpar sessionStorage
    sessionStorage.removeItem('pendingCheckoutPlan');
    sessionStorage.removeItem('authRedirectUrl');
  }, []);

  // Logout com redirecionamento para a página de login
  const logoutWithRedirect = useCallback(() => {
    clearSessionAndRedirect();
  }, [clearSessionAndRedirect]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);

    // Atualizar também no storage
    const session = getStoredSession();
    if (session) {
      session.user = updatedUser;
      setStoredSession(session);
    }
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'ADMIN',
    isManager: user?.role === 'MANAGER',
    canManageUsers: user?.role === 'ADMIN' || user?.role === 'MANAGER',
    login,
    logout,
    logoutWithRedirect,
    updateUser,
    setUserDirectly,
    getAccessToken,
    loading,
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
