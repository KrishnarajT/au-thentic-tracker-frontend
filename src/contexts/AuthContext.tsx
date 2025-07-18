
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  signup: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock API base URL - update this to your NAS endpoint
const API_BASE_URL = 'http://your-nas-ip:port';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session on app load
    const storedUser = localStorage.getItem('auth_user');
    
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = { id: data.userId, username: data.username };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return true;
      }
    } catch (error) {
      console.warn('Auth API not available, using local simulation:', error);
      
      // Fallback: simulate successful login for development
      if (username && password) {
        const userData = { id: 'local_user_' + Date.now(), username };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return true;
      }
    }
    return false;
  };

  const signup = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (response.ok) {
        const data = await response.json();
        const userData = { id: data.userId, username: data.username };
        
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return true;
      }
    } catch (error) {
      console.warn('Auth API not available, using local simulation:', error);
      
      // Fallback: simulate successful signup for development
      if (username && password) {
        const userData = { id: 'local_user_' + Date.now(), username };
        setUser(userData);
        localStorage.setItem('auth_user', JSON.stringify(userData));
        return true;
      }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
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
