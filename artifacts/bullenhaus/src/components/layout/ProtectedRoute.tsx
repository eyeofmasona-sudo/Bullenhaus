/**
 * ProtectedRoute.tsx — Route guard backed by Supabase Auth
 *
 * Three guard types:
 *   1. <ProtectedRoute>              — requires any authenticated user
 *   2. <ProtectedRoute domain="CRM"> — requires CRM domain access
 *   3. <ProtectedRoute domain="TRADING"> — requires Trading domain access
 *   4. <ProtectedRoute domain="BOTH"> — requires Super Admin
 *
 * On failure: redirects to /login (unauthenticated) or
 * the user's own domain dashboard (wrong domain).
 */

import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../app/trading/contexts/AuthContext';
import type { UnifiedRole } from '../../app/trading/contexts/AuthContext';

// ── Loading spinner ───────────────────────────────────────────────────────────

const Spinner: React.FC = () => (
  <div className="min-h-dvh w-full flex items-center justify-center bg-bg">
    <div className="w-10 h-10 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

// ── Generic protected route ───────────────────────────────────────────────────

interface ProtectedRouteProps {
  /** If provided, the user must have this exact role. */
  role?: UnifiedRole;
  /** Where to redirect on access denied (default: /unauthorized). */
  fallbackUrl?: string;
}

export function ProtectedRoute({ role, fallbackUrl = '/unauthorized' }: ProtectedRouteProps = {}) {
  const { session, loading, role: userRole } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;

  if (!isAuthenticated || !user) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname }}
        replace
      />
    );
  }

  if (role && userRole !== role) {
    return <Navigate to={fallbackUrl} replace />;
  }

  return <Outlet />;
}

// ── Convenience wrappers ──────────────────────────────────────────────────────

export function CrmRoute() {
  const { session, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  const crmRoles: UnifiedRole[] = ['agent', 'manager', 'director', 'admin'];
  if (!role || !crmRoles.includes(role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export function TradingRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;

  return <Outlet />;
}

export function AdminRoute() {
  const { session, loading, role } = useAuth();
  const location = useLocation();

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/login" state={{ from: location }} replace />;
  if (role !== 'admin') return <Navigate to="/unauthorized" replace />;

  return <Outlet />;
}
