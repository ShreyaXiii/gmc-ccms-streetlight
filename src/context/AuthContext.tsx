import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/auth';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: boolean;
  isOperator: boolean;
}

const DEMO_USERS: Record<string, { role: UserRole; name: string; pass: string }> = {
  'admin@gmc.gov.in': {
    role: 'administrator',
    name: 'Municipal Commissioner / Admin',
    pass: 'GmcAdmin@2026',
  },
  'operator@gmc.gov.in': {
    role: 'operator',
    name: 'Shift Engineer (Zone 1)',
    pass: 'GmcOperator@2026',
  },
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check local storage session
    const stored = localStorage.getItem('gmc_ccms_user_session');
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        localStorage.removeItem('gmc_ccms_user_session');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    // 1. If live Supabase Auth is configured, attempt real authentication
    if (isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password: pass,
        });

        if (error) {
          setIsLoading(false);
          return { success: false, error: error.message };
        }

        if (data.user) {
          const profile: UserProfile = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: data.user.user_metadata?.full_name || 'Municipal Engineer',
            role: (data.user.user_metadata?.role as UserRole) || 'operator',
            organization: 'Gandhidham Municipal Corporation',
            lastLogin: new Date().toISOString(),
          };
          setUser(profile);
          localStorage.setItem('gmc_ccms_user_session', JSON.stringify(profile));
          setIsLoading(false);
          return { success: true };
        }
      } catch (err: any) {
        setIsLoading(false);
        return { success: false, error: err.message || 'Supabase authentication failed' };
      }
    }

    // 2. Demonstration / Local Stored Auth
    const demoUser = DEMO_USERS[email.toLowerCase().trim()];
    if (demoUser && demoUser.pass === pass) {
      const profile: UserProfile = {
        id: `USR-${email.split('@')[0].toUpperCase()}`,
        email,
        fullName: demoUser.name,
        role: demoUser.role,
        organization: 'Gandhidham Municipal Corporation',
        lastLogin: new Date().toISOString(),
      };
      setUser(profile);
      localStorage.setItem('gmc_ccms_user_session', JSON.stringify(profile));
      setIsLoading(false);
      return { success: true };
    }

    setIsLoading(false);
    return {
      success: false,
      error: 'Invalid credentials. For demonstration use: admin@gmc.gov.in (pw: GmcAdmin@2026) or operator@gmc.gov.in (pw: GmcOperator@2026)',
    };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('gmc_ccms_user_session');
    if (isSupabaseConfigured && supabase) {
      supabase.auth.signOut();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin: user?.role === 'administrator',
        isOperator: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

