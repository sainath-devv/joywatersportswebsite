import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { silentTokenRefresh, logoutDevice, setAccessToken } from '../lib/auth';

export interface AuthUser {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  name?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (userData: Partial<AuthUser>, token?: string) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Helper to construct normalized display name
  const formatUserName = (u: Partial<AuthUser>): string => {
    if (u.name && u.name.trim()) return u.name.trim();
    const full = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    if (full) return full;
    if (u.email && u.email.includes('@')) return u.email.split('@')[0];
    if (u.phone) return u.phone;
    return 'User';
  };

  const login = useCallback((userData: Partial<AuthUser>, token?: string) => {
    if (token) {
      setAccessToken(token);
      localStorage.setItem('userToken', token);
    }

    const email = userData.email || localStorage.getItem('userEmail') || '';
    const phone = userData.phone || localStorage.getItem('userPhone') || '';
    const firstName = userData.firstName || localStorage.getItem('userFirstName') || '';
    const lastName = userData.lastName || localStorage.getItem('userLastName') || '';
    const computedName = formatUserName({ ...userData, email, phone, firstName, lastName });

    const updatedUser: AuthUser = {
      id: userData.id,
      email,
      phone,
      firstName,
      lastName,
      name: computedName
    };

    // Save to localStorage for snappy hydration across tabs/reloads
    if (email) localStorage.setItem('userEmail', email);
    if (phone) localStorage.setItem('userPhone', phone);
    if (firstName) localStorage.setItem('userFirstName', firstName);
    if (lastName) localStorage.setItem('userLastName', lastName);
    localStorage.setItem('userName', computedName);

    setUser(updatedUser);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutDevice();
    } catch (e) {
      console.warn('Logout failed:', e);
    } finally {
      setUser(null);
      localStorage.removeItem('userToken');
      localStorage.removeItem('userName');
      localStorage.removeItem('userEmail');
      localStorage.removeItem('userPhone');
      localStorage.removeItem('userFirstName');
      localStorage.removeItem('userLastName');
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      // First try /api/user/me
      const res = await fetch('/api/user/me', {
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          login(data.user);
          return;
        }
      }

      // Try silent refresh
      const refreshResult = await silentTokenRefresh();
      if (refreshResult?.user) {
        login(refreshResult.user, refreshResult.token);
        return;
      }
    } catch (err) {
      console.warn('Auth check skipped or offline:', err);
    }

    // Fallback hydration from localStorage if offline or session persistent
    const storedEmail = localStorage.getItem('userEmail');
    const storedPhone = localStorage.getItem('userPhone');
    const storedFirstName = localStorage.getItem('userFirstName');
    const storedLastName = localStorage.getItem('userLastName');
    const storedName = localStorage.getItem('userName');
    const storedToken = localStorage.getItem('userToken');

    if (storedEmail || storedPhone || storedName || storedToken) {
      const fallbackUser: AuthUser = {
        email: storedEmail || '',
        phone: storedPhone || '',
        firstName: storedFirstName || '',
        lastName: storedLastName || '',
        name: storedName || formatUserName({ email: storedEmail || '', phone: storedPhone || '', firstName: storedFirstName || '', lastName: storedLastName || '' })
      };
      setUser(fallbackUser);
    }
  }, [login]);

  // Initial session restoration on app load
  useEffect(() => {
    let isMounted = true;

    // Quick synchronous hydration from localStorage so user isn't shown logged out while fetch runs
    const storedEmail = localStorage.getItem('userEmail');
    const storedPhone = localStorage.getItem('userPhone');
    const storedName = localStorage.getItem('userName');
    if (storedEmail || storedPhone || storedName) {
      setUser({
        email: storedEmail || '',
        phone: storedPhone || '',
        firstName: localStorage.getItem('userFirstName') || '',
        lastName: localStorage.getItem('userLastName') || '',
        name: storedName || 'User'
      });
    }

    refreshUser().finally(() => {
      if (isMounted) setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [refreshUser]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isLoading,
        login,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
