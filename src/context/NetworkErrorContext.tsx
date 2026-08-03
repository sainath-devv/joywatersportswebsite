import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface NetworkErrorDetails {
  id: string;
  message: string;
  endpoint?: string;
  timestamp: Date;
  isServerDown?: boolean;
  retryFn?: () => void;
}

interface NetworkErrorContextType {
  error: NetworkErrorDetails | null;
  isCheckingHealth: boolean;
  showNetworkError: (message?: string, options?: { endpoint?: string; retryFn?: () => void; isServerDown?: boolean }) => void;
  clearNetworkError: () => void;
  checkServerHealth: () => Promise<boolean>;
}

const NetworkErrorContext = createContext<NetworkErrorContextType | undefined>(undefined);

export const NetworkErrorProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [error, setError] = useState<NetworkErrorDetails | null>(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const clearNetworkError = useCallback(() => {
    setError(null);
  }, []);

  const showNetworkError = useCallback((
    message: string = 'Please check your internet connection and try again.',
    options?: { endpoint?: string; retryFn?: () => void; isServerDown?: boolean }
  ) => {
    setError(prev => {
      if (prev && prev.message === message && prev.endpoint === options?.endpoint) {
        return prev;
      }
      return {
        id: Math.random().toString(36).substring(2, 9),
        message,
        endpoint: options?.endpoint,
        timestamp: new Date(),
        isServerDown: options?.isServerDown ?? true,
        retryFn: options?.retryFn,
      };
    });
  }, []);

  const showNetworkErrorRef = useRef(showNetworkError);
  useEffect(() => {
    showNetworkErrorRef.current = showNetworkError;
  }, [showNetworkError]);

  const checkServerHealth = useCallback(async (): Promise<boolean> => {
    setIsCheckingHealth(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const res = await fetch('/api/health', { 
        method: 'GET',
        signal: controller.signal,
        cache: 'no-store'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        clearNetworkError();
        setIsCheckingHealth(false);
        return true;
      }
    } catch {
      try {
        const res2 = await fetch('/api/coupons', { cache: 'no-store' });
        if (res2.ok || res2.status < 500) {
          clearNetworkError();
          setIsCheckingHealth(false);
          return true;
        }
      } catch {
        // Server down
      }
    }

    setIsCheckingHealth(false);
    showNetworkError('Please check your internet connection and try again.');
    return false;
  }, [clearNetworkError, showNetworkError]);

  // Global fetch interceptor mounted ONCE
  useEffect(() => {
    const originalFetch = window.fetch;

    const customFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
      try {
        const response = await originalFetch.call(window, input, init);
        
        // Intercept 502/503/504 Bad Gateway / Service Unavailable errors specifically for API routes
        const rawUrl = typeof input === 'string' ? input : (input as Request)?.url || '';
        if ([502, 503, 504].includes(response.status) && rawUrl.includes('/api/')) {
          const endpoint = rawUrl.startsWith('http') ? new URL(rawUrl).pathname : rawUrl;
          showNetworkErrorRef.current('Service temporarily unavailable. Please try again later.', { endpoint });
        }
        
        return response;
      } catch (err: any) {
        // IGNORE AbortError (happens naturally on unmount or user scroll/cancel)
        if (err?.name === 'AbortError') {
          throw err;
        }

        const rawUrl = typeof input === 'string' ? input : (input as Request)?.url || '';
        // Only intercept API calls, ignore static media/HMR requests
        if (rawUrl.includes('/api/')) {
          const endpoint = rawUrl.startsWith('http') ? new URL(rawUrl).pathname : rawUrl;
          if (
            err?.name === 'TypeError' ||
            err?.message?.toLowerCase().includes('fetch') ||
            err?.message?.toLowerCase().includes('network') ||
            !navigator.onLine
          ) {
            showNetworkErrorRef.current('Please check your internet connection and try again.', { endpoint });
          }
        }
        
        throw err;
      }
    };

    try {
      Object.defineProperty(window, 'fetch', {
        value: customFetch,
        writable: true,
        configurable: true,
      });
    } catch (e) {
      console.warn('Fetch interceptor setup fallback:', e);
    }

    const handleOffline = () => {
      showNetworkErrorRef.current('Please check your internet connection and try again.');
    };

    window.addEventListener('offline', handleOffline);

    return () => {
      try {
        Object.defineProperty(window, 'fetch', {
          value: originalFetch,
          writable: true,
          configurable: true,
        });
      } catch {
        // Fallback cleanup
      }
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <NetworkErrorContext.Provider
      value={{
        error,
        isCheckingHealth,
        showNetworkError,
        clearNetworkError,
        checkServerHealth,
      }}
    >
      {children}
    </NetworkErrorContext.Provider>
  );
};

export const useNetworkError = (): NetworkErrorContextType => {
  const context = useContext(NetworkErrorContext);
  if (!context) {
    throw new Error('useNetworkError must be used within a NetworkErrorProvider');
  }
  return context;
};
