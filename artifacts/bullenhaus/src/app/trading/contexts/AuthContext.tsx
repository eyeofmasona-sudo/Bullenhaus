import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UnifiedRole = 'client' | 'agent' | 'manager' | 'director' | 'admin' | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UnifiedRole;
  kycStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null;
  loading: boolean;
  signOut: () => Promise<void>;
  signInMockAdmin: () => void;
  signInMockClient: () => void;
  signInMockAgent: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  kycStatus: null,
  loading: true,
  signOut: async () => {},
  signInMockAdmin: () => {},
  signInMockClient: () => {},
  signInMockAgent: () => {},
  refreshProfile: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UnifiedRole>(null);
  const [kycStatus, setKycStatus] = useState<'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED' | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRoleAndKyc = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('users')
        .select('role, kyc_status')
        .eq('id', userId)
        .single();

      if (data) {
        // Defensive: DB could return null if column added with nullable migration
        setRole((data.role as UnifiedRole) || 'client');
        setKycStatus((data.kyc_status as any) || 'UNVERIFIED');
      } else {
        setRole('client');
        setKycStatus('UNVERIFIED');
      }
    } catch {
      setRole('client');
      setKycStatus('UNVERIFIED');
    }
  };

  const refreshProfile = async () => {
    const currentUser = user || session?.user;
    if (currentUser?.id) {
      await fetchRoleAndKyc(currentUser.id);
    }
  };

  const signInMockAdmin = () => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'admin-mock', email: 'admin@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('admin');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  const signInMockClient = () => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'client-mock', email: 'client@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('client');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  const signInMockAgent = () => {
    if (!import.meta.env.DEV) return;
    const mockUser = { id: 'agent-mock', email: 'agent@bullenhaus.local' } as User;
    const mockSession = { user: mockUser, access_token: 'mock-token', refresh_token: 'mock', expires_in: 9999, token_type: 'bearer' } as Session;
    setSession(mockSession);
    setUser(mockUser);
    setRole('agent');
    setKycStatus('VERIFIED');
    setLoading(false);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRoleAndKyc(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (newUser) {
        setLoading(true);
        fetchRoleAndKyc(newUser.id);
      } else {
        setRole(null);
        setKycStatus(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session || (session && role)) {
      setLoading(false);
    }
  }, [session, role]);

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setRole(null);
    setKycStatus(null);
    setLoading(false);
    await supabase.auth.signOut({ scope: 'global' });
  };

  return (
    <AuthContext.Provider value={{ session, user, role, kycStatus, loading, signOut, signInMockAdmin, signInMockClient, signInMockAgent, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
