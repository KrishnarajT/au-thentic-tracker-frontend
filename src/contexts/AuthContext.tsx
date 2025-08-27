
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  loginAsGuest: () => Promise<boolean>;
  loginWithAuthentik: () => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// OAuth configuration for Authentik
const AUTHENTIK_CONFIG = {
  clientId: 'e8AJ9gM1EK7cpaGuwN1ED9NcJrKemA0U0INoOlpa', // Replace with your Authentik client ID
  redirectUri: window.location.origin + '/auth/callback',
  scope: 'openid profile email',
  authUrl: 'https://authentik.krishnarajthadesar.in/application/o/authorize/', // Replace with your Authentik URL
  tokenUrl: 'https://authentik.krishnarajthadesar.in/application/o/token/', // Replace with your Authentik URL
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on app load
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Handle OAuth callback
    const handleOAuthCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code && state === localStorage.getItem('oauth_state')) {
        // Exchange code for token
        exchangeCodeForToken(code);
      }
    };

    handleOAuthCallback();
    setIsLoading(false);
  }, []);

  const loginAsGuest = async (): Promise<boolean> => {
    try {
      const userData = { 
        id: 'guest_' + Date.now(), 
        username: 'Guest User' 
      };
      
      setUser(userData);
      localStorage.setItem('auth_user', JSON.stringify(userData));
      return true;
    } catch (error) {
      console.error('Guest login failed:', error);
      return false;
    }
  };

  const generateOAuthState = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  const loginWithAuthentik = async (): Promise<boolean> => {
    try {
      const state = generateOAuthState();
      localStorage.setItem('oauth_state', state);
      
      const authUrl = new URL(AUTHENTIK_CONFIG.authUrl);
      authUrl.searchParams.append('client_id', AUTHENTIK_CONFIG.clientId);
      authUrl.searchParams.append('redirect_uri', AUTHENTIK_CONFIG.redirectUri);
      authUrl.searchParams.append('response_type', 'code');
      authUrl.searchParams.append('scope', AUTHENTIK_CONFIG.scope);
      authUrl.searchParams.append('state', state);
      
      // Redirect to Authentik
      window.location.href = authUrl.toString();
      return true;
    } catch (error) {
      console.error('OAuth initiation failed:', error);
      return false;
    }
  };

  const exchangeCodeForToken = async (code: string) => {
    try {
      const response = await fetch(AUTHENTIK_CONFIG.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: AUTHENTIK_CONFIG.clientId,
          code: code,
          redirect_uri: AUTHENTIK_CONFIG.redirectUri,
        }),
      });

      if (response.ok) {
        const tokenData = await response.json();
        
        // Decode JWT to get user info (in production, verify the token!)
        const payload = JSON.parse(atob(tokenData.access_token.split('.')[1]));
        const userData = { 
          id: payload.sub, 
          username: payload.preferred_username || payload.email || 'Authentik User'
        };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        localStorage.setItem('access_token', tokenData.access_token);
        localStorage.removeItem('oauth_state');
        
        // Clean up URL
        window.history.replaceState({}, document.title, '/');
      } else {
        console.error('Token exchange failed');
      }
    } catch (error) {
      console.error('Token exchange error:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, loginAsGuest, loginWithAuthentik, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
