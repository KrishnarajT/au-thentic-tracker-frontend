
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

// Middleware backend configuration
const AUTH_API_BASE = 'https://api-get-away.krishnarajthadesar.in';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuthStatus = async () => {
      // Check for stored session on app load
      const storedUser = localStorage.getItem('auth_user');
      
      if (storedUser) {
        setUser(JSON.parse(storedUser));
        setIsLoading(false);
        return;
      }

      // Check if user is authenticated via middleware
      try {
        const response = await fetch(`${AUTH_API_BASE}/api/me`, {
          credentials: 'include', // Include cookies for session
        });

        if (response.ok) {
          const data = await response.json();
          const userData = {
            id: data.sub,
            username: data.name,
          };
          
          setUser(userData);
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }
      } catch (error) {
        console.log('Not authenticated');
      }

      setIsLoading(false);
    };

    checkAuthStatus();
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

  const loginWithAuthentik = async (): Promise<boolean> => {
    try {
      // Redirect to middleware backend for authentication
      window.location.href = `${AUTH_API_BASE}/auth/login`;
      return true;
    } catch (error) {
      console.error('Login redirect failed:', error);
      return false;
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
