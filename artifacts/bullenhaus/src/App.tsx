import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

// Guards & Contexts
import { AuthProvider, useAuth } from './app/trading/contexts/AuthContext';
import { AuthGuard } from './components/guards/AuthGuard';
import { RoleGuard } from './components/guards/RoleGuard';

// Global Auth Pages
import LoginPage from './app/login/LoginPage';
import { Register } from './app/trading/pages/auth/Register';
import { ForgotPassword } from './app/trading/pages/auth/ForgotPassword';
import { ResetPassword } from './app/trading/pages/auth/ResetPassword';
import { AuthLayout } from './app/trading/pages/auth/AuthLayout';

// Trade Hooks
import { useMarketEngine } from './app/trading/hooks/useMarketEngine';

// ==========================================
// TRADING COMPONENTS (Lazy)
// ==========================================
const TradeDashboard = React.lazy(() => import('./app/trading/components/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const TradeMarkets = React.lazy(() => import('./app/trading/pages/dashboard/Markets').then(m => ({ default: m.Markets })));
const TradeTerminal = React.lazy(() => import('./app/trading/pages/dashboard/Trade').then(m => ({ default: m.Trade })));
const TradePortfolio = React.lazy(() => import('./app/trading/pages/dashboard/Portfolio').then(m => ({ default: m.Portfolio })));
const TradeTransactions = React.lazy(() => import('./app/trading/pages/dashboard/Transactions').then(m => ({ default: m.Transactions })));
const TradeReferrals = React.lazy(() => import('./app/trading/pages/dashboard/Referrals').then(m => ({ default: m.Referrals })));
const TradeKYC = React.lazy(() => import('./app/trading/pages/dashboard/KYC').then(m => ({ default: m.KYC })));
const TradeNotifications = React.lazy(() => import('./app/trading/pages/dashboard/NotificationsPage').then(m => ({ default: m.Notifications })));
const TradeSupport = React.lazy(() => import('./app/trading/pages/dashboard/Support').then(m => ({ default: m.Support })));
const TradeProfileSettings = React.lazy(() => import('./app/trading/pages/dashboard/ProfileSettings').then(m => ({ default: m.ProfileSettings })));
const TradeGamification = React.lazy(() => import('./app/trading/pages/dashboard/Gamification').then(m => ({ default: m.Gamification })));

// Trade Admin Components
const TradeAdminLayout = React.lazy(() => import('./app/trading/components/admin/AdminLayout').then(m => ({ default: m.AdminLayout })));
const TradeAdminOverview = React.lazy(() => import('./app/trading/pages/admin/AdminOverview').then(m => ({ default: m.AdminOverview })));
const TradeAdminUsers = React.lazy(() => import('./app/trading/pages/admin/AdminUsers').then(m => ({ default: m.AdminUsers })));
const TradeAdminMarketControl = React.lazy(() => import('./app/trading/pages/admin/AdminMarketControl').then(m => ({ default: m.AdminMarketControl })));
const TradeAdminKYC = React.lazy(() => import('./app/trading/pages/admin/AdminKYC').then(m => ({ default: m.AdminKYC })));
const TradeAdminTransactions = React.lazy(() => import('./app/trading/pages/admin/AdminTransactions').then(m => ({ default: m.AdminTransactions })));
const TradeAdminSettings = React.lazy(() => import('./app/trading/pages/admin/AdminSettings').then(m => ({ default: m.AdminSettings })));
const TradeCRMSyncPanel = React.lazy(() => import('./app/trading/pages/admin/CRMSyncPanel').then(m => ({ default: m.CRMSyncPanel })));
const TradeAdminDeposits = React.lazy(() => import('./app/trading/pages/admin/AdminDeposits').then(m => ({ default: m.AdminDeposits })));
const TradeAdminWithdrawals = React.lazy(() => import('./app/trading/pages/admin/AdminWithdrawals').then(m => ({ default: m.AdminWithdrawals })));

// Trade Protected Layout
const TradeProtectedLayout = React.lazy(() => import('./app/trading/components/layout/ProtectedRoute').then(m => ({ default: m.ProtectedRoute })));

// ==========================================
// CRM COMPONENTS (Lazy)
// ==========================================
const CRMLayout = React.lazy(() => import('./app/crm/components/Layout').then(m => ({ default: m.Layout })));
const CRMDashboard = React.lazy(() => import('./app/crm/pages/Dashboard').then(m => ({ default: m.Dashboard })));
const CRMManagerDashboard = React.lazy(() => import('./app/crm/pages/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const CRMAgentWorkspace = React.lazy(() => import('./app/crm/pages/AgentWorkspace').then(m => ({ default: m.AgentWorkspace })));
const CRMAdminPanel = React.lazy(() => import('./app/crm/pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const CRMVIPClients = React.lazy(() => import('./app/crm/pages/VIPClients').then(m => ({ default: m.VIPClients })));

const Fallback = () => (
  <div className="flex h-dvh w-full items-center justify-center bg-bg">
    <Loader2 className="w-8 h-8 text-gold animate-spin" />
  </div>
);

// Wrapper to initialize Market Engine for Trading zone
import { TradingProvider } from './app/trading/contexts/TradingContext';

const TradeAppWrapper = () => {
  useMarketEngine();
  // We use TradeProtectedLayout which renders the sidebar/topbar
  return (
    <Suspense fallback={<Fallback />}>
      <TradingProvider>
        <TradeProtectedLayout />
      </TradingProvider>
    </Suspense>
  );
};

// Wrapper for CRM to inject the role into the old Layout component.
// CRM pages (and Layout itself) use useI18n() which requires LanguageProvider.
import { LanguageProvider } from './app/crm/lib/i18n';

const CRMAppWrapper = () => {
  const { role, signOut } = useAuth();

  if (!role) return <Fallback />;

  return (
    <LanguageProvider>
      <Suspense fallback={<Fallback />}>
        <CRMLayout role={role} onLogout={signOut}>
          <Outlet />
        </CRMLayout>
      </Suspense>
    </LanguageProvider>
  );
};


// Smart redirect: admin → /crm/admin, others → /crm/dashboard
const CRMRedirect = () => {
  const { role } = useAuth();
  if (role === 'admin') return <Navigate to="/crm/admin" replace />;
  return <Navigate to="/crm/dashboard" replace />;
};

const NotFoundPage = () => (
  <div className="flex h-dvh w-full items-center justify-center bg-bg px-6">
    <div className="glass-card max-w-xl w-full p-10 text-center border border-accent-primary/20">
      <p className="text-xs uppercase tracking-[0.25em] text-accent-primary mb-3">Bullenhaus</p>
      <h1 className="font-serif text-6xl font-bold gold-gradient-text mb-3">404</h1>
      <h2 className="text-2xl font-bold text-white mb-3">Page not found</h2>
      <p className="text-slate-400 mb-8">The page you requested does not exist or is still being migrated.</p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link to="/trade/dashboard" className="btn-gold">Trading Dashboard</Link>
        <Link to="/crm/dashboard" className="px-5 py-2.5 rounded-xl border border-white/15 text-white hover:bg-white/5">CRM Dashboard</Link>
      </div>
    </div>
  </div>
);

const AppContent = () => {
  return (
    <BrowserRouter>
      <Suspense fallback={<Fallback />}>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<LoginPage />} />
          <Route element={<AuthLayout />}>
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          <Route path="/unauthorized" element={
            <div className="flex h-dvh w-full items-center justify-center bg-bg flex-col gap-5 p-6">
              <h1 className="font-serif text-7xl font-bold gold-gradient-text">403</h1>
              <p className="text-text-muted text-center max-w-sm">You do not have permission to access this area.</p>
              <Link to="/login" className="btn-gold">Return to Login</Link>
            </div>
          } />

          {/* ==========================================
              TRADING CLIENT ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['client', 'admin']} />}>
              <Route path="/trade" element={<Navigate to="/trade/dashboard" replace />} />
              <Route path="/trade" element={<TradeAppWrapper />}>
                <Route path="dashboard" element={<TradeDashboard />} />
                <Route path="markets" element={<TradeMarkets />} />
                <Route path="terminal" element={<TradeTerminal />} />
                <Route path="portfolio" element={<TradePortfolio />} />
                <Route path="transactions" element={<TradeTransactions />} />
                <Route path="referrals" element={<TradeReferrals />} />
                <Route path="kyc" element={<TradeKYC />} />
                <Route path="notifications" element={<TradeNotifications />} />
                <Route path="support" element={<TradeSupport />} />
                <Route path="gamification" element={<TradeGamification />} />
                <Route path="settings" element={<TradeProfileSettings />} />
              </Route>
            </Route>
          </Route>

          {/* ==========================================
              CRM WORKER ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['agent', 'manager', 'director', 'admin']} />}>
              <Route path="/crm" element={<CRMRedirect />} />
              <Route path="/crm" element={<CRMAppWrapper />}>
                <Route path="dashboard" element={<CRMDashboard />} />
                <Route path="manager" element={<CRMManagerDashboard />} />
                <Route path="workspace" element={<CRMAgentWorkspace />} />
                <Route path="clients" element={<CRMVIPClients />} />
                <Route path="admin" element={<CRMAdminPanel />} />
              </Route>
            </Route>
          </Route>

          {/* ==========================================
              TRADE ADMIN ZONE
             ========================================== */}
          <Route element={<AuthGuard />}>
            <Route element={<RoleGuard allowedRoles={['admin', 'trade_admin']} />}>
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin" element={<TradeAdminLayout />}>
                <Route path="dashboard" element={<TradeAdminOverview />} />
                <Route path="users" element={<TradeAdminUsers />} />
                <Route path="kyc" element={<TradeAdminKYC />} />
                <Route path="deposits" element={<TradeAdminDeposits />} />
                <Route path="withdrawals" element={<TradeAdminWithdrawals />} />
                <Route path="market-control" element={<TradeAdminMarketControl />} />
                <Route path="transactions" element={<TradeAdminTransactions />} />
                <Route path="crm-sync" element={<div className="p-8"><TradeCRMSyncPanel /></div>} />
                <Route path="settings" element={<TradeAdminSettings />} />
              </Route>
            </Route>
          </Route>

          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
