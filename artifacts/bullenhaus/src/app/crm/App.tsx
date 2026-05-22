import { lazy, Suspense, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Loader2 } from 'lucide-react';
import { Layout } from "./components/Layout";
import { Login } from "./pages/Login";
import { authStorage, apiLogout, refreshAccessToken } from "./lib/auth";

// Lazy-load every page so each becomes its own JS chunk
const Dashboard          = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Specification      = lazy(() => import('./pages/Specification').then(m => ({ default: m.Specification })));
const VIPClients         = lazy(() => import('./pages/VIPClients').then(m => ({ default: m.VIPClients })));
const CallCenter         = lazy(() => import('./pages/CallCenter').then(m => ({ default: m.CallCenter })));
const TradingIntelligence = lazy(() => import('./pages/TradingIntelligence').then(m => ({ default: m.TradingIntelligence })));
const AdminPanel         = lazy(() => import('./pages/AdminPanel').then(m => ({ default: m.AdminPanel })));
const ManagerDashboard   = lazy(() => import('./pages/ManagerDashboard').then(m => ({ default: m.ManagerDashboard })));
const AgentWorkspace     = lazy(() => import('./pages/AgentWorkspace').then(m => ({ default: m.AgentWorkspace })));
const Reports            = lazy(() => import('./pages/Reports').then(m => ({ default: m.Reports })));
const Advertisers        = lazy(() => import('./pages/Advertisers').then(m => ({ default: m.Advertisers })));
const DataManagement     = lazy(() => import('./pages/DataManagement').then(m => ({ default: m.DataManagement })));

const PageFallback = () => (
  <div className="flex h-64 w-full items-center justify-center">
    <Loader2 className="w-6 h-6 text-aura-gold animate-spin" />
  </div>
);

export default function App() {
  const [role, setRole] = useState<string | null>(() => authStorage.getRole());

  useEffect(() => {
    refreshAccessToken().then(token => {
      if (!token) {
        authStorage.clear();
        setRole(null);
      } else {
        const storedRole = authStorage.getRole();
        if (storedRole) setRole(storedRole);
      }
    });
  }, []);

  const handleLogin = (r: string) => setRole(r);

  const handleLogout = async () => {
    await apiLogout();
    setRole(null);
  };

  return (
    <BrowserRouter basename="/crm">
      {!role ? (
        <Login onLogin={handleLogin} />
      ) : (
        <Layout role={role} onLogout={handleLogout}>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {role === 'director' && <Route path="/" element={<Dashboard />} />}
              {role === 'admin'    && <Route path="/" element={<AdminPanel />} />}
              {role === 'manager'  && <Route path="/" element={<ManagerDashboard />} />}
              {role === 'agent'    && <Route path="/" element={<AgentWorkspace />} />}

              <Route path="/clients"      element={<VIPClients />} />
              <Route path="/call-center"  element={<CallCenter />} />
              <Route path="/trading"      element={<TradingIntelligence />} />
              <Route path="/spec"         element={<Specification />} />
              <Route path="/reports"      element={<Reports />} />
              {(role === 'admin' || role === 'director') && (
                <Route path="/advertisers"     element={<Advertisers />} />
              )}
              {(role === 'admin' || role === 'director') && (
                <Route path="/data-management" element={<DataManagement />} />
              )}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      )}
    </BrowserRouter>
  );
}
